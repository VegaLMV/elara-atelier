export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { slugify } from "@/lib/slugify";

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
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const productos = await prisma.producto.findMany({
    orderBy: { creadoEn: "desc" },
    include: { categoria: true, variantes: true },
  });

  return NextResponse.json(productos);
}

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const nombre = String(body?.nombre ?? "").trim();
  const descripcion = String(body?.descripcion ?? "").trim();
  const precio = body?.precio;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  if (precio === undefined || precio === null || isNaN(Number(precio))) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const slug = await slugUnico(nombre);

  const producto = await prisma.producto.create({
    data: {
      nombre,
      slug,
      descripcion: descripcion || null,
      precio: String(precio),
      estado: "ACTIVO",
      destacado: false,
      categoriaId: body?.categoriaId || null,
    },
  });

  return NextResponse.json({ id: producto.id }, { status: 201 });
  
}
