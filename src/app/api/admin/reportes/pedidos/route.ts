import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const admin = await sesionAdmin();
    if (!admin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Rango por defecto: últimos 30 días
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    const from = fromParam ? new Date(fromParam) : hace30Dias;
    const to = toParam ? new Date(`${toParam}T23:59:59.999`) : hoy;

    const where = {
        creadoEn: { gte: from, lte: to }
    };

    try {
        // 1. RESUMEN (KPIs)
        const [
            totalPedidos,
            pedidosConVenta,
            pedidosCancelados,
            pedidosPendientes,
            stats,
            pedidos,
            countPorEstado,
            countPorDepartamento
        ] = await Promise.all([
            prisma.pedido.count({ where }),
            prisma.pedido.count({ where: { ...where, venta: { isNot: null } } }),
            prisma.pedido.count({ where: { ...where, estado: "CANCELADO" } }),
            prisma.pedido.count({ where: { ...where, estado: "PENDIENTE" } }),
            prisma.pedido.aggregate({
                where,
                _sum: { total: true },
                _avg: { costoEnvio: true }
            }),
            // Para evolución
            prisma.pedido.findMany({
                where,
                select: { creadoEn: true, total: true },
                orderBy: { creadoEn: "asc" }
            }),
            // Para estados
            prisma.pedido.groupBy({
                by: ["estado"],
                where,
                _count: true
            }),
            // Para regiones
            prisma.pedido.groupBy({
                by: ["departamento"],
                where,
                _count: true,
                orderBy: { _count: { departamento: "desc" } },
                take: 10
            })
        ]);

        // 2. PROCESAMIENTO DE EVOLUCIÓN (Líneas)
        const evolucionMap: Record<string, { fecha: string; cantidad: number; monto: number }> = {};
        pedidos.forEach(p => {
            const fechaKey = p.creadoEn.toISOString().split("T")[0];
            if (!evolucionMap[fechaKey]) {
                evolucionMap[fechaKey] = { fecha: fechaKey, cantidad: 0, monto: 0 };
            }
            evolucionMap[fechaKey].cantidad += 1;
            evolucionMap[fechaKey].monto += Number(p.total || 0);
        });
        const evolucion = Object.values(evolucionMap);

        // 3. DETALLE GEOGRÁFICO (Agrupado por departamento y distrito)
        const distritosStats = await prisma.pedido.groupBy({
            by: ["departamento", "distrito"],
            where,
            _count: true,
            _avg: { costoEnvio: true },
            orderBy: [
                { departamento: "asc" },
                { _count: { departamento: "desc" } }
            ]
        });

        const detalleGeografico = distritosStats.map(ds => ({
            departamento: ds.departamento || "S/D",
            distrito: ds.distrito || "S/D",
            cantidad: ds._count,
            promedioEnvio: Number(ds._avg.costoEnvio || 0)
        }));

        // 4. RESULTADO FINAL
        return NextResponse.json({
            resumen: {
                totalPedidos,
                montoProyectado: Number(stats._sum.total || 0),
                tasaConversion: totalPedidos > 0 ? (pedidosConVenta / totalPedidos) * 100 : 0,
                tasaCancelacion: totalPedidos > 0 ? (pedidosCancelados / totalPedidos) * 100 : 0,
                pedidosPendientes,
                ticketPromedioEnvio: Number(stats._avg.costoEnvio || 0)
            },
            estados: countPorEstado.map(e => ({
                estado: e.estado,
                cantidad: e._count
            })),
            evolucion,
            topRegiones: countPorDepartamento.map(d => ({
                departamento: d.departamento || "Sin Departamento",
                cantidad: d._count
            })),
            detalleGeografico
        });

    } catch (error) {
        console.error("Error en reporte de pedidos:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}
