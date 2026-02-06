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
        // 1. Todas las campañas con sus productos
        const campanas = await prisma.campana.findMany({
            include: {
                detalles: {
                    include: {
                        producto: { select: { nombre: true } },
                    },
                },
            },
            orderBy: { creadoEn: "desc" },
        });

        // 2. Impacto de descuentos: total de descuentos otorgados en ventas
        const descuentosVentas = await prisma.venta.aggregate({
            where: { estado: "COMPLETADO" },
            _sum: { descuentoTotal: true, total: true },
        });

        const descuentosItems = await prisma.itemVenta.aggregate({
            where: {
                tieneDescuento: true,
                venta: { estado: "COMPLETADO" },
            },
            _sum: { descuentoMonto: true },
            _count: true,
        });

        // 3. Preparar datos de campañas
        const campanasData = campanas.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            descripcion: c.descripcion,
            tipo: c.tipo,
            valor: Number(c.valor),
            estado: c.estado,
            inicio: c.startsAt,
            fin: c.endsAt,
            productosCount: c.detalles.length,
            productos: c.detalles.slice(0, 5).map((d) => d.producto.nombre),
        }));

        // 4. Campañas activas actualmente
        const ahora = new Date();
        const campanasActivas = campanas.filter(
            (c) => c.estado === "ACTIVO" || (c.startsAt <= ahora && c.endsAt >= ahora)
        );

        // 5. Agrupar por estado
        const porEstado: Record<string, number> = {};
        campanas.forEach((c) => {
            porEstado[c.estado] = (porEstado[c.estado] || 0) + 1;
        });

        const estadosData = Object.entries(porEstado).map(([estado, cantidad]) => ({
            estado,
            cantidad,
        }));

        return NextResponse.json({
            resumen: {
                totalCampanas: campanas.length,
                campanasActivas: campanasActivas.length,
                descuentosTotales: Number(descuentosVentas._sum.descuentoTotal || 0),
                ingresosTotales: Number(descuentosVentas._sum.total || 0),
                itemsConDescuento: descuentosItems._count,
            },
            campanas: campanasData,
            estadosData,
        });
    } catch (error) {
        console.error("Error en reporte de campañas:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}
