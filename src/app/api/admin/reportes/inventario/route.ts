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
                producto: {
                    select: {
                        nombre: true,
                        precio: true,
                        estado: true,
                        imagenes: { select: { url: true }, take: 1 }
                    }
                },
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

        // 3. Stock total por producto (Top 10)
        const stockPorProducto: Record<string, number> = {};
        productosConCategoria.forEach((p) => {
            const stockTotal = p.variantes.reduce((sum, v) => sum + v.stockActual, 0);
            stockPorProducto[p.nombre] = (stockPorProducto[p.nombre] || 0) + stockTotal;
        });

        const productos = Object.entries(stockPorProducto)
            .map(([producto, stock]) => ({ producto, stock }))
            .sort((a, b) => b.stock - a.stock)
            .slice(0, 10);

        // 4. Valorización del inventario
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

        // 5. Preparar datos de stock bajo con información del proveedor (Optimizado para evitar MaxClientsInSessionMode)
        const variantIds = stockBajo.map(v => v.id);

        // Obtener de golpe todas las compras recibidas que contienen estos items
        const comprasRecientes = await prisma.itemCompra.findMany({
            where: {
                varianteId: { in: variantIds },
                compra: { estado: "RECIBIDO" }
            },
            include: {
                compra: {
                    include: { proveedor: true }
                }
            },
            orderBy: {
                compra: { fechaCompra: "desc" }
            }
        });

        const alertasStock = stockBajo.map((v) => {
            // Encontrar la compra más reciente para esta variante específica en el set ya cargado
            const itemCompra = comprasRecientes.find((it: any) => it.varianteId === v.id);
            const proveedor = itemCompra?.compra?.proveedor;

            return {
                id: v.id,
                producto: v.producto.nombre,
                talla: v.talla.nombre,
                color: v.color.nombre,
                colorHex: v.color.hex || "#ccc",
                stockActual: v.stockActual,
                stockMinimo: v.stockMinimo,
                valorUnitario: Number(v.producto.precio),
                imagenUrl: v.producto.imagenes[0]?.url || null,
                proveedor: proveedor ? {
                    nombre: proveedor.nombre,
                    ruc: proveedor.ruc,
                    razonSocial: proveedor.razonSocial,
                    telefono: proveedor.telefono,
                    provincia: proveedor.provincia,
                    distrito: proveedor.distrito,
                    direccion: proveedor.direccion,
                } : null
            };
        });

        return NextResponse.json({
            resumen: {
                valorizacionTotal: valorizacion,
                stockTotal,
                variantesActivas,
                variantesSinStock,
                alertasStockBajo: stockBajo.length,
            },
            stockPorCategoria: categorias,
            stockPorProducto: productos,
            alertasStock,
        });
    } catch (error) {
        console.error("Error en reporte de inventario:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}
