"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
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

    const ProductMiniGrid = ({ isDarkBg = false }: { isDarkBg?: boolean }) => (
        <div className={`pt-6 md:pt-8 w-full border-t relative z-10 ${isDarkBg ? 'border-white/20' : 'border-[#e6dad1]/40'}`}>
            <p className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold mb-3 sm:mb-4 ${isDarkBg ? 'text-white/60' : 'text-[#3f2f2f]/50'}`}>
                Piezas en este look ({products.length})
            </p>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar">
                {products.map((p, idx) => (
                    <ScrollReveal key={p.id} direction="up" delay={0.3 + (idx * 0.1)}>
                        <button
                            type="button"
                            onClick={onOpenDrawer}
                            className="w-20 sm:w-24 shrink-0 space-y-2 group cursor-pointer text-left focus:outline-none snap-start active:scale-95 transition-transform touch-manipulation"
                        >
                            <div className="aspect-[3/4] relative bg-[#f0ebe6] rounded-md sm:rounded-sm overflow-hidden shadow-sm border border-[#e6dad1]/30 pointer-events-none">
                                {p.imagenes[0] && (
                                    <Image 
                                        src={p.imagenes[0]} 
                                        alt={p.nombre} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                        sizes="(max-width: 768px) 80px, 96px" 
                                    />
                                )}
                            </div>
                            <div className="space-y-0.5 pointer-events-none">
                                <p className={`text-[9px] sm:text-[10px] font-bold uppercase truncate ${isDarkBg ? 'text-white' : 'text-[#3f2f2f]'}`}>{p.nombre}</p>
                                <p className={`text-[10px] font-medium ${isDarkBg ? 'text-orange-200' : 'text-[#864d2d]'}`}>{formatMoney(p.precioFinal)}</p>
                            </div>
                        </button>
                    </ScrollReveal>
                ))}
            </div>
        </div>
    );

    const ActionButton = ({ isDarkBg = false }: { isDarkBg?: boolean }) => (
        <ScrollReveal direction="up" delay={0.6}>
            <div className="relative z-[50] mt-4 pt-2 w-full lg:w-auto">
                <button
                    type="button"
                    onClick={onOpenDrawer}
                    className={`w-full lg:w-auto px-6 py-4 md:px-8 md:py-4 text-[10px] font-black uppercase tracking-[0.3em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 touch-manipulation rounded-xl lg:rounded-none shadow-xl lg:shadow-none cursor-pointer
                        ${isDarkBg 
                            ? 'bg-white text-[#3f2f2f] hover:bg-[#e6dad1] shadow-black/20' 
                            : 'bg-[#3f2f2f] text-white hover:bg-[#864d2d] shadow-[#3f2f2f]/10'}`}
                >
                    Añadir Look Completo <Plus className="w-4 h-4" />
                </button>
            </div>
        </ScrollReveal>
    );

    // ==========================================
    // LAYOUT 0: Imagen Izquierda, Texto Derecha
    // ==========================================
    if (layoutType === 0) {
        return (
            <section className="px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-20 items-center max-w-[1600px] mx-auto overflow-hidden">
                <ScrollReveal direction="left" delay={0.1} className="lg:col-span-7 w-full">
                    <div className="relative aspect-[4/5] md:aspect-[3/4] w-full bg-[#f0ebe6] rounded-2xl md:rounded-sm overflow-hidden group">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill priority={index === 0} className="object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" sizes="(max-width: 1024px) 100vw, 60vw" />
                        )}
                    </div>
                </ScrollReveal>
                <div className="lg:col-span-5 flex flex-col justify-center lg:pr-10 w-full relative z-20">
                    <ScrollReveal direction="up" delay={0.2}>
                        <div className="space-y-3 md:space-y-6 mb-8 lg:mb-10">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Look Exclusivo"}</span>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
                            {description && (
                                <p className="text-[#3f2f2f]/70 font-light leading-relaxed text-sm md:text-base max-w-md">
                                    {description}
                                </p>
                            )}
                        </div>
                    </ScrollReveal>
                    <ProductMiniGrid />
                    <ActionButton />
                </div>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 1: Texto Izquierda, Imagen Derecha
    // ==========================================
    if (layoutType === 1) {
        return (
            <section className="px-4 sm:px-6 flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-20 items-center max-w-[1600px] mx-auto overflow-hidden">
                <ScrollReveal direction="right" delay={0.1} className="lg:col-span-7 w-full order-1 lg:order-2">
                    <div className="relative aspect-[4/5] md:aspect-[3/4] w-full bg-[#f0ebe6] rounded-2xl md:rounded-sm overflow-hidden group">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" sizes="(max-width: 1024px) 100vw, 60vw" />
                        )}
                    </div>
                </ScrollReveal>
                <div className="lg:col-span-5 flex flex-col justify-center lg:pl-10 w-full order-2 lg:order-1 relative z-20">
                    <ScrollReveal direction="up" delay={0.2}>
                        <div className="space-y-3 md:space-y-6 mb-8 lg:mb-10">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Esencia Atemporal"}</span>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
                            {description && (
                                <p className="text-[#3f2f2f]/70 font-light leading-relaxed text-sm md:text-base max-w-md">
                                    {description}
                                </p>
                            )}
                        </div>
                    </ScrollReveal>
                    <ProductMiniGrid />
                    <ActionButton />
                </div>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 2: Banner Panorámico
    // ==========================================
    if (layoutType === 2) {
        return (
            <section className="px-4 sm:px-6 max-w-[1200px] mx-auto space-y-8 md:space-y-12">
                <ScrollReveal direction="up" delay={0.1}>
                    <div className="text-center space-y-3 md:space-y-6 max-w-2xl mx-auto">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Curaduría Premium"}</span>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
                        {description && (
                            <p className="text-[#3f2f2f]/70 font-light leading-relaxed text-sm md:text-base mt-4 italic px-4">
                                {description}
                            </p>
                        )}
                    </div>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.3}>
                    <div className="relative w-full aspect-[4/5] md:aspect-[16/9] bg-[#f0ebe6] rounded-2xl md:rounded-sm overflow-hidden group">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out" sizes="100vw" />
                        )}
                    </div>
                </ScrollReveal>

                <ScrollReveal direction="up" delay={0.4}>
                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 justify-between items-center bg-white p-6 md:p-12 border border-[#e6dad1]/40 rounded-2xl md:rounded-sm shadow-sm md:shadow-none relative z-20">
                        <div className="w-full lg:w-2/3">
                            <ProductMiniGrid />
                        </div>
                        <div className="w-full lg:w-1/3 flex lg:justify-end mt-4 lg:mt-0 relative z-[50]">
                            <ActionButton />
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 3: Editorial Apilado
    // ==========================================
    if (layoutType === 3) {
        return (
            <section className="px-4 sm:px-6 max-w-[1000px] mx-auto relative pt-10 md:pt-20">
                <ScrollReveal direction="left" delay={0.3} className="relative md:absolute md:top-0 md:left-0 md:z-30 w-full md:max-w-md">
                    <div className="bg-[#fcfaf8] md:bg-white/90 md:backdrop-blur-md md:p-10 lg:p-12 md:shadow-2xl rounded-2xl md:rounded-sm space-y-6 md:space-y-8 mb-8 md:mb-0 border border-transparent md:border-[#e6dad1]/50">
                        <div className="space-y-4">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Signature Series"}</span>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
                            {description && (
                                <p className="text-[#3f2f2f]/70 font-light leading-relaxed text-sm">
                                    {description}
                                </p>
                            )}
                        </div>
                        <ProductMiniGrid />
                        <ActionButton />
                    </div>
                </ScrollReveal>

                <ScrollReveal direction="right" delay={0.1}>
                    <div className="relative w-full aspect-[3/4] md:aspect-[2/3] bg-[#f0ebe6] rounded-2xl md:rounded-sm overflow-hidden group ml-auto md:w-[85%] z-10">
                        {imageUrl && (
                            <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out" sizes="(max-width: 1024px) 100vw, 80vw" />
                        )}
                    </div>
                </ScrollReveal>
            </section>
        );
    }

    // ==========================================
    // LAYOUT 4: Split Color Block
    // ==========================================
    return (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 overflow-hidden">
            <ScrollReveal direction="up" delay={0.1}>
                <div className="flex flex-col md:flex-row bg-[#3f2f2f] rounded-3xl md:rounded-sm overflow-hidden shadow-2xl relative z-20">
                    <div className="w-full md:w-1/2 relative aspect-[4/5] md:aspect-auto md:h-auto group overflow-hidden">
                        <ScrollReveal direction="none" delay={0.4}>
                            {imageUrl && (
                                <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out opacity-90" sizes="(max-width: 768px) 100vw, 50vw" />
                            )}
                        </ScrollReveal>
                        <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                    </div>

                    <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-20 flex flex-col justify-center relative z-20">
                        <ScrollReveal direction="up" delay={0.3}>
                            <div className="space-y-4 md:space-y-6 mb-10">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-white/50">{subtitle || "The Dark Edit"}</span>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white leading-[1.1] tracking-tight">{title}</h2>
                                {description && (
                                    <p className="text-white/70 font-light leading-relaxed text-sm md:text-base max-w-md">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </ScrollReveal>
                        
                        <ProductMiniGrid isDarkBg={true} />
                        <ActionButton isDarkBg={true} />
                    </div>
                </div>
            </ScrollReveal>
        </section>
    );
}