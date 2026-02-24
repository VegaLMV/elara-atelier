"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface VideoBannerProps {
    videoUrl: string;
    title?: string;
    subtitle?: string;
    description?: string | null;
    ctaText?: string;
    ctaHref?: string;
    overlayOpacity?: number;
}

export default function VideoBannerSection({
    videoUrl,
    title,
    subtitle,
    description,
    ctaText,
    ctaHref,
    overlayOpacity = 0.3
}: VideoBannerProps) {
    if (!videoUrl) return null;

    return (
        <section className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden bg-[#3f2f2f]">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src={videoUrl} type="video/mp4" />
                Tu navegador no soporta videos.
            </video>

            {/* Overlay Oscuro */}
            <div 
                className="absolute inset-0 bg-black transition-opacity duration-500"
                style={{ opacity: overlayOpacity }}
            />

            {/* Contenido (Textos y Botón) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
                {subtitle && (
                    <span className="text-white/80 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {subtitle}
                    </span>
                )}
                
                {title && (
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-4 md:mb-6 max-w-4xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both">
                        {title}
                    </h2>
                )}

                {description && (
                    <div className="max-w-2xl mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200 fill-mode-both">
                        <p className="text-white/70 font-light leading-relaxed text-sm md:text-base lg:text-lg italic font-serif">
                            {description}
                        </p>
                    </div>
                )}
                
                {ctaText && ctaHref && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
                        <Link 
                            href={ctaHref}
                            className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500"
                        >
                            {ctaText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}