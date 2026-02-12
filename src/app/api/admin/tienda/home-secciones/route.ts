export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

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
          ctaHref: "/catalogo",
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
          title: "Más vendidos",
          subtitle: "Lo que más eligen",
          limit: 8,
          source: "destacados",
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "STORY",
        enabled: true,
        order: 2,
        content: {
          title: "Nuestra historia",
          body: "Una marca hecha con detalle y cariño.",
          imageUrl: null,
          ctaText: "Conócenos",
          ctaHref: "/catalogo",
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "CONTACT",
        enabled: true,
        order: 3,
        content: {
          title: "Contáctanos",
          subtitle: "Te respondemos por WhatsApp",
          showMap: false,
          mapUrl: null,
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "BENEFITS" as any,
        enabled: true,
        order: 4,
        content: {
          items: [
            { icon: "Truck", title: "Envío Prioritario", desc: "A todo el país en 24-48h" },
            { icon: "ShieldCheck", title: "Compra Segura", desc: "Garantía de satisfacción total" },
            { icon: "Heart", title: "Diseño Local", desc: "Hecho con amor y calidad" },
            { icon: "Sparkles", title: "Calidad Premium", desc: "Telas y acabados de lujo" },
          ]
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "FEATURED_CATEGORIES" as any,
        enabled: true,
        order: 5,
        content: {
          title: "Explora Nuestras Colecciones",
          subtitle: "Diseños curados que capturan la esencia de la elegancia contemporánea.",
          categories: [
            { title: "Vestidos", slug: "vestidos", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800" },
            { title: "Conjuntos", slug: "conjuntos", image: "https://images.unsplash.com/photo-1539109132381-3151b8a7ad06?auto=format&fit=crop&q=80&w=800" },
            { title: "Accesorios", slug: "accesorios", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800" },
          ]
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "BRAND_ESSENCE" as any,
        enabled: true,
        order: 6,
        content: {
          tagline: "Nuestra Esencia",
          title: "Elegancia que Trasciende el Tiempo",
          body: "En Elara Atelier, creemos que la moda es una extensión de tu identidad.",
          imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
          quote: "La moda pasa, el estilo es eterno.",
        },
      },
    }),
    prisma.homeSection.create({
      data: {
        type: "NEWSLETTER" as any,
        enabled: true,
        order: 7,
        content: {
          badge: "Acceso Exclusivo VIP",
          title: "Únete a la Experiencia Elara Atelier",
          subtitle: "Recibe notificaciones sobre nuevos lanzamientos y obtén un 15% de descuento.",
        },
      },
    }),
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

  const ops = sections.map((s) => {
    const enabled = Boolean(s.enabled);
    const order = Number.isFinite(Number(s.order)) ? Number(s.order) : 0;
    const type = String(s.type ?? "").trim();
    const content = s.content ?? {};

    if (!type) throw new Error("type es requerido en cada sección");

    if (s.id) {
      return prisma.homeSection.update({
        where: { id: String(s.id) },
        data: { enabled, order, type: type as any, content },
      });
    }

    return prisma.homeSection.create({
      data: { enabled, order, type: type as any, content },
    });
  });

  try {
    const updated = await prisma.$transaction(ops);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error actualizando secciones" }, { status: 500 });
  }
}
