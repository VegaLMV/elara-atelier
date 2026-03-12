export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function GET(req: Request) {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    try {
        const productos = await prisma.producto.findMany({
            where: {
                estado: "ACTIVO",
                nombre: { contains: q, mode: "insensitive" }
            },
            take: 8,
            select: {
                id: true,
                nombre: true,
                precio: true,
                descuentoActivo: true,
                descuentoTipo: true,
                descuentoValor: true,
                descuentoInicio: true, 
                descuentoFin: true,
                imagenes: {
                    where: { esPortada: true },
                    take: 1,
                    select: { url: true }
                },
                variantes: {
                    where: { activa: true },
                    select: {
                        id: true,
                        stockActual: true,
                        talla: { select: { nombre: true } },
                        color: { select: { nombre: true, hex: true } }
                    },
                    orderBy: { talla: { orden: 'asc' } }
                }
            }
        });

        return NextResponse.json(productos);
    } catch (error) {
        console.error("Error en búsqueda de productos:", error);
        return NextResponse.json({ error: "Error al buscar productos" }, { status: 500 });
    }
}