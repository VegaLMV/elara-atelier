export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const variantes = await prisma.variante.findMany({
    where: { productoId: id },
    select: {
      id: true,
      tallaId: true,
      colorId: true,
      stockActual: true,
      activa: true,
      talla: { select: { nombre: true } },
      color: { select: { nombre: true } },
    },
    orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }],
  });

  return NextResponse.json(
    variantes.map((v) => ({
      id: v.id,
      tallaId: v.tallaId,
      colorId: v.colorId,
      talla: v.talla.nombre,
      color: v.color.nombre,
      stockActual: v.stockActual,
      activa: v.activa,
    }))
  );
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const tallaIds: string[] = Array.isArray(body?.tallaIds) ? body.tallaIds : [];
  const colorIds: string[] = Array.isArray(body?.colorIds) ? body.colorIds : [];

  if (tallaIds.length === 0 || colorIds.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos 1 talla y 1 color" }, { status: 400 });
  }

  const data = tallaIds.flatMap((tallaId) =>
    colorIds.map((colorId) => ({
      productoId: id,
      tallaId,
      colorId,
      activa: true,
      stockActual: 0,
    }))
  );

  const res = await prisma.variante.createMany({
    data,
    skipDuplicates: true,
  });

  return NextResponse.json({ creadas: res.count });
}
