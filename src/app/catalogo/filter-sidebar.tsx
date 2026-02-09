"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, ArrowDownWideNarrow, DollarSign, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

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

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page"); // Reset page when filtering
        router.push(`/catalogo?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push("/catalogo");
    };

    return (
        <aside className="lg:w-64 shrink-0 space-y-10">
            {/* Header Filtros Móvil (Solo decorativo en desktop, funcional si se expande) */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 lg:border-none">
                <SlidersHorizontal className="w-4 h-4 text-slate-900" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Filtros</span>
            </div>

            {/* Ordenar */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ArrowDownWideNarrow className="w-3 h-3" /> Ordenar Por
                </h3>
                <select
                    value={currentOrden}
                    onChange={(e) => updateFilter("orden", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all appearance-none cursor-pointer"
                >
                    <option value="recientes">Más Recientes</option>
                    <option value="precio_asc">Precio: Menor a Mayor</option>
                    <option value="precio_desc">Precio: Mayor a Menor</option>
                </select>
            </div>

            {/* Rango de Precio */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> Rango de Precio
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        defaultValue={minPrice}
                        onBlur={(e) => updateFilter("min", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300 transition-all font-mono"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        defaultValue={maxPrice}
                        onBlur={(e) => updateFilter("max", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-300 transition-all font-mono"
                    />
                </div>
            </div>

            {/* Categorías */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorías</h3>
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => updateFilter("categoria", "")}
                        className={`text-sm px-4 py-2 rounded-xl transition-all font-medium flex justify-between items-center group
                        ${!currentCat
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Ver Todo
                        {!currentCat && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>

                    {categorias.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => updateFilter("categoria", cat.slug)}
                            className={`text-sm px-4 py-2 rounded-xl transition-all font-medium flex justify-between items-center group
                            ${currentCat === cat.slug
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                    : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {cat.nombre}
                            {currentCat === cat.slug && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Limpiar Filtros */}
            {(currentCat || currentOrden !== "recientes" || minPrice || maxPrice) && (
                <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors pt-2"
                >
                    <RotateCcw className="w-3 h-3" /> Limpiar Filtros
                </button>
            )}

            {/* Banner Promocional Lateral (Ejemplo de 'Magic UI' bento item pequeño) */}
            <div className="hidden lg:block relative overflow-hidden rounded-2xl bg-indigo-600 text-white p-6 aspect-[3/4] flex flex-col justify-end">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/placeholder-promo.jpg" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt="" />

                <div className="relative z-20 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-200">Oferta Especial</p>
                    <p className="font-serif text-2xl leading-none">Envío Gratis</p>
                    <p className="text-xs text-indigo-100">En compras mayores a S/ 200</p>
                </div>
            </div>
        </aside>
    );
}
