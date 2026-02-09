export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

function parseFechaYYYYMMDD(s: any) {
  const t = String(s ?? "").trim();
  if (!t) return null;
  return new Date(`${t}T12:00:00`);
}

function parseDescuento(body: any) {
  const descuentoActivo = Boolean(body?.descuentoActivo);

  if (!descuentoActivo) {
    return {
      descuentoActivo: false,
      descuentoTipo: null,
      descuentoValor: null,
      descuentoInicio: null,
      descuentoFin: null,
      error: null as string | null,
    };
  }

  const tipo = String(body?.descuentoTipo ?? "").trim().toUpperCase();
  if (tipo !== "PORCENTAJE" && tipo !== "MONTO") {
    return { error: "descuentoTipo inválido (PORCENTAJE | MONTO)" };
  }

  const rawVal = body?.descuentoValor;
  const valNum = Number(rawVal);
  if (!Number.isFinite(valNum) || valNum <= 0) {
    return { error: "descuentoValor inválido" };
  }
  if (tipo === "PORCENTAJE" && (valNum <= 0 || valNum > 100)) {
    return { error: "En PORCENTAJE, descuentoValor debe ser > 0 y <= 100" };
  }

  const inicio = parseFechaYYYYMMDD(body?.descuentoInicio);
  const fin = parseFechaYYYYMMDD(body?.descuentoFin);
  if (inicio && fin && inicio.getTime() > fin.getTime()) {
    return { error: "descuentoInicio no puede ser mayor que descuentoFin" };
  }

  return {
    descuentoActivo: true,
    descuentoTipo: tipo,
    descuentoValor: new Prisma.Decimal(String(rawVal)),
    descuentoInicio: inicio,
    descuentoFin: fin,
    error: null as string | null,
  };
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
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

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const desc = parseDescuento(body);
  if (desc?.error) return NextResponse.json({ error: desc.error }, { status: 400 });

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
      categoriaId: body?.categoriaId ? String(body.categoriaId) : null,
      descuentoActivo: desc.descuentoActivo,
      descuentoTipo: desc.descuentoTipo as any,
      descuentoValor: desc.descuentoValor,
      descuentoInicio: desc.descuentoInicio,
      descuentoFin: desc.descuentoFin,
      nuevoHasta: body?.nuevo !== undefined
        ? (body.nuevo ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null)
        : undefined,
    },
  });

  return NextResponse.json(producto);
}
