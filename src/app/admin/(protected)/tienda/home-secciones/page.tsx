export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import HomeSeccionesClient from "./home-secciones-client";

export default async function Page() {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    // 1. Obtenemos las secciones
    let sections = await prisma.homeSection.findMany({ orderBy: { order: "asc" } });

    // 2. Obtenemos TODAS las categorías disponibles en la tienda
    const categorias = await prisma.categoria.findMany({
        select: { id: true, nombre: true, slug: true },
        orderBy: { nombre: "asc" }
    });

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
                    type: "VIDEO_BANNER",
                    enabled: false,
                    order: 1,
                    content: {
                        title: "Fashion Film",
                        subtitle: "Editorial",
                        ctaText: "Descubrir",
                        ctaHref: "/tienda/catalogo",
                        videoUrl: "",
                        overlayOpacity: 0.3,
                    },
                },
            }),
            prisma.homeSection.create({
                data: {
                    type: "BEST_SELLERS",
                    enabled: true,
                    order: 2,
                    content: {
                        title: "Últimas Novedades",
                        subtitle: "Más Vendidos",
                        mode: "automático",
                        manualProductIds: []
                    },
                },
            }),
            prisma.homeSection.create({
                data: {
                    type: "PROMO_CAMPAIGN",
                    enabled: false,
                    order: 3,
                    content: {
                        selectedCampaignId: null,
                        title: "Colección Exclusiva",
                        subtitle: "Descubre nuestra nueva línea"
                    },
                },
            })
        ]);
        sections = await prisma.homeSection.findMany({ orderBy: { order: "asc" } });
    }

    // Pasamos tanto las secciones como las categorías al cliente
    return <HomeSeccionesClient initial={sections as any} categorias={categorias} />;
}