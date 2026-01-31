export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const nombre = String(body?.nombre ?? "").trim();
  const orden = Number.parseInt(String(body?.orden ?? "0"), 10) || 0;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });

  try {
    const updated = await prisma.talla.update({ where: { id }, data: { nombre, orden } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de talla ya existe" }, { status: 409 });
    }
    console.error("PUT /tallas/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    await prisma.talla.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Si está usada por variantes, suele caer en FK error (P2003) o algo similar
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "No se puede eliminar: está usada por variantes" }, { status: 409 });
    }
    console.error("DELETE /tallas/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
