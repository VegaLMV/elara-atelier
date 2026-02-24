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

// Importamos las secciones editoriales
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

    // 1. FILTRAR SECCIONES EDITORIALES SEGÚN CATEGORÍA (REGLA ESTRICTA)
    const allSections = await getCachedHomeSections();

    const editoriales = allSections.filter(s => {
        if (!s.enabled) return false;
        if (!["VIDEO_BANNER", "CATEGORY_SPOTLIGHT", "SHOP_THE_LOOK"].includes(s.type)) return false;

        const content = s.content as any;
        const catSlugSeccion = (content?.categorySlug || "").trim();

        // REGLA DE NEGOCIO (Merchandising):
        if (!categoriaSlug) {
            return catSlugSeccion === "";
        }
        return catSlugSeccion === categoriaSlug;
    });

    const headerEditorials = editoriales.filter(s => s.type === "VIDEO_BANNER" || s.type === "CATEGORY_SPOTLIGHT");
    const footerEditorials = editoriales.filter(s => s.type === "SHOP_THE_LOOK");

    // 2. BUSCAR LOS PRODUCTOS DEL SHOP THE LOOK
    // Extraemos todos los IDs únicos para optimizar la consulta
    const allShopTheLookProductIds = Array.from(new Set(
        footerEditorials.flatMap(s => {
            const ids = (s.content as any)?.manualProductIds;
            return Array.isArray(ids) ? ids : [];
        })
    ));

    // Configuración compartida de selección para evitar inconsistencias
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

    // Formateador Helper robusto
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

    // 3. CONSULTA PRINCIPAL DEL CATÁLOGO
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

    if (categoriaSlug) {
        where.categoria = { slug: categoriaSlug };
    }

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
        <div className="bg-[#fcfaf8] min-h-screen">

            {/* SECCIONES EDITORIALES SUPERIORES */}
            {headerEditorials.map(s => {
                const content = s.content as any;
                if (s.type === "VIDEO_BANNER") {
                    return <VideoBannerSection 
                    key={s.id} 
                    {...content} 
                    description={s.descripcion || null}
                    />;
                }
                if (s.type === "CATEGORY_SPOTLIGHT") {
                    return <CategorySpotlightSection key={s.id} {...content} description={s.descripcion || null}/>;
                }
                return null;
            })}

            <div className="max-w-[1500px] mx-auto px-6 py-8 md:py-12" id="catalogo-grid">
                <div className="mb-8">
                    <Link href="/tienda" className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f]/60 hover:text-[#864d2d] transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" /> Volver a Inicio
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <div className="w-full lg:w-auto ">
                        <FilterSidebar categorias={categorias} />
                    </div>

                    <main className="flex-1 space-y-10">
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

                        {productos.length === 0 ? (
                            <div className="py-24 text-center space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                                <div className="w-16 h-16 rounded-full bg-[#e6dad1]/30 flex items-center justify-center text-[#3f2f2f]/40 mb-2">
                                    <Shirt className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <div className="space-y-3 max-w-md mx-auto">
                                    <h3 className="text-2xl font-serif text-[#3f2f2f] italic">Nuestra curaduría está vacía</h3>
                                    <p className="text-[#3f2f2f]/60 font-light text-sm leading-relaxed">
                                        No pudimos encontrar piezas que coincidan con tu búsqueda. Intenta suavizar los filtros.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link href="/tienda/catalogo" className="inline-block bg-transparent border border-[#3f2f2f] text-[#3f2f2f] px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#3f2f2f] hover:text-white transition-all duration-500">
                                        Restaurar Colección
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                                {productos.map((p, idx) => (
                                    <div key={p.id} className="animate-in fade-in slide-in-from-bottom-8 duration-[1000ms] ease-out" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <ProductoCard producto={p} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex justify-center pt-12 border-t border-[#e6dad1]/30 mt-12">
                                <Pagination totalPages={totalPages} />
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* SECCIONES EDITORIALES INFERIORES */}
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
