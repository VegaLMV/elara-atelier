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
        // 1. Única consulta maestra: Traemos todas las variantes de productos ACTIVOS
        // Incluimos imagenesColor para poder filtrar la foto por variante más adelante
        const todasVariantes = await prisma.variante.findMany({
            where: { 
                activa: true,
                producto: { estado: "ACTIVO" } 
            },
            include: {
                producto: {
                    include: {
                        categoria: { select: { nombre: true } },
                        imagenes: { select: { url: true }, take: 1 }, // SE AGREGÓ LA COMA AQUÍ
                        imagenesColor: true // Relación con las fotos por color
                    }
                },
                talla: { select: { nombre: true } },
                color: { select: { nombre: true, hex: true } },
            },
        });

        // 2. Filtrar stock bajo y ORDENAR ALFABÉTICAMENTE por nombre de producto
        const stockBajo = todasVariantes
            .filter((v) => v.stockActual < v.stockMinimo)
            .sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));

        // 3. Cálculos de resumen en una sola pasada
        let valorizacionTotal = 0;
        let stockTotal = 0;
        let variantesSinStock = 0;
        const stockPorCategoria: Record<string, number> = {};
        const stockPorProducto: Record<string, number> = {};

        todasVariantes.forEach((v) => {
            const precio = Number(v.producto.precio);
            const cantidad = v.stockActual;
            const catNombre = v.producto.categoria?.nombre || "Sin Categoría";
            const prodNombre = v.producto.nombre;

            valorizacionTotal += cantidad * precio;
            stockTotal += cantidad;
            if (cantidad === 0) variantesSinStock++;

            stockPorCategoria[catNombre] = (stockPorCategoria[catNombre] || 0) + cantidad;
            stockPorProducto[prodNombre] = (stockPorProducto[prodNombre] || 0) + cantidad;
        });

        // 4. Preparar datos de stock bajo con imagen por color
        const variantIds = stockBajo.map(v => v.id);
        const comprasRecientes = await prisma.itemCompra.findMany({
            where: {
                varianteId: { in: variantIds },
                compra: { estado: "RECIBIDO" }
            },
            include: { compra: { include: { proveedor: true } } },
            orderBy: { compra: { fechaCompra: "desc" } }
        });

        const alertasStock = stockBajo.map((v) => {
            const itemCompra = comprasRecientes.find((it) => it.varianteId === v.id);
            const proveedor = itemCompra?.compra?.proveedor;
            
            // LÓGICA DE IMAGEN: Buscamos en imagenesColor la que coincida con el colorId de la variante
            const imgPorColor = v.producto.imagenesColor.find(ic => ic.colorId === v.colorId);
            const imagenFinal = imgPorColor?.url || v.producto.imagenes[0]?.url || null;

            return {
                id: v.id,
                producto: v.producto.nombre,
                talla: v.talla.nombre,
                color: v.color.nombre,
                colorHex: v.color.hex || "#ccc",
                stockActual: v.stockActual,
                stockMinimo: v.stockMinimo,
                valorUnitario: Number(v.producto.precio),
                imagenUrl: imagenFinal, // URL de la imagen del color específico
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
                valorizacionTotal,
                stockTotal,
                variantesActivas: todasVariantes.length,
                variantesSinStock,
                alertasStockBajo: stockBajo.length,
            },
            stockPorCategoria: Object.entries(stockPorCategoria).map(([categoria, stock]) => ({ categoria, stock })),
            stockPorProducto: Object.entries(stockPorProducto)
                .map(([producto, stock]) => ({ producto, stock }))
                .sort((a, b) => b.stock - a.stock)
                .slice(0, 10),
            alertasStock,
        });

    } catch (error) {
        console.error("Error en reporte de inventario:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}