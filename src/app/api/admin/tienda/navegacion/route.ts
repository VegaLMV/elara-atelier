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

    // Validación inicial: todos los items deben tener location válido
    for (const it of items) {
      const loc = String(it.location ?? "").trim().toUpperCase();
      if (loc !== "HEADER" && loc !== "FOOTER") {
        throw new Error(`Ubicación no válida: ${it.location}`);
      }
    }

    // Obtener todos los IDs que vienen en el payload (excluyendo temporales)
    const incomingIds = items
      .filter(it => it.id && !String(it.id).startsWith("temp_"))
      .map(it => String(it.id));

    // Obtener todos los items existentes
    const existingItems = await prisma.navigationItem.findMany({
      select: { id: true }
    });

    // Items que ya no están en el payload → eliminar
    const toDelete = existingItems
      .map(item => item.id)
      .filter(id => !incomingIds.includes(id));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar los items que ya no están en el payload
      if (toDelete.length > 0) {
        await tx.navigationItem.deleteMany({
          where: { id: { in: toDelete } }
        });
      }

      // 2. Crear o actualizar — EACH ITEM USES ITS OWN LOCATION
      const ops = items.map((it) => {
        const label = String(it.label ?? "").trim();
        const href = String(it.href ?? "").trim();
        const enabled = Boolean(it.enabled);
        const order = Number.isFinite(Number(it.order)) ? Number(it.order) : 0;
        const location = String(it.location ?? "HEADER").trim().toUpperCase() as "HEADER" | "FOOTER";

        if (!label || !href) throw new Error("label y href son requeridos");

        if (it.id && !String(it.id).startsWith("temp_")) {
          return tx.navigationItem.update({
            where: { id: String(it.id) },
            data: { label, href, location, enabled, order },
          });
        }

        return tx.navigationItem.create({
          data: { label, href, location, enabled, order },
        });
      });

      return Promise.all(ops);
    });

    // Retornar todos los items actualizados ordenados
    const all = await prisma.navigationItem.findMany({
      orderBy: [{ location: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(all);
  } catch (e: any) {
    console.error("Error API Navegacion:", e);
    return NextResponse.json({ error: e?.message ?? "Error guardando navegación" }, { status: 500 });
  }
}
