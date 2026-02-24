export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

// Función simplificada solo con lo esencial (Hero y Best Sellers)
async function ensureDefaults() {
  const count = await prisma.homeSection.count();
  if (count > 0) return;

  await prisma.$transaction([
    prisma.homeSection.create({
      data: {
        type: "HERO",
        enabled: true,
        order: 0,
        content: {
          title: "Nueva colección",
          subtitle: "Diseños pensados para ti",
          ctaText: "Ver catálogo",
          ctaHref: "/tienda/catalogo",
          imageUrl: null,
          overlayOpacity: 0.25,
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "BEST_SELLERS",
        enabled: true,
        order: 1,
        content: {
          title: "Últimas Novedades",
          subtitle: "Más Vendidos",
          mode: "automático",
          manualProductIds: []
        },
      },
    })
  ]);
}

export async function GET() {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  await ensureDefaults();

  const sections = await prisma.homeSection.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(sections);
}

export async function PUT(req: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.sections)) {
    return NextResponse.json({ error: "Se espera { sections: [] }" }, { status: 400 });
  }

  const sections = body.sections as any[];

  // 🔥 MAGIA APLICADA: Obtener los IDs que SÍ existen para no borrarlos
  const idsToKeep = sections
    .map((s) => s.id)
    .filter((id) => id && !String(id).startsWith("temp_"));

  try {
    // 1. Eliminar de la base de datos las secciones que el usuario borró en el panel
    await prisma.homeSection.deleteMany({
      where: {
        id: { notIn: idsToKeep },
      },
    });

    // 2. Crear o actualizar las secciones que quedan
    const ops = sections.map((s) => {
      const enabled = Boolean(s.enabled);
      const order = Number.isFinite(Number(s.order)) ? Number(s.order) : 0;
      const type = String(s.type ?? "").trim();
      const content = s.content ?? {};

      if (!type) throw new Error("type es requerido en cada sección");

      if (s.id && !String(s.id).startsWith("temp_")) {
        return prisma.homeSection.update({
          where: { id: String(s.id) },
          data: { enabled, order, type: type as any, content },
        });
      }

      return prisma.homeSection.create({
        data: { enabled, order, type: type as any, content },
      });
    });

    const updated = await prisma.$transaction(ops);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error actualizando secciones" }, { status: 500 });
  }
}