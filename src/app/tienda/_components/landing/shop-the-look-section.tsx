"use client";

import Image from "next/image";
import ProductoCard from "../shared/producto-card";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface Props {
    title: string;
    subtitle?: string;
    description?: string | null;
    imageUrl?: string | null;
    products: any[];
    content?: any; 
}

export default function ShopTheLookSection({ title, subtitle, description, imageUrl, products, content }: Props) {
    if (!products || products.length === 0) return null;

    const activeDescription = content?.description || description;

    return (
        <section className="py-24 md:py-40 bg-[#fdfbf9] relative overflow-hidden border-t border-[#e6dad1]/40">
            
            {/* ====================================================
                ELEMENTOS DE FONDO (Texto Fantasma y Textura)
            ==================================================== */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full pointer-events-none select-none z-0 overflow-hidden">
                <span className="text-[22vw] font-serif uppercase tracking-widest text-[#3f2f2f] opacity-[0.02] whitespace-nowrap block text-center">
                    Lookbook
                </span>
            </div>

            {/* Ruido sutil de fondo para textura de papel */}
            <div 
                className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-multiply z-0"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
            />

            <div className="max-w-[1500px] mx-auto px-6 relative z-10">
                
                {/* --- CABECERA EDITORIAL --- */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20 md:mb-32">
                    <div className="max-w-3xl space-y-6">
                        {subtitle && (
                            <ScrollReveal direction="right" delay={0.1}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-[1px] bg-[#864d2d]" />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-[#864d2d]">
                                        {subtitle}
                                    </span>
                                </div>
                            </ScrollReveal>
                        )}
                        
                        <ScrollReveal direction="up" delay={0.2}>
                            <h2 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif text-[#3f2f2f] leading-[1] tracking-tight">
                                {title.split(' ').map((word, i, arr) => (
                                    <span key={i} className={i === arr.length - 1 ? "italic font-light text-[#864d2d]" : ""}>
                                        {word}{' '}
                                    </span>
                                ))}
                            </h2>
                        </ScrollReveal>
                    </div>

                    {activeDescription && (
                        <ScrollReveal direction="up" delay={0.3} className="lg:max-w-md lg:pb-4">
                            <p className="text-[#3f2f2f]/60 font-light leading-relaxed text-base border-l border-[#e6dad1] pl-6">
                                {activeDescription}
                            </p>
                        </ScrollReveal>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-start">
                    
                    {/* --- LADO IZQUIERDO: FOTO PRINCIPAL (Estilo Galería) --- */}
                    <ScrollReveal direction="left" delay={0.4} className="lg:col-span-5 w-full relative group">
                        
                        {/* Marco Decorativo Desfasado (Atrás) */}
                        <div className="absolute -inset-4 border border-[#3f2f2f]/10 z-0 transition-transform duration-[2s] group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none" />
                        
                        {/* Etiqueta Editorial Flotante */}
                        <div className="absolute top-10 -left-4 bg-[#3f2f2f] text-white text-[8px] font-black uppercase tracking-[0.4em] px-3 py-6 [writing-mode:vertical-rl] rotate-180 z-20 shadow-2xl">
                            Selection No. 01
                        </div>

                        <div className="relative aspect-[3/4] w-full shadow-2xl z-10 overflow-hidden bg-white p-2 md:p-3 border border-[#e6dad1]/50">
                            <div className="relative w-full h-full overflow-hidden bg-[#e6dad1]/10">
                                {imageUrl ? (
                                    <Image 
                                        src={imageUrl} 
                                        alt={title} 
                                        fill 
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                        className="object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[3s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#3f2f2f]/20 font-serif italic text-sm">
                                        <span>Capturando Estilo...</span>
                                    </div>
                                )}
                                {/* Overlay de luz sutil */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent opacity-40 pointer-events-none" />
                            </div>
                        </div>
                        
                        {/* Sello de Autenticidad (Firma de Marca) */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[#fdfbf9] border border-[#e6dad1] flex items-center justify-center z-20 shadow-xl hidden md:flex">
                             <span className="font-serif italic text-xs text-[#864d2d]">Élara Atelier</span>
                        </div>
                    </ScrollReveal>

                    {/* --- LADO DERECHO: LAS PRENDAS (Mosaico de Productos) --- */}
                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-16">
                            {products.map((p, idx) => (
                                <ScrollReveal 
                                    key={p.id} 
                                    direction="up" 
                                    delay={0.5 + (idx * 0.1)}
                                >
                                    <div className="group/card relative">
                                        {/* Número de orden editorial */}
                                        <span className="absolute -top-6 left-0 text-[10px] font-serif italic text-[#864d2d]">
                                            0{idx + 1}
                                        </span>
                                        <ProductoCard producto={p} />
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}