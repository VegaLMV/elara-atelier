export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCachedHomeSections } from "@/lib/cache";
import ProductoCard from "../_components/shared/producto-card";
import FilterSidebar from "./_components/filter-sidebar";
import LiveSearchInput from "./_components/live-search-input";
import { ArrowLeft, Shirt } from "lucide-react";
import { formatMoney, calcularPrecioFinal } from "@/lib/precios";
import Pagination from "@/components/ui/pagination";
import { Metadata } from "next";

// Importamos animaciones y secciones
import ScrollReveal from "@/components/ui/scroll-reveal";
import VideoBannerSection from "../_components/landing/video-banner-section";
import CategorySpotlightSection from "../_components/landing/category-spotlight-section";
import ShopTheLookSection from "../_components/landing/shop-the-look-section";

type SP = {
    q?: string;
    categoria?: string;
    orden?: "recientes" | "precio_asc" | "precio_desc";
    min?: string;
    max?: string;
    page?: string;
};

export const metadata: Metadata = {
    title: "Élara Atelier | Catálogo",
    description: "Catálogo público de Elara Atelier. Moda y prendas por talla y color."
};

export default async function CatalogoGridPage({ searchParams }: { searchParams: Promise<SP> }) {
    const sp = (await searchParams) ?? {};
    const q = (sp.q ?? "").trim();
    const categoriaSlug = (sp.categoria ?? "").trim();
    const orden = (sp.orden ?? "recientes") as SP["orden"];
    const minPrice = Number(sp.min) || 0;
    const maxPrice = Number(sp.max) || 0;
    const currentPage = Number(sp.page) || 1;
    const ITEMS_PER_PAGE = 12;
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;
    const ahora = new Date();

    const allSections = await getCachedHomeSections();

    const editoriales = allSections.filter(s => {
        if (!s.enabled) return false;
        if (!["VIDEO_BANNER", "CATEGORY_SPOTLIGHT", "SHOP_THE_LOOK"].includes(s.type)) return false;
        const content = s.content as any;
        const catSlugSeccion = (content?.categorySlug || "").trim();
        if (!categoriaSlug) return catSlugSeccion === "";
        return catSlugSeccion === categoriaSlug;
    });

    const headerEditorials = editoriales.filter(s => s.type === "VIDEO_BANNER" || s.type === "CATEGORY_SPOTLIGHT");
    const footerEditorials = editoriales.filter(s => s.type === "SHOP_THE_LOOK");

    const allShopTheLookProductIds = Array.from(new Set(
        footerEditorials.flatMap(s => {
            const ids = (s.content as any)?.manualProductIds;
            return Array.isArray(ids) ? ids : [];
        })
    ));

    const productSelect = {
        id: true, nombre: true, slug: true, precio: true,
        descuentoActivo: true, descuentoTipo: true, descuentoValor: true,
        descuentoInicio: true, descuentoFin: true, nuevoHasta: true, destacado: true,
        categoria: { select: { nombre: true } },
        imagenes: { select: { url: true }, orderBy: [{ esPortada: "desc" as const }, { orden: "asc" as const }], take: 2 },
        variantes: { select: { stockActual: true } }
    };

    let dbShopProducts: any[] = [];
    if (allShopTheLookProductIds.length > 0) {
        dbShopProducts = await prisma.producto.findMany({
            where: { id: { in: allShopTheLookProductIds }, estado: "ACTIVO" },
            select: productSelect
        });
    }

    const formatProduct = (p: any) => {
        const precioOriginal = Number(p.precio || 0);
        const inicioValido = !p.descuentoInicio || new Date(p.descuentoInicio) <= ahora;
        const finValido = !p.descuentoFin || new Date(p.descuentoFin) >= ahora;
        const tieneDescuento = p.descuentoActivo && inicioValido && finValido;
        const precioFinal = tieneDescuento ? calcularPrecioFinal(precioOriginal, p.descuentoTipo, Number(p.descuentoValor)) : precioOriginal;
        const stock = (p.variantes || []).reduce((acc: number, v: any) => acc + (v.stockActual || 0), 0);
        return {
            id: p.id, nombre: p.nombre, slug: p.slug, categoria: p.categoria?.nombre,
            imagenes: (p.imagenes || []).map((i: any) => i.url),
            precioOriginal, precioFinal, tieneDescuento,
            porcentaje: p.descuentoTipo === 'PORCENTAJE' ? Number(p.descuentoValor) : null,
            esNuevo: p.nuevoHasta ? new Date(p.nuevoHasta) >= ahora : false,
            destacado: p.destacado, stock,
        };
    };

    const cleanShopProducts = dbShopProducts.map(formatProduct);

    const where: Prisma.ProductoWhereInput = { estado: "ACTIVO" };
    if (q) {
        const palabras = q.split(/\s+/).filter(word => word.length > 1);
        if (palabras.length > 0) {
            where.AND = palabras.map(palabra => ({
                OR: [
                    { nombre: { contains: palabra, mode: "insensitive" } },
                    { descripcion: { contains: palabra, mode: "insensitive" } },
                    { categoria: { nombre: { contains: palabra, mode: "insensitive" } } }
                ]
            }));
        }
    }
    if (categoriaSlug) where.categoria = { slug: categoriaSlug };
    if (minPrice > 0 || maxPrice > 0) {
        where.precio = {};
        if (minPrice > 0) where.precio.gte = minPrice;
        if (maxPrice > 0) where.precio.lte = maxPrice;
    }

    const orderBy: Prisma.ProductoOrderByWithRelationInput =
        orden === "precio_asc" ? { precio: "asc" } :
            orden === "precio_desc" ? { precio: "desc" } :
                { creadoEn: "desc" };

    const [totalProductos, productosRaw, categorias] = await Promise.all([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
            where,
            select: productSelect,
            orderBy, take: ITEMS_PER_PAGE, skip,
        }),
        prisma.categoria.findMany({
            orderBy: { nombre: "asc" },
            where: { productos: { some: { estado: "ACTIVO" } } }
        }),
    ]);

    const totalPages = Math.ceil(totalProductos / ITEMS_PER_PAGE);
    const productos = productosRaw.map(formatProduct);
    const categoriaActualNombre = categorias.find(c => c.slug === categoriaSlug)?.nombre;

    return (
        <div className="bg-[#fcfaf8] min-h-screen scroll-smooth">
            {headerEditorials.map(s => {
                const content = s.content as any;
                if (s.type === "VIDEO_BANNER") return <VideoBannerSection key={s.id} {...content} description={s.descripcion || null} />;
                if (s.type === "CATEGORY_SPOTLIGHT") return <CategorySpotlightSection key={s.id} {...content} description={s.descripcion || null} />;
                return null;
            })}

            <div className="max-w-[1500px] mx-auto px-6 py-8 md:py-12 scroll-mt-24" id="catalogo-grid">
                
                <div className="mb-8">
                    <ScrollReveal direction="right" delay={0.1}>
                        <Link href="/tienda" scroll={false} className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f]/60 hover:text-[#864d2d] transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" /> Volver a Inicio
                        </Link>
                    </ScrollReveal>
                </div>

                {/* ESTRUCTURA PROTEGIDA: Flex directo sin envoltorios de animación */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    
                    {/* SIDEBAR: El layout se mantiene intacto */}
                    <div className="w-full lg:w-64 shrink-0">
                        <FilterSidebar categorias={categorias} />
                    </div>

                    {/* MAIN: El layout se mantiene intacto */}
                    <main className="flex-1 space-y-10">
                        <ScrollReveal direction="up" delay={0.1}>
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e6dad1]/50">
                                <div className="space-y-2">
                                    <h1 className="text-3xl md:text-4xl font-serif text-[#3f2f2f] leading-tight tracking-tight">
                                        {categoriaActualNombre || "Toda la Colección"}
                                    </h1>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-[1px] bg-[#864d2d]/30" />
                                        <p className="text-[#864d2d] text-[9px] font-black uppercase tracking-[0.3em]">
                                            {totalProductos} {totalProductos === 1 ? 'Pieza' : 'Piezas'}
                                        </p>
                                    </div>
                                </div>
                                <LiveSearchInput initialQuery={q} />
                            </div>
                        </ScrollReveal>

                        {productos.length === 0 ? (
                            <ScrollReveal direction="up" delay={0.2}>
                                <div className="py-24 text-center space-y-6 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-[#e6dad1]/30 flex items-center justify-center text-[#3f2f2f]/40 mb-2">
                                        <Shirt className="w-6 h-6 stroke-[1.5]" />
                                    </div>
                                    <h3 className="text-2xl font-serif text-[#3f2f2f] italic">Nuestra curaduría está vacía</h3>
                                    <p className="text-[#3f2f2f]/60 font-light text-sm max-w-xs mx-auto">
                                        No pudimos encontrar piezas que coincidan con tu búsqueda.
                                    </p>
                                    <div className="pt-4">
                                        <Link href="/tienda/catalogo#catalogo-grid" className="inline-block bg-[#3f2f2f] text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#864d2d] transition-all">
                                            Restaurar Colección
                                        </Link>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                                {productos.map((p, idx) => (
                                    <ScrollReveal 
                                        key={p.id} 
                                        direction="up" 
                                        delay={0.1 + (idx % 4) * 0.05}
                                    >
                                        <ProductoCard producto={p} />
                                    </ScrollReveal>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <ScrollReveal direction="up" delay={0.1}>
                                <div className="flex justify-center pt-12 border-t border-[#e6dad1]/30 mt-12">
                                    <Pagination totalPages={totalPages} />
                                </div>
                            </ScrollReveal>
                        )}
                    </main>
                </div>
            </div>

            {footerEditorials.map(s => {
                const content = s.content as any;
                const specificProductIds = Array.isArray(content?.manualProductIds) ? content.manualProductIds : [];
                const specificProducts = specificProductIds
                    .map((id: string) => cleanShopProducts.find(p => p.id === id))
                    .filter(Boolean);

                if (s.type === "SHOP_THE_LOOK" && specificProducts.length > 0) {
                    return (
                        <ShopTheLookSection
                            key={s.id}
                            title={content.title}
                            subtitle={content.subtitle}
                            description={s.descripcion || null}
                            imageUrl={content.imageUrl}
                            products={specificProducts}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
}