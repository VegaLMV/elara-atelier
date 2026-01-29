export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { slugify } from "@/lib/slugify";

async function slugUnicoParaEdicion(nombre: string, excluirProductoId: string) {
  const base = slugify(nombre);
  let slug = base;
  let i = 1;

  while (true) {
    const encontrado = await prisma.producto.findUnique({ where: { slug } });
    if (!encontrado || encontrado.id === excluirProductoId) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      imagenes: true,
      variantes: { include: { talla: true, color: true } },
    },
  });

  if (!producto) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(producto);
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const nombre = String(body?.nombre ?? "").trim();
  const descripcion = String(body?.descripcion ?? "").trim();
  const precio = body?.precio;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  if (precio === undefined || precio === null || isNaN(Number(precio))) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const slug = await slugUnicoParaEdicion(nombre, id);

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      nombre,
      slug,
      descripcion: descripcion || null,
      precio: String(precio),
      estado: body?.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
      destacado: Boolean(body?.destacado),
      categoriaId: body?.categoriaId || null,
    },
  });

  return NextResponse.json(producto);
}
