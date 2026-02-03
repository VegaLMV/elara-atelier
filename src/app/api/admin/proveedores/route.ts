export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.nombre?.trim()) {
    return NextResponse.json({ error: "Nombre es obligatorio" }, { status: 400 });
  }

  const creado = await prisma.proveedor.create({
    data: {
      nombre: String(body.nombre).trim(),
      ruc: body.ruc ? String(body.ruc).trim() : null,
      telefono: body.telefono ? String(body.telefono).trim() : null,
      correo: body.correo ? String(body.correo).trim() : null,
      direccion: body.direccion ? String(body.direccion).trim() : null,
      ciudad: body.ciudad ? String(body.ciudad).trim() : null,
      provincia: body.provincia ? String(body.provincia).trim() : null,
    },
  });

  return NextResponse.json(creado, { status: 201 });
}