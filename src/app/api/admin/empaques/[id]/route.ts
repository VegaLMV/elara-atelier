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
  const costoUnitario = body?.costoUnitario;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  if (costoUnitario === undefined || costoUnitario === null || isNaN(Number(costoUnitario)) || Number(costoUnitario) < 0) {
    return NextResponse.json({ error: "Costo unitario inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.tipoEmpaque.update({
      where: { id },
      data: { nombre, costoUnitario: new Prisma.Decimal(String(costoUnitario)) },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de empaque ya existe" }, { status: 409 });
    }
    console.error("PUT /empaques/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const activo = Boolean(body?.activo);

  try {
    const updated = await prisma.tipoEmpaque.update({ where: { id }, data: { activo } });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /empaques/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    await prisma.tipoEmpaque.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json({ error: "No se puede eliminar: está usado en ventas" }, { status: 409 });
    }
    console.error("DELETE /empaques/[id] error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
