export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  if (!body?.nombre?.trim()) {
    return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
  }

  const upd = await prisma.proveedor.update({
    where: { id },
    data: {
      nombre: String(body.nombre).trim(),
      ruc: body.ruc ? String(body.ruc).trim() : null,
      telefono: body.telefono ? String(body.telefono).trim() : null,
      correo: body.correo ? String(body.correo).trim() : null,
      direccion: body.direccion ? String(body.direccion).trim() : null,
    },
  });

  return NextResponse.json(upd, { status: 200 });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.proveedor.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    // si tiene compras relacionadas, Postgres rompe por FK
    return NextResponse.json({ error: "No se puede eliminar: tiene compras relacionadas." }, { status: 409 });
  }
}
