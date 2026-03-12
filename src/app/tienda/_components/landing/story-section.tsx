"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface StorySectionProps {
    title?: string;
    body?: string;
    imageUrl?: string | null;
    ctaText?: string;
    ctaHref?: string;
}

export default function StorySection({
    title = "El Arte de Elegir",
    body = "ÉLARA ATELIER nace de una búsqueda incansable por la prenda perfecta. Creemos que la verdadera elegancia no requiere esfuerzo, sino la selección adecuada.\n\nNo diseñamos ropa, diseñamos confianza. Recorremos catálogos, tocamos texturas y filtramos cientos de opciones para curar una colección de piezas versátiles, atemporales y con un calce impecable.\n\nNuestra misión es simple: que cada vez que elijas algo de nuestra boutique, sepas que fue seleccionado pensando en realzar tu belleza natural.",
    imageUrl = "https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/story_section.avif",
    ctaText = "Descubrir nuestra historia",
    ctaHref = "/tienda/nosotros"
}: StorySectionProps) {
    return (
        <section className="bg-[#fdfbf9] py-24 md:py-32 relative overflow-hidden border-t border-[#e6dad1]/30">
            
            {/* ====================================================
                ELEMENTOS DE FONDO (Textura y Luz)
            ==================================================== */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply z-0"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />
            
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#e6dad1]/40 rounded-full blur-[120px] pointer-events-none z-0" />
            
            {/* Texto Fantasma Vertical */}
            <div className="absolute top-0 right-0 h-full flex items-center pr-4 md:pr-10 z-0 pointer-events-none select-none overflow-hidden">
                <span className="text-[12vw] font-serif uppercase tracking-widest text-[#3f2f2f] opacity-[0.02] [writing-mode:vertical-rl] rotate-180">
                    Heritage
                </span>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    
                    {/* ====================================================
                        LADO DE LA IMAGEN (Estilo Galería)
                    ==================================================== */}
                    <div className="w-full lg:w-5/12 relative group">
                        <ScrollReveal direction="left" delay={0.1}>
                            
                            {/* Marco Decorativo Desfasado */}
                            <div className="absolute -inset-4 md:-inset-6 border border-[#864d2d]/20 z-0 transition-transform duration-[1.5s] ease-out group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none" />
                            
                            {/* Círculo Esmerilado Decorativo */}
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/40 backdrop-blur-md border border-white/50 z-20 pointer-events-none transition-transform duration-[2s] group-hover:scale-110" />

                            {/* Etiqueta Flotante Minimalista */}
                            <div className="absolute top-8 -right-4 md:-right-8 bg-[#3f2f2f] text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] px-3 py-6 md:px-4 md:py-8 [writing-mode:vertical-rl] rotate-180 z-30 shadow-2xl">
                                EST. 2026 • ÉLARA ATELIER
                            </div>

                            {/* Contenedor Principal de la Imagen */}
                            <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden shadow-2xl z-10 bg-[#e6dad1]/20 p-2 md:p-3">
                                <div className="relative w-full h-full overflow-hidden">
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            className="object-cover transition-transform duration-[3s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 grayscale-[0.2] group-hover:grayscale-0"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-serif italic text-[#3f2f2f]/30">
                                            Curando historia...
                                        </div>
                                    )}
                                    {/* Capa de oscurecimiento suave */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* ====================================================
                        LADO DEL TEXTO (Editorial)
                    ==================================================== */}
                    <div className="w-full lg:w-7/12 relative z-20 lg:pl-8">
                        
                        <div className="space-y-10 md:space-y-12">
                            {/* Título Principal */}
                            <div>
                                <ScrollReveal direction="up" delay={0.2}>
                                    <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-[#864d2d] flex items-center gap-4 mb-6">
                                        <div className="w-8 h-[1px] bg-[#864d2d]" /> Nuestra Esencia
                                    </span>
                                </ScrollReveal>

                                <ScrollReveal direction="up" delay={0.3}>
                                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-serif text-[#3f2f2f] leading-[1.1] tracking-tight relative">
                                        <span className="relative z-10">El Arte</span> <br />
                                        <span className="italic font-light text-[#864d2d] relative z-10">de Elegir</span>
                                        {/* Comillas fantasmas de fondo */}
                                        <span className="absolute -top-10 -left-6 md:-top-16 md:-left-10 text-[6rem] md:text-[10rem] font-serif text-[#e6dad1]/40 leading-none select-none z-0">
                                            "
                                        </span>
                                    </h2>
                                </ScrollReveal>
                            </div>
                            
                            {/* Párrafos Dinámicos */}
                            <div className="space-y-6 md:space-y-8 relative z-10">
                                {body.split('\n').filter(p => p.trim() !== "").map((paragraph, i) => (
                                    <ScrollReveal 
                                        key={i} 
                                        direction="up" 
                                        delay={0.4 + (i * 0.1)}
                                    >
                                        <p className={`text-[#3f2f2f]/70 leading-relaxed font-light ${i === 0 ? 'text-lg md:text-xl text-[#3f2f2f]/90' : 'text-sm md:text-base max-w-xl'}`}>
                                            {paragraph}
                                        </p>
                                    </ScrollReveal>
                                ))}
                            </div>

                            {/* Botón y Firma */}
                            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-t border-[#e6dad1]/50 relative z-10">
                                <ScrollReveal direction="up" delay={0.7}>
                                    <Link
                                        href={ctaHref}
                                        className="inline-flex items-center gap-4 group/btn"
                                    >
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#3f2f2f] group-hover/btn:tracking-[0.4em] transition-all duration-500 border-b border-[#3f2f2f] pb-1">
                                            {ctaText}
                                        </span>
                                        <ArrowRight className="w-4 h-4 text-[#3f2f2f] transition-transform duration-500 group-hover/btn:translate-x-2" strokeWidth={1.5} />
                                    </Link>
                                </ScrollReveal>

                                <ScrollReveal direction="none" delay={0.9}>
                                    <div className="flex items-center gap-3 opacity-60 select-none">
                                        <span className="font-serif italic text-xs md:text-sm text-[#864d2d]">Élara Signature</span>
                                        <div className="h-[1px] w-8 md:w-12 bg-[#864d2d]" />
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}