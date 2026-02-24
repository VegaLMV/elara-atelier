export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { slugify } from "@/lib/slugify";
import { parseDescuentoFromBody } from "@/lib/precios";

async function slugUnico(nombre: string) {
  const base = slugify(nombre);
  let slug = base;
  let i = 1;

  while (await prisma.producto.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}


export async function GET() {
  const sesion = await sesionAdmin();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        precio: true,
        estado: true,
        destacado: true,
        descuentoActivo: true,
        descuentoTipo: true,
        descuentoValor: true,
        descuentoInicio: true,
        descuentoFin: true,
        creadoEn: true,
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: { id: true, url: true, esPortada: true },
          orderBy: { orden: "asc" },
          take: 1
        },
        _count: { select: { variantes: true } }
      },
      orderBy: { creadoEn: "desc" },
    });
    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error GET productos:", error);
    return NextResponse.json({ error: "Error al listar productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const nombre = String(body?.nombre ?? "").trim();
    const descripcion = String(body?.descripcion ?? "").trim();
    const precio = body?.precio;

    if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    if (precio === undefined || precio === null || isNaN(Number(precio))) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }

    const desc = parseDescuentoFromBody(body);
    if (desc?.error) return NextResponse.json({ error: desc.error }, { status: 400 });

    const slug = await slugUnico(nombre);

    const producto = await prisma.producto.create({
      data: {
        nombre,
        slug,
        descripcion: descripcion || null,
        precio: String(precio),
        estado: "INACTIVO",
        destacado: false,
        categoriaId: body?.categoriaId ? String(body.categoriaId) : null,
        descuentoActivo: desc.descuentoActivo,
        descuentoTipo: desc.descuentoTipo as any,
        descuentoValor: desc.descuentoValor,
        descuentoInicio: desc.descuentoInicio,
        descuentoFin: desc.descuentoFin,
      },
    });

    return NextResponse.json({ id: producto.id }, { status: 201 });
  } catch (error) {
    console.error("Error POST producto:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
