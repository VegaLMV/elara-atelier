export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCachedHomeSections, getCachedCategoriasVisibles } from "@/lib/cache";

// Landing Components
import HeroSection from "./_components/landing/hero-section";
import CategoriesSection from "./_components/landing/categories-section";
import ProductDualSection from "./_components/landing/product-dual-section";
import PromoCampaignSection from "./_components/landing/promo-campaign-section";
import NewsletterPopupSection from "./_components/landing/newsletter-popup-section";
import ProcessSection from "./_components/landing/process-section";
import TestimonialsSection from "./_components/landing/testimonials-section";
import BenefitsGrid from "./_components/landing/benefits-grid";
import StorySection from "./_components/landing/story-section";
import ScrollReveal from "@/components/ui/scroll-reveal";

type CleanProduct = {
  id: string;
  nombre: string;
  slug: string;
  categoria?: string;
  imagenes: string[];
  precioOriginal: number;
  precioFinal: number;
  tieneDescuento: boolean;
  porcentaje: number | null;
  esNuevo: boolean;
  destacado: boolean;
  stock: number;
};

function mapProduct(p: any, ahora: Date): CleanProduct {
  const stock = p.variantes.reduce((acc: number, v: any) => acc + v.stockActual, 0);
  return {
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    categoria: p.categoria?.nombre,
    imagenes: p.imagenes.map((i: any) => i.url),
    precioOriginal: Number(p.precio),
    precioFinal: Number(p.precio),
    tieneDescuento: false, // Se recalcula en el componente si hay campaña
    porcentaje: null,
    esNuevo: p.nuevoHasta ? new Date(p.nuevoHasta) >= ahora : false,
    destacado: p.destacado,
    stock,
  };
}

export default async function TiendaPage() {
  const ahora = new Date();

  const [homeSections, categoriasVisibles] = await Promise.all([
    getCachedHomeSections(),
    getCachedCategoriasVisibles(),
  ]);

  // Extraer IDs de Campañas
  const campaignIds = homeSections
    .filter(s => s.type === "BEST_SELLERS" || s.type === "PROMO_CAMPAIGN")
    .map(s => (s.content as any)?.selectedCampaignId)
    .filter((id): id is string => Boolean(id));

  const campanasData = campaignIds.length > 0
    ? await prisma.campana.findMany({
      where: { id: { in: campaignIds } },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                id: true, nombre: true,
                imagenes: { select: { url: true }, take: 1, orderBy: { esPortada: "desc" as const } }
              }
            }
          }
        }
      }
    })
    : [];

  const campanasMap = new Map(campanasData.map(c => [c.id, c]));

  // Extraer productos manuales
  const manualProductIds: string[] = homeSections
    .filter(s => s.type === "BEST_SELLERS" && (s.content as any)?.mode === "manual")
    .flatMap(s => (s.content as any)?.manualProductIds || []);

  const productInclude = {
    categoria: true,
    imagenes: { orderBy: [{ esPortada: "desc" as const }, { orden: "asc" as const }], take: 1 },
    variantes: { select: { stockActual: true } },
  };

  const [autoNewProducts, autoBestSellers, manualProducts] = await Promise.all([
    prisma.producto.findMany({
      where: { estado: "ACTIVO", nuevoHasta: { gte: ahora } },
      take: 10,
      include: productInclude,
      orderBy: { nuevoHasta: "desc" as const },
    }),
    prisma.producto.findMany({
      where: { estado: "ACTIVO", destacado: true },
      take: 10,
      include: productInclude,
      orderBy: { creadoEn: "desc" as const },
    }),
    manualProductIds.length > 0
      ? prisma.producto.findMany({
        where: { id: { in: manualProductIds }, estado: "ACTIVO" },
        include: productInclude,
      })
      : Promise.resolve([]),
  ]);

  const cleanAutoNew = autoNewProducts.map(p => mapProduct(p, ahora));
  const cleanAutoBest = autoBestSellers.map(p => mapProduct(p, ahora));
  const cleanManual = manualProducts.map(p => mapProduct(p, ahora));

  const manualOrdered = manualProductIds
    .map(id => cleanManual.find(p => p.id === id))
    .filter(Boolean) as CleanProduct[];

  // Separar el Hero del resto
  const heroSlides: any[] = [];
  homeSections.filter(s => s.type === "HERO" && s.enabled).forEach(s => {
    const content = (s.content || {}) as any;
    heroSlides.push({
      id: s.id,
      imagenUrl: content.imageUrl || "/hero-placeholder.jpg",
      titulo: content.title,
      subtitulo: content.subtitle,
      botonTexto: content.ctaText,
      enlace: content.ctaHref,
    });
  });

  const bestSellersSections = homeSections.filter(s => s.type === "BEST_SELLERS" && s.enabled);
  const promoSections = homeSections.filter(s => s.type === "PROMO_CAMPAIGN" && s.enabled);

  return (
    <div className="bg-[#fcfaf8] min-h-screen pb-20 overflow-hidden">

      {heroSlides.length > 0 && (
        <HeroSection banners={heroSlides} categoriaNombre={undefined} />
      )}

      {categoriasVisibles.length > 0 && (
        <ScrollReveal key="static-categories">
          <CategoriesSection categorias={categoriasVisibles} />
        </ScrollReveal>
      )}

      {bestSellersSections.map((section: any) => {
        const content = section.content;
        const campanaData = campanasMap.get(content?.selectedCampaignId);
        const isManual = content?.mode === "manual";
        const newArrivals = isManual ? manualOrdered.slice(0, 4) : cleanAutoNew.slice(0, 4);
        const bestSellers = isManual ? manualOrdered.slice(4, 8) : cleanAutoBest.slice(0, 4);

        return (
          <ScrollReveal key={`products-${section.id}`}>
            <ProductDualSection
              title={content?.title}
              subtitle={content?.subtitle}
              newArrivals={newArrivals}
              bestSellers={bestSellers}
              campana={campanaData ? {
                nombre: campanaData.nombre,
                descripcion: campanaData.descripcion,
                valor: Number(campanaData.valor),
                tipo: campanaData.tipo,
                startsAt: campanaData.startsAt,
                endsAt: campanaData.endsAt,
                estado: campanaData.estado,
              } : null}
            />
          </ScrollReveal>
        );
      })}

      {promoSections.map((section: any) => {
        const content = section.content;
        const campana = campanasMap.get(content?.selectedCampaignId);
        if (!campana) return null;

        return (
          <ScrollReveal key={`promo-${section.id}`}>
            <PromoCampaignSection
              title={content?.title}
              subtitle={content?.subtitle}
              campaign={{
                nombre: campana.nombre,
                descripcion: campana.descripcion,
                imagenUrl: campana.imagenUrl,
                tipo: campana.tipo,
                valor: Number(campana.valor),
                startsAt: new Date(campana.startsAt).toISOString(),
                endsAt: new Date(campana.endsAt).toISOString(),
              }}
            />
          </ScrollReveal>
        );
      })}

      <ScrollReveal key="static-benefits">
        <BenefitsGrid />
      </ScrollReveal>

      <ScrollReveal key="static-newsletter-popup">
        <NewsletterPopupSection />
      </ScrollReveal>

      <ScrollReveal key="static-process">
        <ProcessSection />
      </ScrollReveal>

      <ScrollReveal key="static-testimonials">
        <TestimonialsSection />
      </ScrollReveal>

      <ScrollReveal key="story-static">
        <StorySection />
      </ScrollReveal>

    </div>
  );
}