export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

function esHex(v: string | null) {
  if (!v) return true;
  return /^#([0-9a-fA-F]{6})$/.test(v.trim());
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const nombre = String(body?.nombre ?? "").trim();
  const hex = body?.hex === null || body?.hex === undefined ? null : String(body.hex).trim();

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  if (!esHex(hex)) return NextResponse.json({ error: "HEX inválido (usa #RRGGBB)" }, { status: 400 });

  try {
    const updated = await prisma.color.update({ where: { id }, data: { nombre, hex: hex || null } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de color ya existe" }, { status: 409 });
    }
    console.error("PUT /colores/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    await prisma.color.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "No se puede eliminar: está usado por variantes" }, { status: 409 });
    }
    console.error("DELETE /colores/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
