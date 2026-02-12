export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import HomeSeccionesClient from "./home-secciones-client";

export default async function Page() {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    let sections = await prisma.homeSection.findMany({ orderBy: { order: "asc" } });

    // Si no hay secciones, creamos las básicas por defecto para que el usuario tenga algo que configurar
    if (sections.length === 0) {
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
                        title: "Más vendidos",
                        subtitle: "Lo que más eligen",
                        limit: 8,
                        source: "destacados",
                    },
                },
            }),
            prisma.homeSection.create({
                data: {
                    type: "BENEFITS" as any,
                    enabled: true,
                    order: 2,
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
        ]);
        sections = await prisma.homeSection.findMany({ orderBy: { order: "asc" } });
    }

    return <HomeSeccionesClient initial={sections} />;
}
