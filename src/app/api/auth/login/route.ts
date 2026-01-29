export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { firmarSesion } from "@/lib/auth";

export async function POST(req: Request) {
  const { correo, clave } = await req.json();

  if (!correo || !clave) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const ok = await bcrypt.compare(clave, usuario.clave);
  if (!ok) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const token = await firmarSesion({
    usuarioId: usuario.id,
    correo: usuario.correo,
    rol: usuario.rol,
  });

  const cookieName = process.env.AUTH_COOKIE ?? "elara_session";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
