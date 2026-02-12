import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; imagenId: string }> }
) {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });
    const { imagenId } = await params;

    try {
        await prisma.imagenCategoria.delete({
            where: { id: imagenId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error eliminando imagen" }, { status: 500 });
    }
}
