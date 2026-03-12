import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });
    const { id: categoriaId } = await params;

    try {
        const { url } = await request.json();
        if (!url) return new NextResponse("URL requerida", { status: 400 });

        const maxOrden = await prisma.imagenCategoria.findFirst({
            where: { categoriaId },
            orderBy: { orden: "desc" },
            select: { orden: true }
        });

        const imagen = await prisma.imagenCategoria.create({
            data: {
                categoriaId,
                url,
                orden: (maxOrden?.orden ?? -1) + 1,
                esPortada: false
            }
        });

        return NextResponse.json(imagen);
    } catch (error) {
        return NextResponse.json({ error: "Error al agregar imagen" }, { status: 500 });
    }
}
