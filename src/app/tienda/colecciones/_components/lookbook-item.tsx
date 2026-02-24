"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/precios";
import { Producto } from "./shop-the-look-drawer";

interface Props {
    index: number;
    title: string;
    subtitle?: string;
    imageUrl?: string | null;
    products: Producto[];
    onOpenDrawer: () => void;
}

export default function LookbookItem({ index, title, subtitle, imageUrl, products, onOpenDrawer }: Props) {
    const layoutType = index % 3;

    // Mini-grid de productos para mostrar qué incluye el look
    const ProductMiniGrid = () => (
        <div className="pt-8 w-full border-t border-[#e6dad1]/40 relative z-0">
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#3f2f2f]/40 mb-4">
                Piezas en este look ({products.length})
            </p>
            {/* El scroll horizontal que causaba problemas de superposición */}
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mb-4">
                {products.map(p => (
                    <button 
                        key={p.id} 
                        type="button"
                        onClick={onOpenDrawer}
                        className="w-20 shrink-0 space-y-2 group cursor-pointer text-left focus:outline-none" 
                    >
                        <div className="aspect-[3/4] relative bg-[#f0ebe6] rounded-sm overflow-hidden">
                            {p.imagenes[0] && (
                                <Image src={p.imagenes[0]} alt={p.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="80px" />
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-[#3f2f2f] uppercase truncate">{p.nombre}</p>
                            <p className="text-[10px] text-[#864d2d] font-medium">{formatMoney(p.precioFinal)}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // Layout 0: Imagen Grande Izquierda, Textos Derecha
    if (layoutType === 0) {
        return (
            <section className="px-6 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                <div className="lg:col-span-7 relative aspect-[4/5] md:aspect-[3/4] w-full bg-[#f0ebe6] rounded-sm overflow-hidden group">
                    {imageUrl && (
                        <Image src={imageUrl} alt={title} fill priority={index === 0} className="object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" sizes="(max-width: 1024px) 100vw, 60vw" />
                    )}
                </div>
                <div className="lg:col-span-5 flex flex-col justify-center space-y-10 lg:pr-10">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Edition 2024"}</span>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
                    </div>

                    <ProductMiniGrid />

                    {/* Botón Mejorado para Móvil */}
                    <button 
                        type="button"
                        onClick={onOpenDrawer} 
                        className="relative z-10 w-full md:w-auto bg-[#3f2f2f] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#864d2d] active:bg-[#864d2d] active:scale-[0.98] transition-all flex items-center justify-center gap-3 touch-manipulation shadow-lg md:shadow-none"
                    >
                        Añadir Look Completo <Plus className="w-4 h-4" />
                    </button>
                </div>
            </section>
        );
    }

    // Layout 1: Textos Izquierda, Imagen Grande Derecha
    if (layoutType === 1) {
        return (
            <section className="px-6 grid flex-col-reverse lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                <div className="lg:col-span-5 flex flex-col justify-center space-y-10 lg:pl-10 order-2 lg:order-1">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Esencia Atemporal"}</span>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
                    </div>

                    <ProductMiniGrid />

                    {/* Botón Mejorado para Móvil */}
                    <button 
                        type="button"
                        onClick={onOpenDrawer} 
                        className="relative z-10 w-full md:w-auto bg-[#3f2f2f] text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#864d2d] active:bg-[#864d2d] active:scale-[0.98] transition-all flex items-center justify-center gap-3 touch-manipulation shadow-lg md:shadow-none"
                    >
                        Añadir Look Completo <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="lg:col-span-7 relative aspect-[4/5] md:aspect-[3/4] w-full bg-[#f0ebe6] rounded-sm overflow-hidden group order-1 lg:order-2">
                    {imageUrl && (
                        <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" sizes="(max-width: 1024px) 100vw, 60vw" />
                    )}
                </div>
            </section>
        );
    }

    // Layout 2: Banner Centralizado
    return (
        <section className="px-6 max-w-[1200px] mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#864d2d]">{subtitle || "Curaduría Premium"}</span>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">{title}</h2>
            </div>

            <div className="relative w-full aspect-[4/5] md:aspect-[16/9] bg-[#f0ebe6] rounded-sm overflow-hidden group">
                {imageUrl && (
                    <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out" sizes="100vw" />
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 justify-between items-center bg-white p-8 md:p-12 border border-[#e6dad1]/40 rounded-sm">
                <div className="w-full lg:w-2/3">
                    <ProductMiniGrid />
                </div>
                <div className="w-full lg:w-1/3 flex lg:justify-end mt-4 lg:mt-0">
                    {/* Botón Mejorado para Móvil */}
                    <button 
                        type="button"
                        onClick={onOpenDrawer} 
                        className="relative z-10 w-full md:w-auto bg-[#3f2f2f] text-white px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#864d2d] active:bg-[#864d2d] active:scale-[0.98] transition-all flex items-center justify-center gap-3 touch-manipulation shadow-lg md:shadow-none"
                    >
                        Añadir Look Completo <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}