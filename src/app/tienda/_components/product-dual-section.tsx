"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductoCard from "../producto-card";

type Product = {
    id: string;
    nombre: string;
    slug: string;
    categoria: string | undefined;
    imagenes: string[];
    precioOriginal: number;
    precioFinal: number;
    tieneDescuento: boolean;
    porcentaje: number | null;
    esNuevo: boolean;
    stock: number;
    destacado: boolean;
};

type ProductDualSectionProps = {
    title?: string;
    subtitle?: string;
    bannerTitle?: string;
    bannerCtaText?: string;
    bannerCtaHref?: string;
    bannerImageUrl?: string | null;
    newArrivals: Product[];
    bestSellers: Product[];
    campana?: {
        nombre: string;
        descripcion: string | null;
        valor: number;
        tipo: string;
        startsAt: Date;
        endsAt: Date;
        estado: string;
        productos?: { id: string; nombre: string; imagen: string | null }[];
    } | null;
};

export default function ProductDualSection({
    title = "NEW LAUNCH",
    subtitle = "BEST SELLER",
    bannerTitle = "The Pink Aurora Tulle Dress",
    bannerCtaText = "VIEW ALL",
    bannerCtaHref = "/tienda/catalogo",
    bannerImageUrl,
    newArrivals,
    bestSellers,
    campana
}: ProductDualSectionProps) {
    const [activeTab, setActiveTab] = useState<"new" | "best">("new");
    const products = activeTab === "new" ? newArrivals : bestSellers;
    const scrollRef = useRef<HTMLDivElement>(null);

    const displayTitle = campana?.nombre || bannerTitle;
    const displayDesc = campana?.descripcion || (campana ? `${campana.valor}${campana.tipo === 'PORCENTAJE' ? '%' : '$'} de descuento` : "");
    const displayHref = campana ? `/tienda/catalogo?campana=${campana.nombre}` : bannerCtaHref;

    const [isPaused, setIsPaused] = useState(false);
    const [canScroll, setCanScroll] = useState(false);

    // Asegurar que no hay duplicados en la data original (por si acaso)
    const uniqueProducts = products.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    // Detección de desbordamiento para activar el bucle
    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollWidth, clientWidth } = scrollRef.current;
            // Para el modo infinito, comparamos el ancho del contenido duplicado.
            // Si el contenido total es mayor al del contenedor, activamos el scroll.
            // Si no estamos duplicando aún (porque canScroll es false), forzamos una comprobación basada en el número de productos.
            const minProductsForScroll = 4; // Umbral mínimo razonable
            setCanScroll(scrollWidth > clientWidth || uniqueProducts.length >= minProductsForScroll);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        // Pequeño delay para asegurar que el DOM esté listo
        const timer = setTimeout(checkScroll, 500);
        return () => {
            window.removeEventListener("resize", checkScroll);
            clearTimeout(timer);
        };
    }, [activeTab, uniqueProducts.length]);

    // Lógica de Scroll Automático Lento (Seamless Loop) - Solo si hay desbordamiento
    useEffect(() => {
        if (isPaused || !canScroll || uniqueProducts.length === 0) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth } = scrollRef.current;
                const halfWidth = scrollWidth / 2;

                // Si pasamos la mitad (donde termina el primer set), saltamos al inicio instantáneamente
                if (scrollLeft >= halfWidth) {
                    scrollRef.current.scrollLeft = 0;
                } else {
                    scrollRef.current.scrollBy({ left: 1, behavior: "auto" });
                }
            }
        }, 30);

        return () => clearInterval(interval);
    }, [activeTab, isPaused, canScroll, uniqueProducts.length]);

    return (
        <section className="max-w-[1600px] mx-auto px-6 py-20">
            {/* Tabs Header */}
            <div className="flex justify-center gap-12 mb-16 border-b border-slate-100">
                <button
                    onClick={() => setActiveTab("new")}
                    className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "new" ? "text-slate-900" : "text-slate-300 hover:text-slate-500"
                        }`}
                >
                    {title}
                    {activeTab === "new" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in slide-in-from-left-2" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("best")}
                    className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "best" ? "text-slate-900" : "text-slate-300 hover:text-slate-500"
                        }`}
                >
                    {subtitle}
                    {activeTab === "best" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 animate-in fade-in slide-in-from-left-2" />
                    )}
                </button>
            </div>

            <div className={`flex flex-col lg:flex-row gap-8 ${!campana ? 'justify-center' : ''}`}>
                {/* Lateral Banner - Solo se muestra si hay una campaña vinculada */}
                {campana && (
                    <div className="w-full lg:w-[350px] group relative aspect-[4/5] lg:aspect-auto overflow-hidden rounded-2xl bg-slate-100 shrink-0">
                        {bannerImageUrl ? (
                            <img
                                src={bannerImageUrl}
                                alt={displayTitle}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400 font-serif italic text-center p-6">
                                {displayTitle}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                        <div className="absolute bottom-8 left-8 right-8 space-y-4">
                            <div className="space-y-1">
                                <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                                    Campaña Activa: {campana.estado}
                                </span>
                                <h3 className="text-3xl font-serif text-white leading-tight drop-shadow-md">
                                    {displayTitle}
                                </h3>
                                <p className="text-white/80 text-sm font-light leading-relaxed">
                                    {displayDesc}
                                </p>
                                <p className="text-white/60 text-[10px] uppercase tracking-tighter pt-1">
                                    Válido hasta: {new Date(campana.endsAt).toLocaleDateString()}
                                </p>
                                {campana.productos && campana.productos.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold">Incluye:</p>
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {campana.productos.slice(0, 4).map((imgProd) => (
                                                <div key={imgProd.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-white overflow-hidden" title={imgProd.nombre}>
                                                    {imgProd.imagen ? (
                                                        <img src={imgProd.imagen} alt={imgProd.nombre} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-[8px] text-slate-400">?</div>
                                                    )}
                                                </div>
                                            ))}
                                            {campana.productos.length > 4 && (
                                                <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-black bg-slate-800 text-[10px] text-white font-bold">
                                                    +{campana.productos.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Link
                                href={displayHref || "/tienda/catalogo"}
                                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-2xl"
                            >
                                Explorar Campaña <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Products Carousel Area */}
                <div className={`flex-1 relative group/carousel ${!campana ? 'max-w-[1400px]' : ''}`}>
                    <div
                        ref={scrollRef}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4"
                    >
                        {uniqueProducts.length > 0 ? (
                            (canScroll ? [...uniqueProducts, ...uniqueProducts] : uniqueProducts).map((p, idx) => (
                                <div
                                    key={`${p.id}-${idx}`}
                                    className="min-w-[280px] sm:min-w-[320px] lg:min-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-500 shrink-0"
                                    style={{ animationDelay: `${(idx % uniqueProducts.length) * 100}ms` }}
                                >
                                    <ProductoCard producto={p} />
                                </div>
                            ))
                        ) : (
                            <div className="w-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                <p className="text-slate-400 font-serif italic">Próximamente más productos...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
