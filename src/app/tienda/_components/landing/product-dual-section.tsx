"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles, Image as ImageIcon } from "lucide-react";
import { formatMoney } from "@/lib/precios";

// Tipo de producto con todas las propiedades necesarias
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

type Campana = {
    nombre: string;
    descripcion: string | null;
    valor: number;
    tipo: "PORCENTAJE" | "MONTO";
    startsAt: Date;
    endsAt: Date;
    estado: string;
    productos?: {
        id: string;
        nombre: string;
        imagen: string | null;
    }[];
};

interface ProductDualSectionProps {
    title?: string;
    subtitle?: string;
    newArrivals: CleanProduct[];
    bestSellers: CleanProduct[];
    campana?: Campana | null;
}

export default function ProductDualSection({
    title,
    subtitle,
    newArrivals,
    bestSellers,
    campana
}: ProductDualSectionProps) {
    const [activeTab, setActiveTab] = useState<"new" | "best">("new");
    const [isAnimating, setIsAnimating] = useState(false);

    // Los productos actuales según la pestaña
    const currentProducts = activeTab === "new" ? newArrivals : bestSellers;

    // Manejador del cambio de pestaña para forzar la animación
    const handleTabChange = (tab: "new" | "best") => {
        if (tab === activeTab) return;
        setIsAnimating(true);
        setActiveTab(tab);
        setTimeout(() => setIsAnimating(false), 700);
    };

    if (newArrivals.length === 0 && bestSellers.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-[#fcfaf8] relative">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* 1. HEADER Y PESTAÑAS (Estilo Vogue) */}
                <div className="flex flex-col items-center mb-12 md:mb-16">

                    {campana && (
                        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#864d2d] bg-[#864d2d]/10 px-4 py-1.5 rounded-full border border-[#864d2d]/20">
                                <Sparkles className="w-3 h-3" /> {campana.nombre}
                            </span>
                        </div>
                    )}

                    {/* Línea divisoria superior sutil */}
                    <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-[#e6dad1] to-transparent mb-6" />

                    <div className="flex items-center gap-8 md:gap-16">
                        <button
                            onClick={() => handleTabChange("new")}
                            className={`group relative text-xl md:text-2xl transition-all duration-500 ${activeTab === "new"
                                ? "font-serif italic text-[#3f2f2f]"
                                : "font-sans font-light text-[#3f2f2f]/40 hover:text-[#3f2f2f]/70"
                            }`}
                        >
                            {title || "Novedades"}
                            <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 h-[1px] bg-[#864d2d] transition-all duration-500 ${activeTab === "new" ? "w-8" : "w-0"}`} />
                        </button>

                        <div className="w-[1px] h-6 bg-[#e6dad1]" />

                        <button
                            onClick={() => handleTabChange("best")}
                            className={`group relative text-xl md:text-2xl transition-all duration-500 ${activeTab === "best"
                                ? "font-serif italic text-[#3f2f2f]"
                                : "font-sans font-light text-[#3f2f2f]/40 hover:text-[#3f2f2f]/70"
                            }`}
                        >
                            {subtitle || "Más Vendidos"}
                            <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 h-[1px] bg-[#864d2d] transition-all duration-500 ${activeTab === "best" ? "w-8" : "w-0"}`} />
                        </button>
                    </div>

                    {/* Línea divisoria inferior sutil */}
                    <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-[#e6dad1] to-transparent mt-6" />
                </div>

                {/* 2. GRID DE PRODUCTOS (Diseño Editorial) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                    {currentProducts.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                            <div className="w-12 h-[1px] bg-[#e6dad1]" />
                            <p className="text-[#3f2f2f]/40 font-serif italic text-lg md:text-xl">
                                Curando nuestra próxima selección...
                            </p>
                        </div>
                    ) : (
                        currentProducts.map((product, index) => {
                            // Verificamos de forma segura si existen imágenes
                            const hasImages = product.imagenes && product.imagenes.length > 0;
                            const mainImage = hasImages && product.imagenes[0].trim() !== "" ? product.imagenes[0] : null;
                            const hoverImage = hasImages && product.imagenes.length > 1 && product.imagenes[1].trim() !== "" ? product.imagenes[1] : null;

                            return (
                                <Link
                                    key={`${activeTab}-${product.id}`}
                                    href={`/tienda/${product.slug}`}
                                    className={`group flex flex-col gap-4 cursor-pointer w-full h-full
                                        ${isAnimating ? 'opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]' : 'opacity-100'}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* --- CONTENEDOR DE IMAGEN ALTA COSTURA --- */}
                                    <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe6] rounded-sm">

                                        {/* BADGES MINIMALISTAS */}
                                        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
                                            {campana ? (
                                                <span className="bg-[#864d2d] text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
                                                    {campana.tipo === 'PORCENTAJE' ? `${campana.valor}% OFF` : `-$${campana.valor}`}
                                                </span>
                                            ) : product.tieneDescuento ? (
                                                <span className="bg-[#864d2d] text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
                                                    {product.porcentaje}% OFF
                                                </span>
                                            ) : null}

                                            {product.esNuevo && (
                                                <span className="bg-[#3f2f2f] text-[#fcfaf8] text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
                                                    Nuevo
                                                </span>
                                            )}
                                            {product.destacado && activeTab !== "best" && (
                                                <span className="bg-white/90 backdrop-blur-md text-[#3f2f2f] border border-[#3f2f2f]/10 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
                                                    Top
                                                </span>
                                            )}
                                        </div>

                                        {/* SISTEMA DE IMÁGENES A PRUEBA DE FALLOS */}
                                        {mainImage ? (
                                            <>
                                                <Image
                                                    src={mainImage}
                                                    alt={product.nombre}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    quality={90}
                                                    priority={index < 4}
                                                    className={`object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105
                                                        ${hoverImage ? 'group-hover:opacity-0' : ''}
                                                    `}
                                                />
                                                {hoverImage && (
                                                    <Image
                                                        src={hoverImage}
                                                        alt={`${product.nombre} vista 2`}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        quality={90}
                                                        className="object-cover absolute inset-0 opacity-0 transition-all duration-[1s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:scale-105"
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3f2f2f]/30 space-y-3">
                                                <ImageIcon className="w-8 h-8 opacity-50" />
                                                <span className="font-serif italic text-sm">Imagen en curaduría</span>
                                            </div>
                                        )}

                                        {/* BOTÓN "VER DETALLES" (Estilo Boutique) */}
                                        {product.stock > 0 && (
                                            <div className="absolute inset-x-4 bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20">
                                                <div className="w-full bg-white/95 backdrop-blur-md text-[#3f2f2f] text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 text-center flex items-center justify-center gap-2 border border-black/5 hover:bg-[#3f2f2f] hover:text-white transition-colors shadow-xl">
                                                    Ver detalles <ArrowUpRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        )}

                                        {/* OVERLAY AGOTADO TOTAL (Elegante) */}
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                                                <div className="border border-[#3f2f2f] text-[#3f2f2f] bg-white/90 px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] shadow-lg">
                                                    Agotado
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* --- TEXTOS DEL PRODUCTO (Centrados) --- */}
                                    <div className="space-y-1.5 px-1 text-center">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#864d2d]/70">
                                            {product.categoria || "Colección Exclusiva"}
                                        </p>
                                        <h3 className="text-sm md:text-base font-serif text-[#3f2f2f] line-clamp-1 group-hover:text-[#864d2d] transition-colors">
                                            {product.nombre}
                                        </h3>

                                        <div className="flex items-center justify-center gap-3 pt-1">
                                            {campana ? (
                                                <>
                                                    <span className="text-xs text-[#3f2f2f]/40 line-through">
                                                        {formatMoney(product.precioOriginal)}
                                                    </span>
                                                    <span className="text-sm font-bold text-[#864d2d]">
                                                        {formatMoney(
                                                            campana.tipo === "PORCENTAJE"
                                                                ? product.precioOriginal * (1 - campana.valor / 100)
                                                                : product.precioOriginal - campana.valor
                                                        )}
                                                    </span>
                                                </>
                                            ) : product.tieneDescuento ? (
                                                <>
                                                    <span className="text-xs text-[#3f2f2f]/40 line-through">
                                                        {formatMoney(product.precioOriginal)}
                                                    </span>
                                                    <span className="text-sm font-bold text-[#864d2d]">
                                                        {formatMoney(product.precioFinal)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm font-medium text-[#3f2f2f]/80">
                                                    {formatMoney(product.precioFinal)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* 3. ENLACE AL CATÁLOGO COMPLETO */}
                <div className="mt-16 flex justify-center">
                    <Link
                        href={`/tienda/catalogo${activeTab === "new" ? '?sort=new' : ''}`}
                        className="group inline-flex items-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[#3f2f2f] hover:text-[#864d2d] transition-colors"
                    >
                        <span className="border-b border-[#3f2f2f]/30 group-hover:border-[#864d2d] pb-1 transition-colors">
                            Ver selección completa
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

            </div>

            {/* CSS Inyectado para la animación en cascada (Staggered Fade In Up) */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}} />
        </section>
    );
}