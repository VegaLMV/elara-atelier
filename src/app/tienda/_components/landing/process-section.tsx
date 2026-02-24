"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link"; // Importamos Link para la navegación

export default function ProcessSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        let animationFrameId: number;

        const handleScroll = () => {
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                
                // OPTIMIZACIÓN 1: Solo calculamos si la sección está visible en pantalla
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    // OPTIMIZACIÓN 2: Usamos requestAnimationFrame para sincronizar con la pantalla
                    animationFrameId = requestAnimationFrame(() => {
                        const scrollSpeed = 0.5;
                        setOffset(rect.top * scrollSpeed);
                    });
                }
            }
        };

        // OPTIMIZACIÓN 3: passive: true mejora el rendimiento del scroll táctil en móviles
        window.addEventListener("scroll", handleScroll, { passive: true });
        
        // Ejecución inicial por si el usuario recarga a mitad de página
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <section ref={sectionRef} className="relative h-[80vh] min-h-[500px] overflow-hidden flex items-center justify-center">
            {/* Parallax Background */}
            <div
                className="absolute inset-0 bg-cover bg-center will-change-transform"
                style={{
                    backgroundImage: 'url("https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/Extras/process.avif")',
                    transform: `translateY(${offset * 0.2}px) scale(1.15)` // Aumenté un pelín el scale a 1.15 para evitar bordes cortados
                }}
            >
                <div className="absolute inset-0 bg-black/50" /> {/* Oscurecí al 50% para mayor contraste */}
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl px-6 text-center text-[#e6dad1] space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
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
        </section>
    );
}