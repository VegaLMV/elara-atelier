import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const admin = await sesionAdmin();
    if (!admin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const hoy = new Date();
    const hace90Dias = new Date(hoy);
    hace90Dias.setDate(hoy.getDate() - 90);

    const from = fromParam ? new Date(fromParam) : hace90Dias;
    const to = toParam ? new Date(`${toParam}T23:59:59.999`) : hoy;

    try {
        // 1. Compras por proveedor
        const comprasPorProveedor = await prisma.compra.groupBy({
            by: ["proveedorId"],
            where: {
                fechaCompra: { gte: from, lte: to },
                estado: "RECIBIDO",
                proveedorId: { not: null },
            },
            _count: true,
        });

        // Obtener totales de items por compra
        const compras = await prisma.compra.findMany({
            where: {
                fechaCompra: { gte: from, lte: to },
                estado: "RECIBIDO",
            },
            include: {
                proveedor: { select: { nombre: true } },
                items: { select: { cantidad: true, costoUnitario: true } },
            },
        });

        // Agrupar por proveedor
        const proveedorTotales: Record<string, { nombre: string; total: number; compras: number }> = {};
        compras.forEach((c) => {
            const provId = c.proveedorId || "sin-proveedor";
            const provNombre = c.proveedor?.nombre || "Sin Proveedor";
            const totalCompra = c.items.reduce(
                (acc, item) => acc + item.cantidad * Number(item.costoUnitario),
                0
            );

            if (!proveedorTotales[provId]) {
                proveedorTotales[provId] = { nombre: provNombre, total: 0, compras: 0 };
            }
            proveedorTotales[provId].total += totalCompra;
            proveedorTotales[provId].compras += 1;
        });

        const proveedores = Object.values(proveedorTotales)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        // 2. Total general de compras
        const totalCompras = compras.reduce((acc, c) => {
            const totalCompra = c.items.reduce(
                (sum, item) => sum + item.cantidad * Number(item.costoUnitario),
                0
            );
            return acc + totalCompra;
        }, 0);

        // 3. Historial de costos (últimas 50 compras con detalle)
        const itemsRecientes = await prisma.itemCompra.findMany({
            where: {
                compra: {
                    fechaCompra: { gte: from, lte: to },
                    estado: "RECIBIDO",
                },
                variante: { isNot: null },
            },
            include: {
                compra: { select: { fechaCompra: true } },
                variante: {
                    include: {
                        producto: { select: { nombre: true } },
                        talla: { select: { nombre: true } },
                        color: { select: { nombre: true } },
                    },
                },
            },
            orderBy: { compra: { fechaCompra: "desc" } },
            take: 50,
        });

        const historialCostos = itemsRecientes.map((item) => ({
            fecha: item.compra.fechaCompra,
            producto: item.variante?.producto.nombre || "N/A",
            talla: item.variante?.talla.nombre || "",
            color: item.variante?.color.nombre || "",
            cantidad: item.cantidad,
            costoUnitario: Number(item.costoUnitario),
        }));

        return NextResponse.json({
            resumen: {
                totalCompras,
                cantidadCompras: compras.length,
                proveedoresActivos: Object.keys(proveedorTotales).length,
            },
            comprasPorProveedor: proveedores,
            historialCostos,
            filtros: { from: from.toISOString(), to: to.toISOString() },
        });
    } catch (error) {
        console.error("Error en reporte de compras:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}
