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

    const ops = items.map((it) => {
      const label = String(it.label ?? "").trim();
      const href = String(it.href ?? "").trim();
      const location = String(it.location ?? "HEADER").trim().toUpperCase();
      const enabled = Boolean(it.enabled);
      const order = Number.isFinite(Number(it.order)) ? Number(it.order) : 0;

      if (!label || !href) throw new Error("label y href son requeridos");

      if (location !== "HEADER" && location !== "FOOTER") {
        throw new Error(`Ubicación no válida: ${location}`);
      }

      if (it.id) {
        return prisma.navigationItem.update({
          where: { id: String(it.id) },
          data: { label, href, location: location as any, enabled, order },
        });
      }

      return prisma.navigationItem.create({
        data: { label, href, location: location as any, enabled, order },
      });
    });

    const updated = await prisma.$transaction(ops);
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Error API Navegacion:", e);
    return NextResponse.json({ error: e?.message ?? "Error guardando navegación" }, { status: 500 });
  }
}
