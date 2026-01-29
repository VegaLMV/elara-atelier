export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function PATCH(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const img = await prisma.imagenProducto.findUnique({ where: { id } });
  if (!img) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await prisma.$transaction([
    prisma.imagenProducto.updateMany({
      where: { productoId: img.productoId },
      data: { esPortada: false },
    }),
    prisma.imagenProducto.update({
      where: { id },
      data: { esPortada: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
