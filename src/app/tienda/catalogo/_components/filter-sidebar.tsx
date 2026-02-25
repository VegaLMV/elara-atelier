"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, ArrowDownWideNarrow, DollarSign, RotateCcw, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ScrollReveal from "@/components/ui/scroll-reveal"; // Importamos el componente de animación

type Categoria = {
    id: string;
    nombre: string;
    slug: string;
};

export default function FilterSidebar({ categorias }: { categorias: Categoria[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentCat = searchParams.get("categoria");
    const currentOrden = searchParams.get("orden") || "recientes";
    const minPrice = searchParams.get("min") || "";
    const maxPrice = searchParams.get("max") || "";

    const [isOpenMobile, setIsOpenMobile] = useState(false);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        const queryString = params.toString();
        // Mantenemos el ancla para que no salte al inicio
        router.push(queryString ? `?${queryString}#catalogo-grid` : '/tienda/catalogo#catalogo-grid', { scroll: false });
        setIsOpenMobile(false);
    };

    const clearFilters = () => {
        router.push("/tienda/catalogo#catalogo-grid", { scroll: false });
        setIsOpenMobile(false);
    };

    // Contenido de los filtros con animaciones internas por bloques
    const FilterContent = () => (
        <div className="space-y-12">
            {/* Header Filtros */}
            <div className="hidden lg:flex items-center gap-3 pb-4 border-b border-[#e6dad1]/30">
                <SlidersHorizontal className="w-4 h-4 text-[#3f2f2f]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3f2f2f]">
                    Filtrar Colección
                </span>
            </div>

            {/* Ordenar - Animación Suave */}
            <ScrollReveal direction="up" delay={0.1}>
                <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-[#864d2d]/80 uppercase tracking-[0.2em] flex items-center gap-2">
                        <ArrowDownWideNarrow className="w-3 h-3" /> Ordenar Por
                    </h3>
                    <div className="relative">
                        <select
                            value={currentOrden}
                            onChange={(e) => updateFilter("orden", e.target.value)}
                            className="w-full bg-transparent border-b border-[#e6dad1] rounded-none px-0 py-2.5 text-sm text-[#3f2f2f] outline-none focus:border-[#864d2d] transition-colors appearance-none cursor-pointer font-medium"
                        >
                            <option value="recientes">Nuevas Adiciones</option>
                            <option value="precio_asc">Precio: Menor a Mayor</option>
                            <option value="precio_desc">Precio: Mayor a Menor</option>
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f2f2f]/40 pointer-events-none" />
                    </div>
                </div>
            </ScrollReveal>

            {/* Rango de Precio - Animación Suave */}
            <ScrollReveal direction="up" delay={0.2}>
                <div className="space-y-4">
                    <h3 className="text-[9px] font-black text-[#864d2d]/80 uppercase tracking-[0.2em] flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Rango de Precio
                    </h3>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            placeholder="Min"
                            defaultValue={minPrice}
                            onBlur={(e) => updateFilter("min", e.target.value)}
                            className="w-full bg-transparent border border-[#e6dad1] rounded-sm px-3 py-2.5 text-sm text-[#3f2f2f] outline-none focus:border-[#864d2d] transition-all placeholder:text-[#3f2f2f]/30"
                        />
                        <span className="text-[#e6dad1]">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            defaultValue={maxPrice}
                            onBlur={(e) => updateFilter("max", e.target.value)}
                            className="w-full bg-transparent border border-[#e6dad1] rounded-sm px-3 py-2.5 text-sm text-[#3f2f2f] outline-none focus:border-[#864d2d] transition-all placeholder:text-[#3f2f2f]/30"
                        />
                    </div>
                </div>
            </ScrollReveal>

            {/* Categorías - Animación Suave */}
            <ScrollReveal direction="up" delay={0.3}>
                <div className="space-y-5 pt-4 border-t border-[#e6dad1]/30">
                    <h3 className="text-[9px] font-black text-[#864d2d]/80 uppercase tracking-[0.2em]">
                        Siluetas
                    </h3>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => updateFilter("categoria", "")}
                            className={`text-left transition-all flex items-center gap-3 group
                                ${!currentCat
                                    ? 'text-[#3f2f2f] font-serif italic text-xl'
                                    : 'text-[#3f2f2f]/60 hover:text-[#864d2d] text-sm'
                                }`}
                        >
                            <span className={`h-[1px] transition-all duration-300 ${!currentCat ? 'w-4 bg-[#864d2d]' : 'w-0 bg-transparent group-hover:w-2 group-hover:bg-[#864d2d]/50'}`} />
                            Toda la Colección
                        </button>

                        {categorias.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => updateFilter("categoria", cat.slug)}
                                className={`text-left transition-all flex items-center gap-3 group
                                    ${currentCat === cat.slug
                                        ? 'text-[#3f2f2f] font-serif italic text-xl'
                                        : 'text-[#3f2f2f]/60 hover:text-[#864d2d] text-sm'
                                    }`}
                            >
                                <span className={`h-[1px] transition-all duration-300 ${currentCat === cat.slug ? 'w-4 bg-[#864d2d]' : 'w-0 bg-transparent group-hover:w-2 group-hover:bg-[#864d2d]/50'}`} />
                                {cat.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            </ScrollReveal>

            {/* Limpiar Filtros */}
            {(currentCat || currentOrden !== "recientes" || minPrice || maxPrice) && (
                <ScrollReveal direction="none" delay={0.4}>
                    <button
                        onClick={clearFilters}
                        className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#864d2d] hover:text-[#3f2f2f] transition-colors pt-6 border-t border-[#e6dad1]/30"
                    >
                        <RotateCcw className="w-3 h-3" /> Restaurar Filtros
                    </button>
                </ScrollReveal>
            )}
        </div>
    );

    return (
        <>
            {/* BOTÓN FLOTANTE EN MÓVIL (Sin cambios estructurales) */}
            <div className="lg:hidden mb-6 flex justify-between items-center bg-white p-4 border border-[#e6dad1]/50 rounded-sm sticky top-24 z-40 shadow-sm">
                <span className="text-xs font-serif italic text-[#3f2f2f]">
                    {currentCat ? categorias.find(c => c.slug === currentCat)?.nombre : "Opciones de Filtro"}
                </span>
                <button 
                    onClick={() => setIsOpenMobile(true)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f] bg-[#fcfaf8] px-4 py-2 border border-[#e6dad1] rounded-sm"
                >
                    <SlidersHorizontal className="w-3 h-3" /> Filtrar
                </button>
            </div>

            {/* DESKTOP SIDEBAR - Mantiene el ancho y el comportamiento sticky original */}
            <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-32">
                    <FilterContent />
                </div>
            </aside>

            {/* MOBILE DRAWER (Layout de sistema intacto) */}
            <div 
                className={cn(
                    "fixed inset-0 bg-[#3f2f2f]/40 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300",
                    isOpenMobile ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpenMobile(false)}
            />
            
            <div 
                className={cn(
                    "fixed bottom-0 left-0 right-0 h-[85vh] bg-[#fcfaf8] z-[110] lg:hidden rounded-t-3xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col",
                    isOpenMobile ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="flex items-center justify-between p-6 border-b border-[#e6dad1]/50">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3f2f2f]">
                        Opciones de Colección
                    </span>
                    <button onClick={() => setIsOpenMobile(false)} className="p-2 bg-white rounded-full border border-[#e6dad1]">
                        <X className="w-4 h-4 text-[#3f2f2f]" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <FilterContent />
                </div>
            </div>
        </>
    );
}