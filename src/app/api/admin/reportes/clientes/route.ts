import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET() {
    const admin = await sesionAdmin();
    if (!admin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        // 1. Clientes con más compras (top 20)
        const ventasPorCliente = await prisma.venta.groupBy({
            by: ["clienteId"],
            where: {
                clienteId: { not: null },
                estado: "COMPLETADO",
            },
            _sum: { total: true },
            _count: true,
            orderBy: { _sum: { total: "desc" } },
            take: 20,
        });

        const clienteIds = ventasPorCliente
            .map((v) => v.clienteId)
            .filter((id): id is string => id !== null);

        const clientes = await prisma.cliente.findMany({
            where: { id: { in: clienteIds } },
        });

        const clientesMap = new Map(clientes.map((c) => [c.id, c]));

        const topClientes = ventasPorCliente.map((v) => {
            const cliente = clientesMap.get(v.clienteId!);
            return {
                id: v.clienteId,
                nombre: cliente?.nombre || "Desconocido",
                telefono: cliente?.telefono || "",
                email: cliente?.email || "",
                departamento: cliente?.departamento || "",
                totalCompras: Number(v._sum.total || 0),
                cantidadVentas: v._count,
            };
        });

        // 2. Distribución por departamento
        const clientesPorDepartamento = await prisma.cliente.groupBy({
            by: ["departamento"],
            _count: true,
            orderBy: { _count: { departamento: "desc" } },
        });

        const distribucionGeografica = clientesPorDepartamento
            .filter((d) => d.departamento)
            .map((d) => ({
                departamento: d.departamento || "Sin especificar",
                cantidad: d._count,
            }));

        // 3. Saldos a favor pendientes
        const clientesConSaldo = await prisma.cliente.findMany({
            where: {
                saldoAFavor: { gt: 0 },
            },
            orderBy: { saldoAFavor: "desc" },
            take: 20,
        });

        const saldosPendientes = clientesConSaldo.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono || "",
            saldo: Number(c.saldoAFavor),
        }));

        const totalSaldosPendientes = saldosPendientes.reduce((acc, s) => acc + s.saldo, 0);

        // 4. Métricas generales
        const totalClientes = await prisma.cliente.count();
        const clientesConCompras = ventasPorCliente.length;

        return NextResponse.json({
            resumen: {
                totalClientes,
                clientesConCompras,
                saldosTotalesPendientes: totalSaldosPendientes,
                clientesConSaldo: clientesConSaldo.length,
            },
            topClientes,
            distribucionGeografica,
            saldosPendientes,
        });
    } catch (error) {
        console.error("Error en reporte de clientes:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}
