"use client";

import { Star, MessageCircleHeart } from "lucide-react";
import { useState, useEffect } from "react";
import ScrollReveal from "@/components/ui/scroll-reveal";

const testimonials = [
    {
        id: 1,
        name: "Isabella V.",
        role: "Clienta VIP",
        content: "La atención al detalle es inigualable. Nunca me he sentido más segura con un vestido. No es solo ropa, la curaduría es absolutamente impecable.",
        rating: 5,
        source: "Vía Privada"
    },
    {
        id: 2,
        name: "Camila R.",
        role: "Primera Experiencia",
        content: "Élara Atelier ha redefinido completamente la elegancia para mí. El empaque, el aroma y la calidad de la tela superan cualquier estándar.",
        rating: 5,
        source: "Vía Instagram"
    },
    {
        id: 3,
        name: "Sofia M.",
        role: "Envío Nacional",
        content: "Una verdadera experiencia premium de principio a fin. El seguimiento fue excelente y, al abrir la caja, la magia de la marca se sintió de inmediato.",
        rating: 5,
        source: "Vía Privada"
    }
];

export default function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length);
        }, 7000); // Aumentamos a 7 segundos para una lectura más calmada
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="bg-[#fdfbf9] py-24 md:py-32 overflow-hidden relative border-y border-[#e6dad1]/50">
            
            {/* ====================================================
                ELEMENTOS DE FONDO
            ==================================================== */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply z-0"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />
            
            {/* Círculos de luz y cristal */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#e6dad1]/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full border-[1px] border-[#864d2d]/10 pointer-events-none z-0 hidden lg:block" />

            {/* ====================================================
                CONTENIDO PRINCIPAL
            ==================================================== */}
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-10 items-center">
                    
                    {/* --- COLUMNA IZQUIERDA: TÍTULOS --- */}
                    <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <ScrollReveal direction="left" delay={0.1}>
                            <div className="space-y-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d] flex items-center justify-center lg:justify-start gap-3">
                                    <MessageCircleHeart className="w-3.5 h-3.5" /> La Experiencia Élara
                                </span>
                                <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">
                                    Voces de <br className="hidden lg:block"/>
                                    <span className="italic font-light text-[#864d2d]">Élara Atelier</span>
                                </h2>
                                <p className="text-sm md:text-base text-[#3f2f2f]/60 font-light leading-relaxed max-w-sm mx-auto lg:mx-0">
                                    Nuestra mayor recompensa es saber cómo nuestras prendas te hacen sentir.
                                </p>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* --- COLUMNA DERECHA: TARJETAS FLOTANTES --- */}
                    <div className="lg:col-span-8 relative min-h-[380px] md:min-h-[300px]">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={testimonial.id}
                                className={`absolute inset-0 w-full flex items-center justify-center lg:justify-end transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
                                    ${index === activeIndex
                                        ? "opacity-100 translate-y-0 scale-100 z-20"
                                        : index < activeIndex 
                                            ? "opacity-0 -translate-y-8 scale-95 z-0 pointer-events-none" // Sale hacia arriba
                                            : "opacity-0 translate-y-8 scale-95 z-0 pointer-events-none"  // Entra desde abajo
                                    }`}
                            >
                                {/* Tarjeta estilo Glassmorphism Editorial */}
                                <div className="bg-white/60 backdrop-blur-xl border border-white p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(63,47,47,0.1)] max-w-2xl w-full relative">
                                    
                                    {/* Comillas Decorativas */}
                                    <span className="absolute top-4 left-6 text-6xl md:text-8xl text-[#e6dad1]/40 font-serif leading-none select-none">
                                        "
                                    </span>

                                    {/* Contenido */}
                                    <div className="relative z-10">
                                        <div className="flex gap-1.5 mb-6 text-[#864d2d]">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} size={14} fill="currentColor" strokeWidth={1} />
                                            ))}
                                        </div>
                                        
                                        <blockquote className="text-xl md:text-3xl font-serif text-[#3f2f2f] leading-relaxed mb-8">
                                            {testimonial.content}
                                        </blockquote>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-[1px] bg-[#864d2d]/30" />
                                            <div>
                                                <cite className="not-italic text-sm md:text-base font-bold text-[#3f2f2f] block uppercase tracking-widest">
                                                    {testimonial.name}
                                                </cite>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#864d2d]/70 block mt-1">
                                                    {testimonial.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Indicadores (Dots) */}
                        <div className="absolute -bottom-12 lg:bottom-4 left-0 w-full flex justify-center lg:justify-end gap-3 z-30">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    className={`h-[1px] transition-all duration-500
                                        ${index === activeIndex ? "w-8 bg-[#864d2d]" : "w-4 bg-[#3f2f2f]/20 hover:bg-[#864d2d]/50"}`}
                                    aria-label={`Ver testimonio ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}