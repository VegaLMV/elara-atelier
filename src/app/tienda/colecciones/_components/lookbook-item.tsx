"use client";

import Image from "next/image";
import { Plus, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/precios";
import { Producto } from "./shop-the-look-drawer";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface Props {
    index: number;
    title: string;
    subtitle?: string;
    description?: string | null;
    imageUrl?: string | null;
    products: Producto[];
    onOpenDrawer: () => void;
}

export default function LookbookItem({ index, title, subtitle, description, imageUrl, products, onOpenDrawer }: Props) {
    const layoutType = index % 5;

    // Componente de Título con Itálica Dinámica (Look Editorial)
    const EditorialTitle = ({ text, isDark = false }: { text: string; isDark?: boolean }) => {
        const words = text.split(' ');
        return (
            <h2 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight leading-[1.1] ${isDark ? 'text-white' : 'text-[#3f2f2f]'}`}>
                {words.map((word, i) => (
                    <span key={i} className={i === words.length - 1 ? "italic font-light opacity-80" : ""}>
                        {word}{' '}
                    </span>
                ))}
            </h2>
        );
    };

    const ProductMiniGrid = ({ isDarkBg = false }: { isDarkBg?: boolean }) => (
        <div className={`pt-8 md:pt-10 w-full border-t relative z-10 ${isDarkBg ? 'border-white/10' : 'border-[#e6dad1]/60'}`}>
            <div className="flex items-center justify-between mb-6">
                <p className={`text-[9px] uppercase tracking-[0.4em] font-black ${isDarkBg ? 'text-white/40' : 'text-[#864d2d]/60'}`}>
                    Selection No. 0{index + 1} — {products.length} Items
                </p>
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory hide-scroll">
                {products.map((p, idx) => (
                    <ScrollReveal key={p.id} direction="up" delay={0.3 + (idx * 0.1)}>
                        <button
                            type="button"
                            onClick={onOpenDrawer}
                            className="w-24 sm:w-28 shrink-0 space-y-3 group cursor-pointer text-left focus:outline-none snap-start active:scale-95 transition-all touch-manipulation"
                        >
                            <div className={`aspect-[3/4] relative overflow-hidden shadow-md p-1 bg-white border ${isDarkBg ? 'border-white/10' : 'border-[#e6dad1]/40'}`}>
                                {p.imagenes[0] && (
                                    <Image 
                                        src={p.imagenes[0]} 
                                        alt={p.nombre} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out grayscale-[0.3] group-hover:grayscale-0" 
                                        sizes="120px" 
                                    />
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className={`text-[8px] font-black uppercase tracking-widest truncate ${isDarkBg ? 'text-white/80' : 'text-[#3f2f2f]'}`}>{p.nombre}</p>
                                <p className={`text-[10px] font-serif italic ${isDarkBg ? 'text-[#e6dad1]' : 'text-[#864d2d]'}`}>{formatMoney(p.precioFinal)}</p>
                            </div>
                        </button>
                    </ScrollReveal>
                ))}
            </div>
        </div>
    );

    const ActionButton = ({ isDarkBg = false }: { isDarkBg?: boolean }) => (
        <ScrollReveal direction="up" delay={0.6}>
            <div className="relative z-[50] mt-8 w-full lg:w-auto">
                <button
                    type="button"
                    onClick={onOpenDrawer}
                    className={`group relative w-full lg:w-auto px-10 py-5 text-[9px] font-black uppercase tracking-[0.4em] transition-all overflow-hidden flex items-center justify-center gap-4
                        ${isDarkBg 
                            ? 'bg-white text-[#3f2f2f] hover:bg-[#e6dad1]' 
                            : 'bg-[#3f2f2f] text-white hover:bg-[#864d2d]'}`}
                >
                    <span className="relative z-10">Shop the Look</span>
                    <Plus className={`w-3.5 h-3.5 relative z-10 transition-transform duration-500 group-hover:rotate-90 ${isDarkBg ? 'text-[#3f2f2f]' : 'text-white'}`} />
                </button>
            </div>
        </ScrollReveal>
    );

    // ==========================================
    // LAYOUT 0: Clásico Editorial (Imagen Izq)
    // ==========================================
    if (layoutType === 0) {
        return (
            <section className="px-6 flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-24 items-center max-w-[1600px] mx-auto relative">
                <div className="absolute top-0 right-0 -translate-y-1/2 opacity-[0.02] text-[15vw] font-serif uppercase tracking-widest hidden lg:block select-none pointer-events-none">
                    Atelier
                </div>
                <ScrollReveal direction="left" delay={0.1} className="lg:col-span-7 w-full relative group">
                    <div className="absolute -inset-4 border border-[#864d2d]/20 transition-transform duration-1000 group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none" />
                    <div className="relative aspect-[3/4] w-full bg-[#fdfbf9] shadow-2xl overflow-hidden p-2 md:p-4 bg-white">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill priority={index === 0} className="object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[3s] ease-out group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 60vw" />
                        )}
                    </div>
                </ScrollReveal>
                <div className="lg:col-span-5 flex flex-col justify-center w-full z-10">
                    <ScrollReveal direction="up" delay={0.2}>
                        <div className="space-y-6 mb-12">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d] flex items-center gap-3">
                                <div className="w-8 h-[1px] bg-[#864d2d]" /> {subtitle || "Élara Selection"}
                            </span>
                            <EditorialTitle text={title} />
                            {description && <p className="text-[#3f2f2f]/60 font-light leading-relaxed text-base border-l border-[#e6dad1] pl-6">{description}</p>}
                        </div>
                    </ScrollReveal>
                    <ProductMiniGrid />
                    <ActionButton />
                </div>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 1: Espejo (Imagen Der)
    // ==========================================
    if (layoutType === 1) {
        return (
            <section className="px-6 flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-24 items-center max-w-[1600px] mx-auto relative">
                <ScrollReveal direction="right" delay={0.1} className="lg:col-span-7 w-full order-1 lg:order-2 relative group">
                    <div className="absolute -inset-4 border border-[#864d2d]/20 transition-transform duration-1000 group-hover:-translate-x-2 group-hover:-translate-y-2 pointer-events-none" />
                    <div className="relative aspect-[3/4] w-full bg-[#fdfbf9] shadow-2xl overflow-hidden p-2 md:p-4 bg-white">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[3s] ease-out group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 60vw" />
                        )}
                    </div>
                </ScrollReveal>
                <div className="lg:col-span-5 flex flex-col justify-center w-full order-2 lg:order-1 z-10">
                    <ScrollReveal direction="up" delay={0.2}>
                        <div className="space-y-6 mb-12">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d] flex items-center gap-3">
                                <div className="w-8 h-[1px] bg-[#864d2d]" /> {subtitle || "Atemporal"}
                            </span>
                            <EditorialTitle text={title} />
                            {description && <p className="text-[#3f2f2f]/60 font-light leading-relaxed text-base border-l border-[#e6dad1] pl-6">{description}</p>}
                        </div>
                    </ScrollReveal>
                    <ProductMiniGrid />
                    <ActionButton />
                </div>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 2: Panorama (Caja Central)
    // ==========================================
    if (layoutType === 2) {
        return (
            <section className="px-6 max-w-[1400px] mx-auto">
                <ScrollReveal direction="up" delay={0.1}>
                    <div className="text-center space-y-6 mb-16">
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#864d2d]">{subtitle || "Curaduría"}</span>
                        <EditorialTitle text={title} />
                    </div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.3}>
                    <div className="relative w-full aspect-[16/10] md:aspect-[21/9] bg-white p-2 shadow-2xl mb-12">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover grayscale-[0.1] hover:grayscale-0 transition-all duration-[2s] ease-in-out" sizes="100vw" />
                        )}
                    </div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={0.4}>
                    <div className="bg-white/80 backdrop-blur-md border border-[#e6dad1]/60 p-8 md:p-16 flex flex-col lg:flex-row gap-12 items-center">
                        <div className="w-full lg:w-2/3">
                            <ProductMiniGrid />
                        </div>
                        <div className="w-full lg:w-1/3 flex lg:justify-end">
                            <ActionButton />
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 3: Superpuesto (Floating Card)
    // ==========================================
    if (layoutType === 3) {
        return (
            <section className="px-6 max-w-[1200px] mx-auto relative pt-12 md:pt-24">
                <ScrollReveal direction="left" delay={0.4} className="relative md:absolute md:top-0 md:left-0 md:z-30 w-full md:max-w-lg">
                    <div className="bg-white/90 backdrop-blur-xl p-10 md:p-16 shadow-2xl border border-white space-y-10">
                        <div className="space-y-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d]">{subtitle || "Signature"}</span>
                            <EditorialTitle text={title} />
                            {description && <p className="text-[#3f2f2f]/60 font-light leading-relaxed text-sm">{description}</p>}
                        </div>
                        <ProductMiniGrid />
                        <ActionButton />
                    </div>
                </ScrollReveal>
                <ScrollReveal direction="right" delay={0.1}>
                    <div className="relative w-full aspect-[3/4] md:aspect-[2/3] bg-white p-2 shadow-xl ml-auto md:w-[80%] z-10 group overflow-hidden">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-[4s] ease-out grayscale-[0.3] group-hover:grayscale-0" sizes="80vw" />
                        )}
                    </div>
                </ScrollReveal>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 4: Velvet Block (Fondo Oscuro)
    // ==========================================
    return (
        <section className="max-w-[1600px] mx-auto px-6 relative">
            <ScrollReveal direction="up" delay={0.1}>
                <div className="flex flex-col md:flex-row bg-[#1a1311] overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] relative">
                    {/* Noise Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-screen" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
                    
                    <div className="w-full md:w-1/2 relative aspect-[4/5] md:aspect-auto group overflow-hidden">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] ease-out grayscale-[0.4] group-hover:grayscale-0" sizes="50vw" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1311] via-transparent to-transparent hidden md:block" />
                    </div>

                    <div className="w-full md:w-1/2 p-10 sm:p-16 lg:p-24 flex flex-col justify-center relative z-20">
                        <div className="space-y-6 mb-12">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#864d2d]">{subtitle || "The Noir Edit"}</span>
                            <EditorialTitle text={title} isDark />
                            {description && <p className="text-white/60 font-light leading-relaxed text-base max-w-md">{description}</p>}
                        </div>
                        <ProductMiniGrid isDarkBg={true} />
                        <ActionButton isDarkBg={true} />
                    </div>
                </div>
            </ScrollReveal>
        </section>
    );
}