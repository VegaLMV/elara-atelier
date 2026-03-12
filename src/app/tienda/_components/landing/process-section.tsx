"use client";

import { useRef, useEffect, useState } from "react";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function ProcessSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);

    // Parallax Effect Optimization
    useEffect(() => {
        let animationFrameId: number;

        const handleScroll = () => {
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                
                // Solo animar si la sección está en la ventana visual
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    animationFrameId = requestAnimationFrame(() => {
                        const scrollSpeed = 0.4; // Movimiento suave
                        // Calculamos el centro de la pantalla para un movimiento más natural
                        const centerOffset = (rect.top - window.innerHeight / 2) * scrollSpeed;
                        setOffset(centerOffset);
                    });
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <section ref={sectionRef} className="relative py-24 md:py-32 bg-[#fdfbf9]">
            <div className="max-w-[1600px] mx-auto px-6 h-[70vh] md:h-[90vh] min-h-[600px] relative">
                
                {/* --- MARCO CONTENEDOR CON PARALLAX (Efecto Ventana) --- */}
                <div className="relative w-full h-full overflow-hidden rounded-sm bg-[#3f2f2f]">
                    <div
                        className="absolute inset-0 bg-cover bg-center will-change-transform opacity-70 grayscale-[0.3]"
                        style={{
                            backgroundImage: 'url("https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/process.avif")',
                            // Escala ampliada para evitar bordes blancos al mover la imagen
                            transform: `translateY(${offset}px) scale(1.3)`
                        }}
                    >
                        {/* Gradientes internos para oscurecer bordes y resaltar texto */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                    </div>

                    {/* --- CONTENIDO TEXTUAL --- */}
                    <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-16 lg:p-24 z-10">
                        
                        {/* Header Superior */}
                        <ScrollReveal direction="down" delay={0.1}>
                            <div className="flex items-center gap-4">
                                <div className="w-8 md:w-12 h-[1px] bg-[#e6dad1]/60" />
                                <span className="block text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-[#e6dad1]">
                                    Manifiesto de Marca
                                </span>
                            </div>
                        </ScrollReveal>
                        
                        {/* Título y Párrafo (Alineación Editorial) */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                            
                            {/* Título Gigante */}
                            <ScrollReveal direction="up" delay={0.3}>
                                <h2 className="text-5xl sm:text-6xl md:text-[5rem] lg:text-[7rem] font-serif leading-[0.9] tracking-tight text-white max-w-2xl drop-shadow-2xl">
                                    El Arte <br />
                                    <span className="italic text-[#e6dad1] font-light">de la</span> <br className="hidden md:block" />
                                    <span className="text-[#864d2d]">Curaduría</span>
                                </h2>
                            </ScrollReveal>
                            
                            {/* Bloque de texto descriptivo (Estilo Prólogo) */}
                            <ScrollReveal direction="up" delay={0.5}>
                                <div className="max-w-md bg-[#fdfbf9]/10 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-sm">
                                    <p className="text-sm md:text-base font-light leading-relaxed text-[#e6dad1] drop-shadow-md">
                                        Cada pieza en Élara Atelier ha sido minuciosamente seleccionada. Buscamos incansablemente los mejores tejidos, el calce perfecto y diseños atemporales que trascienden temporadas. No vendemos ropa, ofrecemos declaraciones de estilo.
                                    </p>
                                </div>
                            </ScrollReveal>

                        </div>
                    </div>

                    {/* Sello Geométrico Fino de decoración */}
                    <div className="absolute top-8 right-8 md:top-16 md:right-16 w-16 h-16 md:w-24 md:h-24 border-[0.5px] border-[#e6dad1]/20 rounded-full flex items-center justify-center animate-[spin_30s_linear_infinite] pointer-events-none">
                        <div className="w-12 h-12 md:w-16 md:h-16 border-[0.5px] border-[#864d2d]/30 rounded-full dashed" />
                    </div>
                </div>

            </div>
        </section>
    );
}