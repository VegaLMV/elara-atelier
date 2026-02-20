"use client";

import { useRef, useEffect, useState } from "react";

export default function ProcessSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                const scrollSpeed = 0.5;
                setOffset((rect.top) * scrollSpeed);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section ref={sectionRef} className="relative h-[80vh] overflow-hidden flex items-center justify-center">
            {/* Parallax Background */}
            <div
                className="absolute inset-0 bg-cover bg-center will-change-transform"
                style={{
                    backgroundImage: 'url("https://jxyjpeylvhwxtqqefdjk.supabase.co/storage/v1/object/public/productos/banners/backgorund-elara.avif")',
                    transform: `translateY(${offset * 0.2}px) scale(1.1)`
                }}
            >
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl px-6 text-center text-[#e6dad1] space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <span className="block text-sm font-black uppercase tracking-[0.4em] text-[#e6dad1]/80">
                    El Taller
                </span>
                <h2 className="text-5xl md:text-7xl font-serif leading-tight">
                    Donde el Arte Encuentra <br />
                    <span className="italic text-[#864d2d] bg-[#e6dad1] px-4">la Artesanía</span>
                </h2>
                <p className="text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed text-[#e6dad1]/90">
                    Cada pieza en nuestra colección es un testimonio de las tradiciones ancestrales de la sastrería. Creemos en la belleza del proceso, la precisión del corte y el alma del tejido.
                </p>

                <div className="pt-8">
                    <button className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-transparent border border-[#e6dad1] rounded-full hover:bg-[#e6dad1] hover:text-[#3f2f2f] focus:outline-none">
                        <span className="mr-2">Descubre Nuestro Proceso</span>
                        <svg className="w-4 h-4 transition-transform duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
