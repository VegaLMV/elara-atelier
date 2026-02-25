"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
    title: string;
    subtitle?: string;
    description?: string | null;
    categorySlug?: string;
    ctaText?: string;
    ctaHref?: string;
    imageUrl?: string | null;
}

export default function CategorySpotlightSection({
    title,
    subtitle,
    description,
    categorySlug,
    ctaText,
    ctaHref,
    imageUrl
}: Props) {
    const finalHref = ctaHref || (categorySlug ? `/tienda/catalogo?categoria=${categorySlug}` : "/tienda/catalogo");

    return (
        <section className="py-20 md:py-32 bg-[#fcfaf8] border-t border-[#e6dad1]/30">
            <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-24 items-center">

                <div className="relative aspect-[4/5] w-full bg-[#f0ebe6] rounded-sm overflow-hidden group">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#3f2f2f]/30 font-serif italic text-sm">
                            Imagen Editorial
                        </div>
                    )}
                </div>

                <div className="space-y-8 md:pr-10">
                    <div className="space-y-4">
                        {subtitle && (
                            <span className="text-[10px] uppercase tracking-[0.4em] text-[#864d2d] font-black block">
                                {subtitle}
                            </span>
                        )}
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight">
                            {title}
                        </h2>
                    </div>

                    {description ? (
                        <p className="text-[#3f2f2f]/70 font-light leading-relaxed max-w-md text-sm md:text-base">
                            {description}
                        </p>
                    ) : (
                        <p className="text-[#3f2f2f]/70 font-light leading-relaxed max-w-md text-sm md:text-base">
                            Descubre una selección meticulosamente curada. Piezas diseñadas para realzar tu figura y acompañarte en tus momentos más memorables.
                        </p>
                    )}

                    <div className="pt-4">
                        <Link
                            href={finalHref}
                            className="group inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f] hover:text-[#864d2d] transition-colors"
                        >
                            <span className="border-b border-[#3f2f2f]/30 group-hover:border-[#864d2d] pb-1 transition-colors">
                                {ctaText || "Descubrir Colección"}
                            </span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}