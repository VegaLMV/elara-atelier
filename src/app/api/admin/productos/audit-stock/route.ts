import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function GET(request: Request) {
    const admin = await sesionAdmin();
    if (!admin) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get("categoriaId");

    try {
        const whereClause: any = {
            estado: "ACTIVO",
        };

        if (categoriaId) {
            whereClause.categoriaId = categoriaId;
        }

        const productos = await prisma.producto.findMany({
            where: whereClause,
            include: {
                categoria: { select: { nombre: true } },
                variantes: {
                    where: { activa: true },
                    include: {
                        talla: { select: { nombre: true } },
                        color: { select: { nombre: true } }
                    },
                    orderBy: [
                        { talla: { orden: "asc" } },
                        { color: { nombre: "asc" } }
                    ]
                }
            },
            orderBy: [
                { categoria: { nombre: "asc" } },
                { nombre: "asc" }
            ]
        });

        // Group by category for easier PDF generation
        const grouped = productos.reduce((acc: any, prod) => {
            const catName = prod.categoria?.nombre || "Sin Categoría";
            if (!acc[catName]) {
                acc[catName] = [];
            }
            acc[catName].push({
                id: prod.id,
                nombre: prod.nombre,
                variantes: prod.variantes.map(v => ({
                    id: v.id,
                    talla: v.talla.nombre,
                    color: v.color.nombre,
                    stockActual: v.stockActual
                }))
            });
            return acc;
        }, {});

        return NextResponse.json(grouped);
    } catch (error) {
        console.error("Error fetching audit data:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
