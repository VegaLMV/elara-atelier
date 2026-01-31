export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await prisma.tipoEmpaque.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const nombre = String(body?.nombre ?? "").trim();
  const costoUnitario = body?.costoUnitario;

  if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
  if (costoUnitario === undefined || costoUnitario === null || isNaN(Number(costoUnitario)) || Number(costoUnitario) < 0) {
    return NextResponse.json({ error: "Costo unitario inválido" }, { status: 400 });
  }

  try {
    const created = await prisma.tipoEmpaque.create({
      data: {
        nombre,
        costoUnitario: new Prisma.Decimal(String(costoUnitario)),
        activo: true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de empaque ya existe" }, { status: 409 });
    }
    console.error("POST /empaques error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
