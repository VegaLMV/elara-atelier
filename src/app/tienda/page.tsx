export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HeroSection from "./hero-section";
import { ArrowRight } from "lucide-react";

// Nuevos Componentes de Landing
import TrustBar from "./_components/trust-bar";
import FeaturedCategories from "./_components/featured-categories";
import BrandValues from "./_components/brand-values";
import NewsletterSection from "./_components/newsletter-section";
import NewsletterPopupSection from "./_components/newsletter-popup-section";
import ProductDualSection from "./_components/product-dual-section";
import StorySection from "./_components/story-section";
import PromoCampaignSection from "./_components/promo-campaign-section";
import ProcessSection from "./_components/process-section";
import TestimonialsSection from "./_components/testimonials-section";
import ScrollReveal from "@/components/ui/scroll-reveal";
import CategoriesSection from "./_components/categories-section";

export default async function TiendaPage() {
  const ahora = new Date();

  const [homeSections, totalProductos, activeCampana, categoriasVisibles] = await Promise.all([
    prisma.homeSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" }
    }),
    prisma.producto.count({ where: { estado: "ACTIVO" } }),
    prisma.campana.findFirst({
      where: {
        estado: "ACTIVO",
        startsAt: { lte: ahora },
        endsAt: { gte: ahora }
      },
      orderBy: { creadoEn: "desc" }
    }),
    prisma.categoria.findMany({
      where: { visible: true },
      include: {
        _count: { select: { productos: true } },
        imagenes: { orderBy: { orden: "asc" } }
      },
      orderBy: { orden: "asc" }
    })
  ]);

  // Pre-fetching para secciones dinámicas
  const sectionsProcessed = await Promise.all(homeSections.map(async (s) => {
    const content = s.content as any;
    if (s.type === "BEST_SELLERS" && content.selectedCampaignId) {
      const specificCampana = await prisma.campana.findUnique({
        where: { id: content.selectedCampaignId },
        include: {
          detalles: {
            include: {
              producto: {
                include: {
                  imagenes: { take: 1, orderBy: { esPortada: "desc" } }
                }
              }
            }
          }
        }
      });
      return { ...s, specificCampana };
    }
    if (s.type === "PROMO_CAMPAIGN" && content.selectedCampaignId) {
      const specificCampana = await prisma.campana.findUnique({
        where: { id: content.selectedCampaignId },
        select: {
          nombre: true,
          descripcion: true,
          imagenUrl: true,
          tipo: true,
          valor: true,
          startsAt: true,
          endsAt: true,
          estado: true
        }
      });
      return { ...s, specificCampana };
    }
    return s;
  }));

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

            {staticNewsletterPopup}
          </>
        );
      })()}

    </div>
  );
}
