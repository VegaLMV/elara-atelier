"use client";

import Image from "next/image";
import ProductoCard from "../shared/producto-card";

interface Props {
    title: string;
    subtitle?: string;
    imageUrl?: string | null;
    products: any[];
}

export default function ShopTheLookSection({ title, subtitle, imageUrl, products }: Props) {
    if (!products || products.length === 0) return null;

    return (
        <section className="py-20 md:py-32 bg-white border-t border-[#e6dad1]/30">
            <div className="max-w-[1500px] mx-auto px-6">
                
                {/* Cabecera */}
                <div className="text-center mb-16 md:mb-20 space-y-4">
                    {subtitle && (
                        <span className="text-[10px] uppercase tracking-[0.4em] text-[#864d2d] font-black">
                            {subtitle}
                        </span>
                    )}
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#3f2f2f] tracking-tight">
                        {title}
                    </h2>
                </div>

                <div className="grid lg:grid-cols-12 gap-10 md:gap-16 items-center">
                    
                    {/* Foto Principal (La Modelo) */}
                    <div className="lg:col-span-5 relative aspect-[3/4] w-full bg-[#f0ebe6] rounded-sm overflow-hidden">
                        {imageUrl ? (
                            <Image 
                                src={imageUrl} 
                                alt={title} 
                                fill 
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#3f2f2f]/30 font-serif italic text-sm">
                                Foto de Outfit (Cuerpo completo)
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