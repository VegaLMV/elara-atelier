"use client";

import { useEffect, useRef, useState } from "react";
import ProductoCard from "../producto-card";
import { ArrowRight, ArrowLeft } from "lucide-react";

type Producto = {
    id: string;
    nombre: string;
    slug: string;
    categoria: string;
    imagenes: string[];
    precioOriginal: number;
    precioFinal: number;
    tieneDescuento: boolean;
    porcentaje: number | null;
    esNuevo: boolean;
    stock: number;
    destacado: boolean;
};

type Props = {
    productos: Producto[];
};

export default function SimilarProductsSection({ productos }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -400 : 400;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener("resize", handleScroll);
        return () => window.removeEventListener("resize", handleScroll);
    }, [productos]);

    if (productos.length === 0) return null;

    return (
        <section className="py-24 border-t border-slate-100 bg-slate-50/50">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Te podría interesar</span>
                        <h2 className="text-3xl font-serif text-slate-900">También te recomendamos</h2>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll("left")}
                            disabled={!showLeftArrow}
                            className={`p-3 rounded-full border border-slate-200 transition-all ${!showLeftArrow ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            disabled={!showRightArrow}
                            className={`p-3 rounded-full border border-slate-200 transition-all ${!showRightArrow ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-8 overflow-x-auto pb-12 -mx-6 px-6 no-scrollbar snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {productos.map((p, index) => (
                        <div
                            key={p.id}
                            className="min-w-[280px] md:min-w-[320px] snap-center animate-in fade-in slide-in-from-right-8 duration-700"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <ProductoCard producto={p} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
