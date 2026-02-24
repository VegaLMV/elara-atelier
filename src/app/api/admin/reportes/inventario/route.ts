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
        // 1. Consultas maestras: Traemos todas las variantes y las estancadas (sin ventas en 60 días)
        const hace60Dias = new Date();
        hace60Dias.setDate(hace60Dias.getDate() - 60);

        const [todasVariantes, estancadasDB] = await Promise.all([
            prisma.variante.findMany({
                where: {
                    activa: true,
                    producto: { estado: "ACTIVO" }
                },
                include: {
                    producto: {
                        include: {
                            categoria: { select: { nombre: true } },
                            imagenes: { select: { url: true }, take: 1 },
                            imagenesColor: true
                        }
                    },
                    talla: { select: { nombre: true } },
                    color: { select: { nombre: true, hex: true } },
                },
            }),
            prisma.variante.findMany({
                where: {
                    stockActual: { gt: 0 },
                    NOT: {
                        itemsVenta: {
                            some: {
                                venta: {
                                    fechaVenta: { gte: hace60Dias },
                                    estado: "COMPLETADO"
                                }
                            }
                        }
                    }
                },
                include: {
                    producto: { select: { nombre: true, precio: true, imagenes: { select: { url: true }, take: 1 } } },
                    talla: { select: { nombre: true } },
                    color: { select: { nombre: true, hex: true } },
                    itemsVenta: {
                        where: { venta: { estado: "COMPLETADO" } },
                        orderBy: { venta: { fechaVenta: "desc" } },
                        take: 1,
                        select: { venta: { select: { fechaVenta: true } } }
                    }
                }
            })
        ]);

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
                imagenUrl: imagenFinal,
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

        // 5. Formatear Variantes Estancadas
        const variantesEstancadas = estancadasDB.map(v => ({
            id: v.id,
            producto: v.producto.nombre,
            talla: v.talla.nombre,
            color: v.color.nombre,
            colorHex: v.color.hex,
            stockActual: v.stockActual,
            precio: Number(v.producto.precio),
            imagenUrl: v.producto.imagenes[0]?.url || null,
            ultimaVenta: v.itemsVenta[0]?.venta?.fechaVenta || null
        }));

        return NextResponse.json({
            resumen: {
                valorizacionTotal,
                stockTotal,
                variantesActivas: todasVariantes.length,
                variantesSinStock,
                alertasStockBajo: stockBajo.length,
                variantesEstancadas: estancadasDB.length,
            },
            stockPorCategoria: Object.entries(stockPorCategoria).map(([categoria, stock]) => ({ categoria, stock })),
            stockPorProducto: Object.entries(stockPorProducto)
                .map(([producto, stock]) => ({ producto, stock }))
                .sort((a, b) => b.stock - a.stock)
                .slice(0, 10),
            alertasStock,
            variantesEstancadas,
        });

    } catch (error) {
        console.error("Error en reporte de inventario:", error);
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
    }
}