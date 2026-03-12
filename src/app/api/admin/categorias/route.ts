import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { slugify } from "@/lib/slugify";

export async function POST(request: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const { nombre } = await request.json();
    if (!nombre) return new NextResponse("Nombre es requerido", { status: 400 });

    const slug = slugify(nombre);

    const categoria = await prisma.categoria.create({
      data: { nombre, slug }
    });

    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json({ error: "Error al crear categoría (posible duplicado)" }, { status: 500 });
  }
}