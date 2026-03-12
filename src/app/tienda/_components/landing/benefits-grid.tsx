"use client";

import { Truck, ShieldCheck, Sparkles, Clock } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function BenefitsGrid() {
    const benefits = [
        {
            icon: Truck,
            title: "Envíos Exclusivos",
            description: "Cobertura nacional y seguimiento en tiempo real."
        },
        {
            icon: ShieldCheck,
            title: "Transacciones Privadas",
            description: "Máxima confidencialidad en cada una de sus compras."
        },
        {
            icon: Sparkles, 
            title: "Asesoría de Estilo",
            description: "Acompañamiento experto para perfeccionar su elección."
        },
        {
            icon: Clock,
            title: "Cuidado y Agilidad",
            description: "Procesamos cada pieza con dedicación en menos de 24 horas hábiles."
        }
    ];

    return (
        // ESPACIADO REDUCIDO: py-12 en móvil, py-20 en PC (antes era 20 y 32)
        <section className="py-12 md:py-20 bg-[#fdfbf9] border-t border-[#e6dad1]/30 relative overflow-hidden">
            
            {/* Ruido sutil de fondo para textura editorial */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply z-0"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                
                {/* Título de la Sección - MARGEN REDUCIDO: mb-10 md:mb-16 (antes era 16 y 24) */}
                <div className="text-center mb-10 md:mb-16">
                    <ScrollReveal direction="up" delay={0.1}>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#864d2d]">
                            La Experiencia
                        </span>
                        <h2 className="font-serif text-3xl md:text-5xl text-[#3f2f2f] mt-4 tracking-tight">
                            El Compromiso <span className="italic font-light text-[#864d2d]">Élara</span>
                        </h2>
                    </ScrollReveal>
                </div>

                {/* Grid de Beneficios */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-y-0 lg:divide-x lg:divide-[#e6dad1]/50">
                    {benefits.map((b, i) => (
                        <ScrollReveal key={i} delay={0.2 + (i * 0.1)} direction="up">
                            <div className="flex flex-col items-center text-center px-4 md:px-8 group cursor-default">
                                
                                {/* Contenedor del Ícono */}
                                <div className="mb-5 md:mb-6 relative flex items-center justify-center w-20 h-20">
                                    <div className="absolute inset-0 bg-[#e6dad1]/20 rounded-full scale-100 group-hover:scale-110 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 border border-[#864d2d]/30 rounded-full group-hover:border-[#864d2d] group-hover:rotate-45 transition-all duration-700 ease-out" />
                                    <b.icon 
                                        className="w-7 h-7 text-[#3f2f2f] group-hover:text-[#864d2d] transition-colors duration-500 relative z-10" 
                                        strokeWidth={1.5} 
                                    />
                                </div>
                                
                                {/* Título y Descripción */}
                                <h3 className="text-lg md:text-xl font-serif text-[#3f2f2f] mb-2 group-hover:text-[#864d2d] transition-colors duration-500">
                                    {b.title}
                                </h3>
                                <p className="text-sm text-[#3f2f2f]/60 font-light leading-relaxed max-w-[250px]">
                                    {b.description}
                                </p>

                                {/* Línea decorativa inferior */}
                                <div className="w-0 h-[1px] bg-[#864d2d]/50 mt-5 group-hover:w-12 transition-all duration-500 ease-out" />
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}