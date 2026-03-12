"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface Props {
    title: string;
    subtitle?: string;
    description?: string | null;
    categorySlug?: string;
    ctaText?: string;
    ctaHref?: string;
    imageUrl?: string | null;
}

export default function CategorySpotlightSection({
    title,
    subtitle,
    description,
    categorySlug,
    ctaText,
    ctaHref,
    imageUrl
}: Props) {
    const finalHref = ctaHref || (categorySlug ? `/tienda/catalogo?categoria=${categorySlug}` : "/tienda/catalogo");

    return (
        <section className="py-24 md:py-40 bg-[#fdfbf9] relative overflow-hidden border-t border-[#e6dad1]/40">
            
            {/* ====================================================
                ELEMENTOS DE FONDO (Texto Fantasma)
            ==================================================== */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none select-none z-0 hidden lg:block">
                <span className="text-[15vw] font-serif uppercase tracking-[0.2em] text-[#3f2f2f] opacity-[0.02] whitespace-nowrap">
                    Atelier
                </span>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

                    {/* --- COLUMNA IZQUIERDA: IMAGEN (Estilo Galería) --- */}
                    <div className="lg:col-span-6 relative group">
                        <ScrollReveal direction="left" delay={0.1}>
                            {/* Marco Decorativo Desfasado */}
                            <div className="absolute -inset-4 md:-inset-8 border border-[#864d2d]/20 z-0 transition-transform duration-[1.5s] ease-out group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none" />
                            
                            <div className="relative aspect-[3/4] md:aspect-[4/5] w-full bg-[#e6dad1]/20 shadow-2xl z-10 overflow-hidden p-2 md:p-4 bg-white">
                                <div className="relative w-full h-full overflow-hidden">
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            className="object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#3f2f2f]/30 font-serif italic text-sm">
                                            Curando Imagen...
                                        </div>
                                    )}
                                    {/* Overlay de gradiente sutil */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* --- COLUMNA DERECHA: CONTENIDO EDITORIAL --- */}
                    <div className="lg:col-span-6 space-y-10 lg:pl-10">
                        <div className="space-y-6">
                            {subtitle && (
                                <ScrollReveal direction="up" delay={0.2}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-[1px] bg-[#864d2d]" />
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-[#864d2d]">
                                            {subtitle}
                                        </span>
                                    </div>
                                </ScrollReveal>
                            )}
                            
                            <ScrollReveal direction="up" delay={0.4}>
                                <h2 className="text-5xl md:text-6xl lg:text-[5rem] font-serif text-[#3f2f2f] leading-[1] tracking-tight">
                                    {title.split(' ').map((word, i, arr) => (
                                        <span key={i} className={i === arr.length - 1 ? "italic font-light text-[#864d2d]" : ""}>
                                            {word}{' '}
                                        </span>
                                    ))}
                                </h2>
                            </ScrollReveal>
                        </div>

                        <ScrollReveal direction="up" delay={0.6}>
                            <div className="space-y-6">
                                <p className="text-[#3f2f2f]/60 font-light leading-relaxed max-w-md text-base md:text-lg">
                                    {description || "Una selección meticulosa donde la forma y la textura convergen. Piezas diseñadas para realzar la silueta femenina con una elegancia atemporal y un carácter distintivo."}
                                </p>
                                {/* Línea divisoria minimalista */}
                                <div className="w-16 h-[1px] bg-[#e6dad1]" />
                            </div>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.8}>
                            <div className="pt-4">
                                <Link
                                    href={finalHref}
                                    className="group inline-flex items-center gap-6 group/btn"
                                >
                                    <div className="relative">
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#3f2f2f] group-hover/btn:text-[#864d2d] transition-colors duration-500">
                                            {ctaText || "Explorar Selección"}
                                        </span>
                                        <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-[#3f2f2f]/20 group-hover/btn:bg-[#864d2d] transition-colors duration-500" />
                                        <div className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[#864d2d] group-hover/btn:w-full transition-all duration-700" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-[#3f2f2f]/10 flex items-center justify-center group-hover/btn:border-[#864d2d] group-hover/btn:bg-[#864d2d] transition-all duration-500">
                                        <ArrowRight className="w-4 h-4 text-[#3f2f2f] group-hover/btn:text-white transition-all duration-500 group-hover/btn:translate-x-1" />
                                    </div>
                                </Link>
                            </div>
                        </ScrollReveal>
                    </div>
                    
                </div>
            </div>

            {/* Ruido sutil de fondo para textura de papel */}
            <div 
                className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-multiply z-0"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />
        </section>
    );
}