export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const variantes = await prisma.variante.findMany({
    where: { productoId: id },
    include: { talla: true, color: true },
    orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }],
  });

  return NextResponse.json(variantes);
}

export async function POST(
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
  const tallaIds: string[] = Array.isArray(body?.tallaIds) ? body.tallaIds : [];
  const colorIds: string[] = Array.isArray(body?.colorIds) ? body.colorIds : [];

  if (tallaIds.length === 0 || colorIds.length === 0) {
    return NextResponse.json(
      { error: "Selecciona al menos 1 talla y 1 color" },
      { status: 400 }
    );
  }

  const data: Array<{
    productoId: string;
    tallaId: string;
    colorId: string;
    activa: boolean;
    stockActual: number;
  }> = [];

  for (const tallaId of tallaIds) {
    for (const colorId of colorIds) {
      data.push({
        productoId: id,
        tallaId,
        colorId,
        activa: true,
        stockActual: 0,
      });
    }
  }

  const res = await prisma.variante.createMany({
    data,
    skipDuplicates: true,
  });

  return NextResponse.json({ creadas: res.count });
}
