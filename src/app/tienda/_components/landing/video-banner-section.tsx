"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface VideoBannerProps {
    videoUrl: string;
    title?: string;
    subtitle?: string;
    description?: string | null;
    ctaText?: string;
    ctaHref?: string;
    categorySlug?: string; 
    overlayOpacity?: number;
}

export default function VideoBannerSection({
    videoUrl,
    title,
    subtitle,
    description,
    ctaText,
    ctaHref,
    categorySlug,
    overlayOpacity = 0.3
}: VideoBannerProps) {
    if (!videoUrl) return null;

    // LÓGICA DE URL DINÁMICA
    const finalHref = (categorySlug && (!ctaHref || ctaHref === "/tienda/catalogo"))
        ? `/tienda/catalogo?categoria=${categorySlug}#catalogo-grid`
        : (ctaHref || "/tienda/catalogo#catalogo-grid");

    return (
        <section className="relative w-full h-[80vh] md:h-[100vh] min-h-[600px] overflow-hidden bg-[#1a1311]">
            
            {/* ====================================================
                VIDEO DE FONDO
            ==================================================== */}
            <div className="absolute inset-0 w-full h-full transform scale-105">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
                >
                    <source src={videoUrl} type="video/mp4" />
                    Tu navegador no soporta videos.
                </video>
            </div>

            {/* ====================================================
                CAPAS DE SUPERPOSICIÓN (Gradientes Cinematográficos)
            ==================================================== */}
            {/* Overlay Oscuro Base */}
            <div 
                className="absolute inset-0 bg-[#1a1311] transition-opacity duration-[2s] ease-in-out mix-blend-multiply"
                style={{ opacity: overlayOpacity }}
            />
            
            {/* Viñeta: Oscurece los bordes para centrar la atención */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(26,19,17,0.6)_100%)] pointer-events-none" />
            
            {/* Gradiente Inferior para facilitar lectura del botón */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1311]/80 via-transparent to-transparent pointer-events-none" />

            {/* ====================================================
                CONTENIDO PRINCIPAL
            ==================================================== */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
                <div className="max-w-4xl mx-auto flex flex-col items-center">
                    
                    {/* Subtítulo (Etiqueta fina) */}
                    {subtitle && (
                        <ScrollReveal direction="down" delay={0.2}>
                            <div className="flex items-center gap-4 mb-6 md:mb-8">
                                <div className="hidden md:block w-8 h-[1px] bg-white/40" />
                                <span className="inline-block text-white/90 text-[10px] md:text-xs font-black uppercase tracking-[0.5em]">
                                    {subtitle}
                                </span>
                                <div className="hidden md:block w-8 h-[1px] bg-white/40" />
                            </div>
                        </ScrollReveal>
                    )}
                    
                    {/* Título Principal (Monumental) */}
                    {title && (
                        <ScrollReveal direction="up" delay={0.4}>
                            <h2 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7rem] font-serif text-white mb-6 md:mb-8 leading-[0.95] tracking-tight drop-shadow-xl">
                                {title.split(' ').map((word, i, arr) => {
                                    // Convierte la última palabra (o penúltima) a cursiva para ese look editorial
                                    if (i === arr.length - 1) {
                                        return <span key={i} className="italic font-light text-white/90">{word} </span>;
                                    }
                                    return <span key={i}>{word} </span>;
                                })}
                            </h2>
                        </ScrollReveal>
                    )}

                    {/* Descripción Corta */}
                    {description && (
                        <ScrollReveal direction="up" delay={0.6}>
                            <div className="max-w-xl mb-10 md:mb-12">
                                <p className="text-white/80 font-light leading-relaxed text-sm md:text-base lg:text-lg drop-shadow-md">
                                    {description}
                                </p>
                            </div>
                        </ScrollReveal>
                    )}
                    
                    {/* Botón de Llamada a la Acción (Glassmorphism Fino) */}
                    {ctaText && (
                        <ScrollReveal direction="up" delay={0.8}>
                            <Link 
                                href={finalHref}
                                className="group relative inline-flex items-center gap-4 overflow-hidden"
                            >
                                {/* Fondo difuminado que crece en hover */}
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/20 transition-all duration-700 ease-out group-hover:bg-white" />
                                
                                <div className="relative z-10 flex items-center gap-4 px-8 py-4 transition-colors duration-700 group-hover:text-[#1a1311]">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white group-hover:text-[#1a1311] transition-colors duration-700">
                                        {ctaText}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-white group-hover:text-[#1a1311] transition-transform duration-700 group-hover:translate-x-1" strokeWidth={1.5} />
                                </div>
                            </Link>
                        </ScrollReveal>
                    )}

                </div>
            </div>

            {/* Sello de agua vertical para texturizar */}
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 pointer-events-none select-none hidden lg:block z-0">
                <span className="text-[120px] font-serif uppercase tracking-widest text-white/5 [writing-mode:vertical-rl] rotate-180">
                    Cinema
                </span>
            </div>
            
        </section>
    );
}