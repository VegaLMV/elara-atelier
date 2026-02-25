"use client";

import { Star, MessageCircleHeart } from "lucide-react";
import { useState, useEffect } from "react";
import ScrollReveal from "@/components/ui/scroll-reveal";

const testimonials = [
    {
        id: 1,
        name: "Isabella V.",
        role: "Clienta de Ica",
        content: "La atención al detalle es inigualable. Nunca me he sentido más segura con un vestido. No es solo ropa, la curaduría es impecable.",
        rating: 5,
        source: "Vía WhatsApp"
    },
    {
        id: 2,
        name: "Camila R.",
        role: "Clienta de Lima",
        content: "Élara Atelier ha redefinido completamente la elegancia para mí. El empaque, el aroma y la calidad de la tela son perfectos.",
        rating: 5,
        source: "Vía Instagram"
    },
    {
        id: 3,
        name: "Sofia M.",
        role: "Clienta de Arequipa",
        content: "Tenía miedo de pedir a provincia, pero el seguimiento fue excelente. Cuando abrí el paquete supe que era una verdadera experiencia premium.",
        rating: 5,
        source: "Vía WhatsApp"
    }
];

export default function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="bg-[#fcfaf8] py-24 overflow-hidden relative border-y border-[#e6dad1]/30">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#e6dad1]/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#864d2d]/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <ScrollReveal direction="up" delay={0.1}>
                    <div className="text-center mb-16 space-y-4">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-[#864d2d] flex items-center justify-center gap-3">
                            <MessageCircleHeart className="w-4 h-4" /> La Experiencia Élara
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#3f2f2f] tracking-tight">
                            Voces de nuestras clientas
                        </h2>
                        <div className="w-16 h-[1px] bg-[#864d2d]/30 mx-auto mt-6" />
                    </div>
                </ScrollReveal>

                <div className="relative max-w-4xl mx-auto">
                    <div className="relative min-h-[280px] md:min-h-[250px] flex items-center justify-center">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={testimonial.id}
                                className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[1s] ease-[cubic-bezier(0.25,1,0.5,1)] px-4 
                                    ${index === activeIndex
                                        ? "opacity-100 translate-x-0 scale-100"
                                        : "opacity-0 translate-x-12 scale-95 pointer-events-none"
                                    }`}
                            >
                                <div className="flex gap-1.5 mb-8 text-[#864d2d]">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={18} fill="currentColor" strokeWidth={1} />
                                    ))}
                                </div>
                                
                                <blockquote className="text-2xl md:text-4xl font-serif text-[#3f2f2f] leading-snug mb-8 relative px-4 md:px-12">
                                    <span className="absolute -top-4 -left-2 text-6xl text-[#e6dad1] opacity-50 font-serif">"</span>
                                    {testimonial.content}
                                    <span className="absolute -bottom-8 -right-2 text-6xl text-[#e6dad1] opacity-50 font-serif">"</span>
                                </blockquote>
                                
                                <div className="space-y-2 mt-4">
                                    <cite className="not-italic text-lg font-bold text-[#3f2f2f] block tracking-wide">
                                        {testimonial.name}
                                    </cite>
                                    <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-[#864d2d]/70">
                                        <span>{testimonial.role}</span>
                                        <span className="w-1 h-1 rounded-full bg-[#864d2d]/30" />
                                        <span>{testimonial.source}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <ScrollReveal direction="none" delay={0.4}>
                        <div className="flex justify-center items-center gap-3 mt-16">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    className={`h-[2px] transition-all duration-500 rounded-full 
                                        ${index === activeIndex ? "w-12 bg-[#864d2d]" : "w-4 bg-[#e6dad1] hover:bg-[#864d2d]/50"}`}
                                    aria-label={`Ver testimonio ${index + 1}`}
                                />
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}