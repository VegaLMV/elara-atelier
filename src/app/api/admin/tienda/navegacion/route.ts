export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function GET() {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  const items = await prisma.navigationItem.findMany({
    orderBy: [{ location: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Se espera { items: [] }" }, { status: 400 });
    }

    const items = body.items as any[];

    // Determinar la ubicación (location) de los items
    const location = items.length > 0 ? String(items[0].location ?? "HEADER").trim().toUpperCase() : "FOOTER";

    if (location !== "HEADER" && location !== "FOOTER") {
      throw new Error(`Ubicación no válida: ${location}`);
    }

    // Primero, obtener todos los IDs que vienen en el payload (excluyendo los temporales)
    const incomingIds = items
      .filter(it => it.id && !String(it.id).startsWith("temp_"))
      .map(it => String(it.id));

    // Obtener todos los items existentes para esta ubicación
    const existingItems = await prisma.navigationItem.findMany({
      where: { location: location as any },
      select: { id: true }
    });

    // Identificar los IDs que deben eliminarse (los que existen pero no vienen en el payload)
    const toDelete = existingItems
      .map(item => item.id)
      .filter(id => !incomingIds.includes(id));

    // Crear las operaciones dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar los items que ya no están en el payload
      if (toDelete.length > 0) {
        await tx.navigationItem.deleteMany({
          where: { id: { in: toDelete } }
        });
      }

      // 2. Crear o actualizar los items del payload
      const ops = items.map((it) => {
        const label = String(it.label ?? "").trim();
        const href = String(it.href ?? "").trim();
        const enabled = Boolean(it.enabled);
        const order = Number.isFinite(Number(it.order)) ? Number(it.order) : 0;

        if (!label || !href) throw new Error("label y href son requeridos");

        if (it.id && !String(it.id).startsWith("temp_")) {
          return tx.navigationItem.update({
            where: { id: String(it.id) },
            data: { label, href, location: location as any, enabled, order },
          });
        }

        return tx.navigationItem.create({
          data: { label, href, location: location as any, enabled, order },
        });
      });

      return Promise.all(ops);
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Error API Navegacion:", e);
    return NextResponse.json({ error: e?.message ?? "Error guardando navegación" }, { status: 500 });
  }
}
