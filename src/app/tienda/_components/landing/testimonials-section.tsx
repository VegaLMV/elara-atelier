"use client";

import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
    {
        id: 1,
        name: "Isabella V.",
        role: "Comprador Verificado",
        content: "La atención al detalle es simplemente inigualable. Nunca me he sentido más segura con un vestido. No es solo ropa; es una obra de arte.",
        rating: 5,
        location: "Lima, PE"
    },
    {
        id: 2,
        name: "Camila R.",
        role: "Comprador Verificado",
        content: "Elara Atelier ha redefinido completamente la elegancia para mí. La calidad de la tela y el ajuste son perfectos. Una verdadera experiencia de lujo.",
        rating: 5,
        location: "Cusco, PE"
    },
    {
        id: 3,
        name: "Sofia M.",
        role: "Comprador Verificado",
        content: "Desde el empaque hasta la puntada final, todo grita premium. Se lo recomendé a todas mis amigas.",
        rating: 5,
        location: "Arequipa, PE"
    }
];

export default function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="bg-[#e6dad1]/10 py-24 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#e6dad1]/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#864d2d]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="text-[#864d2d] text-xs font-black uppercase tracking-[0.2em]">Amado por Ellas</span>
                    <h2 className="text-4xl md:text-5xl font-serif text-[#3f2f2f]">Voces de Elara</h2>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Quote Icon Background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                        <Quote size={200} className="text-[#3f2f2f]" />
                    </div>

                    <div className="relative min-h-[300px] flex items-center justify-center">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={testimonial.id}
                                className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out px-4 ${index === activeIndex
                                        ? "opacity-100 translate-x-0 scale-100"
                                        : "opacity-0 translate-x-8 scale-95 pointer-events-none"
                                    }`}
                            >
                                <div className="flex gap-1 mb-6 text-[#864d2d]">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={20} fill="currentColor" />
                                    ))}
                                </div>
                                <blockquote className="text-2xl md:text-4xl font-serif text-[#3f2f2f] leading-snug mb-8 relative">
                                    "{testimonial.content}"
                                </blockquote>
                                <div className="space-y-1">
                                    <cite className="not-italic text-lg font-bold text-[#3f2f2f] block">
                                        {testimonial.name}
                                    </cite>
                                    <span className="text-sm text-[#3f2f2f]/60 font-light tracking-wide block">
                                        {testimonial.role} • {testimonial.location}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Indicators */}
                    <div className="flex justify-center gap-3 mt-12">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`h-1 transition-all duration-300 rounded-full ${index === activeIndex ? "w-12 bg-[#864d2d]" : "w-2 bg-[#3f2f2f]/20 hover:bg-[#3f2f2f]/40"
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
