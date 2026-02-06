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
        // 1. Variantes con stock bajo (stockActual < stockMinimo)
        const variantesStockBajo = await prisma.variante.findMany({
            where: {
                activa: true,
                stockActual: { lt: prisma.variante.fields.stockMinimo },
            },
            include: {
                producto: { select: { nombre: true, precio: true } },
                talla: { select: { nombre: true } },
                color: { select: { nombre: true, hex: true } },
            },
            orderBy: { stockActual: "asc" },
            take: 50,
        });

        // Alternativa manual para el filtro
        const todasVariantes = await prisma.variante.findMany({
            where: { activa: true },
            include: {
                producto: { select: { nombre: true, precio: true, estado: true } },
                talla: { select: { nombre: true } },
                color: { select: { nombre: true, hex: true } },
            },
        });

        const stockBajo = todasVariantes
            .filter((v) => v.stockActual < v.stockMinimo && v.producto.estado === "ACTIVO")
            .sort((a, b) => a.stockActual - b.stockActual)
            .slice(0, 20);

        // 2. Stock total por categoría
        const productosConCategoria = await prisma.producto.findMany({
            where: { estado: "ACTIVO" },
            include: {
                categoria: { select: { nombre: true } },
                variantes: { select: { stockActual: true } },
            },
        });

        const stockPorCategoria: Record<string, number> = {};
        productosConCategoria.forEach((p) => {
            const cat = p.categoria?.nombre || "Sin Categoría";
            const stockTotal = p.variantes.reduce((sum, v) => sum + v.stockActual, 0);
            stockPorCategoria[cat] = (stockPorCategoria[cat] || 0) + stockTotal;
        });

        const categorias = Object.entries(stockPorCategoria).map(([categoria, stock]) => ({
            categoria,
            stock,
        }));

        // 3. Valorización del inventario
        const valorizacion = todasVariantes.reduce((acc, v) => {
            if (v.producto.estado === "ACTIVO") {
                const precio = Number(v.producto.precio);
                return acc + v.stockActual * precio;
            }
            return acc;
        }, 0);

        const stockTotal = todasVariantes.reduce((acc, v) => acc + v.stockActual, 0);
        const variantesActivas = todasVariantes.filter((v) => v.producto.estado === "ACTIVO").length;
        const variantesSinStock = todasVariantes.filter((v) => v.stockActual === 0).length;

        // 4. Preparar datos de stock bajo para respuesta
        const alertasStock = stockBajo.map((v) => ({
            producto: v.producto.nombre,
            talla: v.talla.nombre,
            color: v.color.nombre,
            colorHex: v.color.hex || "#ccc",
            stockActual: v.stockActual,
            stockMinimo: v.stockMinimo,
            valorUnitario: Number(v.producto.precio),
        }));

        return NextResponse.json({
            resumen: {
                valorizacionTotal: valorizacion,
                stockTotal,
                variantesActivas,
                variantesSinStock,
                alertasStockBajo: stockBajo.length,
            },
            stockPorCategoria: categorias,
            alertasStock,
        });
    } catch (error) {
        console.error("Error en reporte de inventario:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}
