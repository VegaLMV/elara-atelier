import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; imagenId: string }> }
) {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });
    const { id: categoriaId, imagenId } = await params;

    try {
        // Primero, quitar la portada de todas las imágenes de esta categoría
        await prisma.imagenCategoria.updateMany({
            where: { categoriaId },
            data: { esPortada: false }
        });

        // Luego, marcar esta como portada
        const imagen = await prisma.imagenCategoria.update({
            where: { id: imagenId },
            data: { esPortada: true }
        });

        return NextResponse.json(imagen);
    } catch (error) {
        return NextResponse.json({ error: "Error actualizando portada" }, { status: 500 });
    }
}
