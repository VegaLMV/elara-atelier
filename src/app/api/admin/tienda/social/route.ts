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

    // Obtener todos los IDs que vienen en el payload (excluyendo los temporales)
    const incomingIds = links
      .filter(l => l.id && !String(l.id).startsWith("temp_"))
      .map(l => String(l.id));

    // Obtener todos los social links existentes
    const existingLinks = await prisma.socialLink.findMany({
      select: { id: true }
    });

    // Identificar los IDs que deben eliminarse (los que existen pero no vienen en el payload)
    const toDelete = existingLinks
      .map(link => link.id)
      .filter(id => !incomingIds.includes(id));

    // Crear las operaciones dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar los links que ya no están en el payload
      if (toDelete.length > 0) {
        await tx.socialLink.deleteMany({
          where: { id: { in: toDelete } }
        });
      }

      // 2. Crear o actualizar los links del payload
      const ops = links.map((l) => {
        const platform = String(l.platform ?? "").trim();
        const url = String(l.url ?? "").trim();
        const enabled = Boolean(l.enabled);
        const order = Number.isFinite(Number(l.order)) ? Number(l.order) : 0;

        if (!platform || !url) throw new Error("platform y url son requeridos");

        if (l.id && !String(l.id).startsWith("temp_")) {
          return tx.socialLink.update({
            where: { id: String(l.id) },
            data: { platform, url, enabled, order },
          });
        }

        return tx.socialLink.create({
          data: { platform, url, enabled, order },
        });
      });

      return Promise.all(ops);
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Error API Social:", e);
    return NextResponse.json({ error: e?.message ?? "Error guardando social" }, { status: 500 });
  }
}
