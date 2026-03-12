"use client";

import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

type PromoBannerProps = {
    title?: string;
    subtitle?: string;
    badge?: string;
    imageUrl?: string;
};

export default function NewsletterSection({
    title = "Primer Envío de Cortesía",
    subtitle = "Su primer encuentro con Élara merece ser impecable. Permítanos extenderle esta cortesía en su primera selección, a cualquier destino del país.",
    badge = "Invitación Exclusiva",
    imageUrl = "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1886&auto=format&fit=crop",
}: PromoBannerProps) {
    return (
        <section className="py-32 md:py-48 bg-[#fdfbf9] relative overflow-hidden flex items-center min-h-[80vh]">
            
            {/* ====================================================
                ELEMENTOS VISUALES FLOTANTES Y FONDOS
            ==================================================== */}
            
            {/* Ruido Sutil de Fondo */}
            <div 
                className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply z-0"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />

            {/* Texto Fantasma "ÉLARA ATELIER" (Ocupando todo el fondo) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex flex-col items-center justify-center pointer-events-none select-none z-0 overflow-hidden leading-none">
                <h2 className="text-[20vw] md:text-[18vw] font-serif uppercase tracking-tighter text-[#3f2f2f] opacity-[0.03] whitespace-nowrap">
                    Élara
                </h2>
                <h2 className="text-[20vw] md:text-[18vw] font-serif italic text-[#864d2d] opacity-[0.02] whitespace-nowrap -mt-[5vw]">
                    Atelier
                </h2>
            </div>

            {/* Círculo Esmerilado Flotante (Arriba Izquierda) */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#e6dad1]/30 backdrop-blur-3xl pointer-events-none z-0" />
            
            {/* Círculo de Luz (Abajo Derecha) */}
            <div className="absolute -bottom-48 -right-20 w-[600px] h-[600px] rounded-full bg-[#864d2d]/5 blur-[80px] pointer-events-none z-0" />

            {/* ====================================================
                CONTENIDO PRINCIPAL
            ==================================================== */}
            <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full">
                <div className={`mx-auto ${imageUrl ? 'flex flex-col-reverse lg:grid lg:grid-cols-12 gap-16 lg:gap-10 items-center' : 'max-w-3xl text-center'}`}>
                    
                    {/* --- COLUMNA DE TEXTO (Superpuesta parcialmente) --- */}
                    <div className={`lg:col-span-5 relative z-20 ${!imageUrl && 'flex flex-col items-center mx-auto'}`}>
                        <ScrollReveal direction="up" delay={0.2}>
                            
                            {/* Tarjeta de Contenido con efecto cristal */}
                            <div className="bg-white/80 backdrop-blur-md p-10 md:p-14 lg:p-16 shadow-2xl rounded-sm border border-white/50 relative overflow-hidden group">
                                {/* Línea decorativa top */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#864d2d]/30 to-transparent" />

                                {/* Etiqueta Superior */}
                                <div className={`flex items-center gap-4 mb-8 ${!imageUrl && 'justify-center'}`}>
                                    <div className="w-8 h-[1px] bg-[#864d2d]" />
                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d]">
                                        {badge}
                                    </span>
                                </div>

                                {/* Títulos */}
                                <div className="space-y-4 mb-8">
                                    <h3 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">
                                        Primer Envío de <span className="italic font-light">Cortesía</span>
                                    </h3>
                                </div>

                                {/* Párrafo descriptivo */}
                                <p className={`text-sm md:text-base text-[#3f2f2f]/60 leading-relaxed font-light mb-10 ${!imageUrl ? 'max-w-2xl' : 'max-w-md'}`}>
                                    {subtitle}
                                </p>
                                
                                {/* Detalles de Cobertura */}
                                <div className={`flex flex-col gap-4 border-t border-[#e6dad1]/50 pt-8 ${!imageUrl && 'items-center'}`}>
                                    <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase text-[#3f2f2f]">
                                        <MapPin className="w-4 h-4 text-[#864d2d]" strokeWidth={1.5} />
                                        <span className="font-bold">Cobertura Nacional — Perú</span>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* --- COLUMNA DE IMAGEN (Asimétrica) --- */}
                    {imageUrl && (
                        <div className="lg:col-span-7 relative z-10 w-full lg:-ml-12">
                            <ScrollReveal direction="left" delay={0.4}>
                                <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[16/11] group">
                                    
                                    {/* Marco Geométrico Desfasado (Atrás) */}
                                    <div className="absolute -inset-y-8 -inset-x-8 md:-inset-y-12 md:-inset-x-12 border border-[#3f2f2f]/10 z-0 hidden lg:block" />
                                    
                                    {/* Contenedor Principal de la Imagen */}
                                    <div className="relative w-full h-full overflow-hidden bg-[#e6dad1]/20">
                                        <Image
                                            src={imageUrl}
                                            alt="Cortesía Élara"
                                            fill
                                            className="object-cover object-center grayscale-[0.3] group-hover:grayscale-0 scale-[1.02] group-hover:scale-105 transition-all duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)]"
                                            sizes="(max-width: 1024px) 100vw, 60vw"
                                        />
                                        
                                        {/* Gradiente sutil para oscurecer y dar profundidad */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
                                    </div>

                                    {/* Sello Flotante sobre la imagen (Opción 1: Valor Local) */}
                                      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-20 bg-[#fdfbf9]/95 backdrop-blur-md px-6 py-4 flex flex-col items-center justify-center border border-[#e6dad1] shadow-2xl">
                                          
                                          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] text-[#3f2f2f]/60">
                                              Envío Nacional
                                          </span>
                                      </div>
                                </div>
                            </ScrollReveal>
                        </div>
                    )}

                </div>
            </div>
        </section>
    );
}