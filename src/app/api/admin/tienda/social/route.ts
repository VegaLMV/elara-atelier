export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function GET() {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  const links = await prisma.socialLink.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(links);
}

export async function PUT(req: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.links)) {
      return NextResponse.json({ error: "Se espera { links: [] }" }, { status: 400 });
    }

    const links = body.links as any[];

    const ops = links.map((l) => {
      const platform = String(l.platform ?? "").trim();
      const url = String(l.url ?? "").trim();
      const enabled = Boolean(l.enabled);
      const order = Number.isFinite(Number(l.order)) ? Number(l.order) : 0;

      if (!platform || !url) throw new Error("platform y url son requeridos");

      if (l.id) {
        return prisma.socialLink.update({
          where: { id: String(l.id) },
          data: { platform, url, enabled, order },
        });
      }

      return prisma.socialLink.create({
        data: { platform, url, enabled, order },
      });
    });

    const updated = await prisma.$transaction(ops);
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Error API Social:", e);
    return NextResponse.json({ error: e?.message ?? "Error guardando social" }, { status: 500 });
  }
}
