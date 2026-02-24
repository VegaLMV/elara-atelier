"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

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
    // Imagen actualizada: Refleja sofisticación, texturas y la paleta de colores de la marca.
    imageUrl = "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070&auto=format&fit=crop",
    ctaText = "Descubre nuestra historia",
    ctaHref = "/tienda/nosotros"
}: StorySectionProps) {
    return (
        <section className="max-w-[1400px] mx-auto px-6 py-24 overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                {/* Image Side - Left */}
                <div className="w-full lg:w-1/2 relative group">
                    {/* Decorative Background Elements (Ganchos Visuales) */}
                    <div className="absolute -top-6 -left-6 md:-top-10 md:-left-10 w-32 h-32 md:w-48 md:h-48 border-l-2 border-t-2 border-[#864d2d]/30 pointer-events-none transition-transform duration-700 group-hover:-translate-x-4 group-hover:-translate-y-4" />
                    <div className="absolute -bottom-6 -right-6 md:-bottom-10 md:-right-10 w-32 h-32 md:w-48 md:h-48 border-r-2 border-b-2 border-[#864d2d]/30 pointer-events-none transition-transform duration-700 group-hover:translate-x-4 group-hover:translate-y-4" />

                    {/* Decorative Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] md:w-[120%] md:h-[120%] border border-[#e6dad1] rounded-full opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-1000 ease-out z-0 pointer-events-none" />

                    {/* Floating Decorative Label */}
                    <div className="absolute top-8 right-[-15px] md:right-[-30px] bg-[#3f2f2f] text-[#e6dad1] text-[9px] md:text-[11px] font-black uppercase tracking-[0.35em] px-4 py-6 md:px-5 md:py-8 [writing-mode:vertical-lr] z-20 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-1000">
                        EST. 2026 • ÉLARA ATELIER
                    </div>

                    {/* Main Image Container */}
                    <div className="relative aspect-[4/5] overflow-hidden shadow-2xl z-10 rounded-sm border border-[#e6dad1]/50">
                        {/* Inner Border Frame */}
                        <div className="absolute inset-3 md:inset-4 border border-white/40 z-20 pointer-events-none mix-blend-overlay" />

                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                quality={85}
                                className="object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#e6dad1]/20 flex items-center justify-center font-serif italic text-[#3f2f2f]/40">
                                Imagen de Historia
                            </div>
                        )}
                        {/* Overlay subtle */}
                        <div className="absolute inset-0 bg-[#3f2f2f]/10 group-hover:bg-transparent transition-colors duration-700 pointer-events-none" />
                    </div>

                    {/* Accent Detail - Quote */}
                    <div className="absolute -bottom-4 -left-6 md:-bottom-8 md:-left-12 hidden md:block z-30">
                        <span className="text-7xl md:text-9xl font-serif text-[#e6dad1] select-none drop-shadow-md">“</span>
                    </div>
                </div>

                {/* Text Side - Right */}
                <div className="w-full lg:w-1/2 space-y-8 relative">
                    {/* Decorative Watermark bg */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 text-[6rem] md:text-[10rem] font-serif text-[#e6dad1]/40 opacity-50 select-none pointer-events-none z-0">
                        Story
                    </div>

                    <div className="space-y-4 md:space-y-6 relative z-10">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#864d2d] block animate-in fade-in slide-in-from-bottom-2 duration-700">
                            Nuestra Esencia
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#3f2f2f] leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 relative inline-block">
                            {title}
                            {/* Subrayado asimétrico */}
                            <svg className="absolute w-full h-3 -bottom-2 left-0 text-[#e6dad1]" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                        </h2>
                    </div>
                    
                    {/* Decorative Separator Line */}
                    <div className="w-16 md:w-24 h-[1px] bg-[#e6dad1] relative z-10" />

                    <div className="space-y-4 md:space-y-6 relative z-10">
                        {body.split('\n').map((paragraph, i) => (
                            <p
                                key={i}
                                className="text-[#3f2f2f]/80 leading-relaxed font-light text-base md:text-lg animate-in fade-in slide-in-from-bottom-6 duration-1000"
                                style={{ animationDelay: `${200 + i * 100}ms` }}
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="pt-4 md:pt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 relative z-10">
                        <Link
                            href={ctaHref}
                            className="inline-flex items-center gap-4 group/btn"
                        >
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#3f2f2f] group-hover/btn:tracking-[0.4em] transition-all duration-300 border-b border-[#3f2f2f] pb-2">
                                {ctaText}
                            </span>
                            <ArrowRight className="w-4 h-4 text-[#3f2f2f] transition-transform duration-300 group-hover/btn:translate-x-2" />
                        </Link>
                    </div>

                    {/* Sign or Stamp */}
                    <div className="pt-8 md:pt-12 flex items-center gap-4 opacity-50 select-none animate-in fade-in duration-[2s] relative z-10">
                        <div className="h-[1px] w-8 md:w-12 bg-[#864d2d]" />
                        <span className="font-serif italic text-xs md:text-sm text-[#864d2d]">Élara Atelier Signature</span>
                    </div>
                </div>
            </div>
        </section>
    );
}