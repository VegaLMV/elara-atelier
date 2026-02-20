import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const [productosDb, clientesDb, categoriasDb, empaquesDb] = await Promise.all([
            prisma.producto.findMany({
                where: { estado: "ACTIVO" },
                select: {
                    id: true,
                    nombre: true,
                    precio: true,
                    categoriaId: true,
                    descuentoActivo: true,
                    descuentoTipo: true,
                    descuentoValor: true,
                    imagenes: { where: { esPortada: true }, take: 1, select: { url: true } },
                    variantes: {
                        where: { activa: true },
                        select: {
                            id: true,
                            talla: { select: { nombre: true } },
                            color: { select: { nombre: true, hex: true } },
                            stockActual: true,
                        }
                    }
                },
                orderBy: { nombre: "asc" }
            }),
            prisma.cliente.findMany({
                orderBy: { creadoEn: "desc" },
                take: 20,
                select: {
                    id: true,
                    nombre: true,
                    telefono: true,
                    dni: true,
                    direccion: true,
                    distrito: true,
                    provincia: true,
                    departamento: true,
                    referencia: true
                }
            }),
            prisma.categoria.findMany({
                orderBy: { nombre: "asc" },
                select: { id: true, nombre: true }
            }),
            prisma.tipoEmpaque.findMany({
                where: { activo: true },
                select: {
                    id: true,
                    nombre: true,
                    costoUnitario: true,
                    stock: true,
                    imagenUrl: true
                },
                orderBy: { nombre: "asc" }
            })
        ]);

        const productos = productosDb.map(p => ({
            id: p.id,
            nombre: p.nombre,
            precioBase: Number(p.precio),
            categoriaId: p.categoriaId,
            imagen: p.imagenes[0]?.url || null,
            descuento: p.descuentoActivo ? {
                tipo: p.descuentoTipo,
                valor: Number(p.descuentoValor)
            } : null,
            variantes: p.variantes.map(v => ({
                id: v.id,
                talla: v.talla.nombre,
                color: v.color.nombre,
                hex: v.color.hex,
                stock: v.stockActual
            }))
        }));

        const empaques = empaquesDb.map(e => ({
            id: e.id,
            nombre: e.nombre,
            costoUnitario: Number(e.costoUnitario),
            stock: e.stock,
            imagenUrl: e.imagenUrl
        }));

        return NextResponse.json({
            productos,
            clientes: clientesDb,
            categorias: categoriasDb,
            empaques
        });
    } catch (error) {
        return NextResponse.json({ error: "Error loading master data" }, { status: 500 });
    }
}
