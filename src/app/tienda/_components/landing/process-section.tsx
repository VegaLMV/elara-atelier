"use client";

import { useRef, useEffect, useState } from "react";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function ProcessSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let animationFrameId: number;

        const handleScroll = () => {
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    animationFrameId = requestAnimationFrame(() => {
                        const scrollSpeed = 0.5;
                        setOffset(rect.top * scrollSpeed);
                    });
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <section ref={sectionRef} className="relative h-[80vh] min-h-[500px] overflow-hidden flex items-center justify-center">
            <div
                className="absolute inset-0 bg-cover bg-center will-change-transform"
                style={{
                    backgroundImage: 'url("https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/process.avif")',
                    transform: `translateY(${offset * 0.2}px) scale(1.15)`
                }}
            >
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="relative z-10 max-w-4xl px-6 text-center text-[#e6dad1]">
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="space-y-8">
                        <span className="block text-xs md:text-sm font-black uppercase tracking-[0.4em] text-[#e6dad1]/80">
                            Nuestra Esencia
                        </span>
                        
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-tight">
                            El Arte de la <br className="hidden md:block" />
                            <span className="italic text-[#864d2d] bg-[#e6dad1] px-4 md:px-6 md:leading-relaxed inline-block mt-2">Curaduría</span>
                        </h2>
                        
                        <p className="text-base md:text-xl font-light max-w-2xl mx-auto leading-relaxed text-[#e6dad1]/90">
                            Cada pieza en Élara Atelier ha sido minuciosamente seleccionada. Buscamos incansablemente los mejores tejidos, el calce perfecto y diseños atemporales.
                        </p>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}