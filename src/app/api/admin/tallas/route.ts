export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const tallas = await prisma.talla.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }] });
  return NextResponse.json(tallas);
}

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const nombre = String(body?.nombre ?? "").trim();
  const orden = Number.parseInt(String(body?.orden ?? "0"), 10) || 0;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });

  try {
    const created = await prisma.talla.create({ data: { nombre, orden } });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de talla ya existe" }, { status: 409 });
    }
    console.error("POST /tallas error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
