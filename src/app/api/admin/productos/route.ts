export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

function parseFechaYYYYMMDD(s: any) {
  const t = String(s ?? "").trim();
  if (!t) return null;
  // evita desfase por timezone
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

  const desc = parseDescuento(body);
  if (desc?.error) return NextResponse.json({ error: desc.error }, { status: 400 });

  const slug = await slugUnico(nombre);

  const producto = await prisma.producto.create({
    data: {
      nombre,
      slug,
      descripcion: descripcion || null,
      precio: String(precio),
      estado: "ACTIVO",
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
}
