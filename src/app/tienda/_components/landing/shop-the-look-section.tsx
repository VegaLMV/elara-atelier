"use client";

import Image from "next/image";
import ProductoCard from "../shared/producto-card";

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
        <section className="py-20 md:py-32 bg-white border-t border-[#e6dad1]/30 overflow-hidden">
            <div className="max-w-[1500px] mx-auto px-6">
                
                {/* Cabecera Editorial */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 md:mb-24">
                    <div className="max-w-2xl space-y-4">
                        {subtitle && (
                            <span className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-[#864d2d] font-black">
                                <span className="w-8 h-[1px] bg-[#864d2d]"></span>
                                {subtitle}
                            </span>
                        )}
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] tracking-tight leading-[1.1]">
                            {title}
                        </h2>
                    </div>

                    {activeDescription && (
                        <div className="lg:max-w-md lg:pb-3">
                            <p className="text-[#3f2f2f]/60 font-light leading-relaxed text-sm md:text-base">
                                {activeDescription}
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-center">
                    
                    {/* Foto Principal */}
                    <div className="lg:col-span-5 relative aspect-[3/4] w-full bg-[#f0ebe6] rounded-sm overflow-hidden group">
                        {imageUrl ? (
                            <Image 
                                src={imageUrl} 
                                alt={title} 
                                fill 
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover transition-transform duration-[10s] ease-out group-hover:scale-105" 
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#3f2f2f]/30 font-serif italic text-sm">
                                <span>Foto de Outfit</span>
                                <span className="text-xs font-sans not-italic tracking-widest">(Cuerpo completo)</span>
                            </div>
                        )}
                    </div>

                    {/* Las Prendas (Grid) */}
                    <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-6">
                        {products.map(p => (
                            <div key={p.id}>
                                <ProductoCard producto={p} />
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}