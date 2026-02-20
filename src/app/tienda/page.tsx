export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCachedHomeSections, getCachedCategoriasVisibles } from "@/lib/cache";
import HeroSection from "./_components/landing/hero-section";
import { ArrowRight } from "lucide-react";

// Nuevos Componentes de Landing
import TrustBar from "./_components/landing/trust-bar";
import FeaturedCategories from "./_components/landing/featured-categories";
import BrandValues from "./_components/landing/brand-values";
import NewsletterSection from "./_components/landing/newsletter-section";
import NewsletterPopupSection from "./_components/landing/newsletter-popup-section";
import ProductDualSection from "./_components/landing/product-dual-section";
import StorySection from "./_components/landing/story-section";
import PromoCampaignSection from "./_components/landing/promo-campaign-section";
import ProcessSection from "./_components/landing/process-section";
import TestimonialsSection from "./_components/landing/testimonials-section";
import ScrollReveal from "@/components/ui/scroll-reveal";
import CategoriesSection from "./_components/landing/categories-section";
import BenefitsGrid from "./_components/landing/benefits-grid";

export default async function TiendaPage() {
  const ahora = new Date();

  // OPTIMIZADO: Usar cache para datos que cambian poco
  const [homeSections, totalProductos, activeCampana, categoriasVisibles] = await Promise.all([
    getCachedHomeSections(),
    prisma.producto.count({ where: { estado: "ACTIVO" } }),
    prisma.campana.findFirst({
      where: {
        estado: "ACTIVO",
        startsAt: { lte: ahora },
        endsAt: { gte: ahora }
      },
      orderBy: { creadoEn: "desc" }
    }),
    getCachedCategoriasVisibles()
  ]);

  // OPTIMIZADO: Resolver N+1 query problem
  // Extraer todos los campaign IDs de las secciones
  const campaignIds = homeSections
    .filter(s => (s.type === "BEST_SELLERS" || s.type === "PROMO_CAMPAIGN"))
    .map(s => {
      const content = s.content as any;
      return content?.selectedCampaignId;
    })
    .filter((id): id is string => Boolean(id));

  // Hacer UNA sola query para todas las campañas
  const campanasData = campaignIds.length > 0 ? await prisma.campana.findMany({
    where: { id: { in: campaignIds } },
    include: {
      detalles: {
        include: {
          producto: {
            select: {
              id: true,
              nombre: true,
              imagenes: {
                select: { url: true },
                take: 1,
                orderBy: { esPortada: "desc" as const }
              }
            }
          }
        }
      }
    }
  }) : [];

  // Crear un Map para lookup rápido (O(1) en vez de O(n))
  const campanasMap = new Map(campanasData.map(c => [c.id, c]));

  // Ahora mapear secciones sin hacer queries adicionales
  const sectionsProcessed = homeSections.map((s) => {
    const content = s.content as any;
    if ((s.type === "BEST_SELLERS" || s.type === "PROMO_CAMPAIGN") && content?.selectedCampaignId) {
      return { ...s, specificCampana: campanasMap.get(content.selectedCampaignId) };
    }
    return s;
  });

  // Fetch productos nuevos y destacados para secciones de vista previa (no grid completo)
  const previewProducts = await prisma.producto.findMany({
    where: { estado: "ACTIVO", destacado: true },
    take: 8,
    include: {
      categoria: true,
      imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }], take: 1 },
      variantes: { select: { stockActual: true } }
    },
    orderBy: { creadoEn: "desc" }
  });

  const cleanPreviewProducts = previewProducts.map((p) => {
    const stock = p.variantes.reduce((acc, v) => acc + v.stockActual, 0);
    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      categoria: p.categoria?.nombre,
      imagenes: p.imagenes.map(i => i.url),
      precioOriginal: Number(p.precio),
      precioFinal: Number(p.precio), // Simplificado para preview
      tieneDescuento: false,
      porcentaje: null,
      esNuevo: p.nuevoHasta ? new Date(p.nuevoHasta) >= ahora : false,
      destacado: p.destacado,
      stock,
    };
  });

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Renderizado Dinámico de Secciones */}
      {(() => {
        const heroSlides: any[] = [];
        const dynamicHeroes = homeSections.filter((s: any) => s.type === "HERO");
        dynamicHeroes.forEach((s: any) => {
          const content = s.content || {};
          heroSlides.push({
            id: s.id,
            imagenUrl: content.imageUrl || "/hero-placeholder.jpg",
            titulo: content.title,
            subtitulo: content.subtitle,
            botonTexto: content.ctaText,
            enlace: content.ctaHref,
          });
        });

        let heroRendered = false;
        let testimonialsRendered = false;

        const staticProcessSection = (
          <ScrollReveal key="static-process">
            <ProcessSection />
          </ScrollReveal>
        );
        const staticTestimonialsSection = (
          <ScrollReveal key="static-testimonials">
            <TestimonialsSection />
          </ScrollReveal>
        );
        const staticBenefitsGrid = (
          <ScrollReveal key="static-benefits">
            <BenefitsGrid />
          </ScrollReveal>
        );
        const staticNewsletterPopup = (
          <ScrollReveal key="static-newsletter-popup">
            <NewsletterPopupSection />
          </ScrollReveal>
        );

        return (
          <>
            {sectionsProcessed.map((s, index) => {
              const section = s as any;
              const content = section.content as any;

              const componentContent = (() => {
                switch (section.type) {
                  case "HERO":
                    if (heroRendered) return null;
                    heroRendered = true;
                    return (
                      <HeroSection
                        key={section.id}
                        banners={heroSlides}
                        categoriaNombre={undefined}
                      />
                    );

                  case "BEST_SELLERS":
                    // Usamos productos preview
                    const campanaData = section.specificCampana;
                    return (
                      <ProductDualSection
                        key={section.id}
                        title={content.title}
                        subtitle={content.subtitle}
                        bannerTitle={content.bannerTitle}
                        bannerCtaText={content.bannerCtaText}
                        bannerCtaHref={content.bannerCtaHref}
                        bannerImageUrl={content.bannerImageUrl}
                        newArrivals={cleanPreviewProducts.slice(0, 4)} // Placeholder data
                        bestSellers={cleanPreviewProducts.slice(4, 8)} // Placeholder data
                        campana={campanaData ? {
                          nombre: campanaData.nombre,
                          descripcion: campanaData.descripcion,
                          valor: Number(campanaData.valor),
                          tipo: campanaData.tipo,
                          startsAt: campanaData.startsAt,
                          endsAt: campanaData.endsAt,
                          estado: campanaData.estado,
                          productos: campanaData.detalles?.map((d: any) => ({
                            id: d.producto.id,
                            nombre: d.producto.nombre,
                            imagen: d.producto.imagenes?.[0]?.url || null
                          })) || []
                        } : null}
                      />
                    );

                  case "STORY":
                    return (
                      <StorySection
                        key={section.id}
                        title={content.title}
                        body={content.body}
                        imageUrl={content.imageUrl}
                        ctaText={content.ctaText}
                        ctaHref={content.ctaHref}
                      />
                    );

                  case "BENEFITS":
                    return <TrustBar key={section.id} items={content.items} />;

                  case "FEATURED_CATEGORIES":
                    return (
                      <FeaturedCategories
                        key={section.id}
                        title={content.title}
                        subtitle={content.subtitle}
                        categories={content.categories}
                      />
                    );

                  case "BRAND_ESSENCE":
                    return (
                      <BrandValues
                        key={section.id}
                        tagline={content.tagline}
                        title={content.title}
                        body={content.body}
                        imageUrl={content.imageUrl}
                        quote={content.quote}
                      />
                    );

                  case "NEWSLETTER":
                    return (
                      <NewsletterSection
                        key={section.id}
                        badge={content.badge}
                        title={content.title}
                        subtitle={content.subtitle}
                      />
                    );

                  case "PROMO_CAMPAIGN":
                    if (!section.specificCampana) return null;
                    const promoCampaignData = {
                      nombre: section.specificCampana.nombre,
                      descripcion: section.specificCampana.descripcion,
                      imagenUrl: section.specificCampana.imagenUrl,
                      tipo: section.specificCampana.tipo,
                      valor: Number(section.specificCampana.valor),
                      startsAt: new Date(section.specificCampana.startsAt).toISOString(),
                      endsAt: new Date(section.specificCampana.endsAt).toISOString(),
                    };
                    return (
                      <PromoCampaignSection
                        key={section.id}
                        title={content.title}
                        subtitle={content.subtitle}
                        campaign={promoCampaignData}
                      />
                    );

                  default:
                    return null;
                }
              })();

              const component = componentContent ? (
                <ScrollReveal key={`sr-${s.id}`}>
                  {componentContent}
                </ScrollReveal>
              ) : null;

              if (index === 0) {
                return (
                  <div key={`wrapper-${s.id}`}>
                    {component}
                    {staticProcessSection}
                  </div>
                )
              }
              if ((section.type === "PROMO_CAMPAIGN" || section.type === "STORY") && !testimonialsRendered) {
                testimonialsRendered = true;
                return (
                  <div key={`wrapper-${s.id}`}>
                    {component}
                    {staticTestimonialsSection}
                  </div>
                )
              }

              return component;
            })}

            {homeSections.length === 0 && (
              <>
                {staticProcessSection}
                {staticTestimonialsSection}
              </>
            )}

            {/* Categorías Visibles */}
            {categoriasVisibles.length > 0 && (
              <ScrollReveal>
                <CategoriesSection categorias={categoriasVisibles} />
              </ScrollReveal>
            )}

            {staticBenefitsGrid}
            {staticNewsletterPopup}
          </>
        );
      })()}

    </div>
  );
}
