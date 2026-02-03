import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { slugify } from "@/lib/slugify";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });
  const { id } = await params;

  try {
    const { nombre } = await request.json();
    const slug = slugify(nombre);

    const categoria = await prisma.categoria.update({
      where: { id },
      data: { nombre, slug }
    });

    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json({ error: "Error actualizando" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });
  const { id } = await params;

  try {
    await prisma.categoria.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "No se puede eliminar (probablemente tiene productos)" }, { status: 500 });
  }
}