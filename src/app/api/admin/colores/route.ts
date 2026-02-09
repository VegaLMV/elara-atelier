export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

function esHex(v: string | null) {
  if (!v) return true;
  const parts = v.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  const hexRegex = /^#([0-9a-fA-F]{6})$/;
  return parts.every(part => hexRegex.test(part));
}

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const colores = await prisma.color.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(colores);
}

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const nombre = String(body?.nombre ?? "").trim();
  const hex = body?.hex === null || body?.hex === undefined ? null : String(body.hex).trim();

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  if (!esHex(hex)) return NextResponse.json({ error: "HEX inválido (usa #RRGGBB)" }, { status: 400 });

  try {
    const created = await prisma.color.create({ data: { nombre, hex: hex || null } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de color ya existe" }, { status: 409 });
    }
    console.error("POST /colores error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
