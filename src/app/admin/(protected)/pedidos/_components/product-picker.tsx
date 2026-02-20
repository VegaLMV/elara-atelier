"use client";

import { useState } from "react";
import { Search, Plus, Package, X, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/precios";

interface Variante {
    id: string;
    talla: string;
    color: string;
    hex: string | null;
    stock: number;
}

interface Producto {
    id: string;
    nombre: string;
    precioBase: number;
    imagen: string | null;
    descuento?: {
        tipo: string;
        valor: number;
    } | null;
    variantes: Variante[];
}

interface Props {
    onAdd: (item: { varianteId: string; cantidad: number; precioUnitario: number; titulo: string; detalle: string; imagen: string | null; stockMax: number }) => void;
    productos: Producto[];
}

export default function ProductPicker({ onAdd, productos }: Props) {
    const [query, setQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

    const filtered = productos.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20); // More items for the grid

    function getColorStyle(hex: string | null) {
        if (!hex) return { backgroundColor: '#eee' };
        const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
        return { backgroundColor: codes[0] || '#eee' };
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Buscar producto..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {filtered.map(prod => (
                    <div
                        key={prod.id}
                        onClick={() => setSelectedProduct(prod)}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                    >
                        <div className="aspect-square bg-gray-100 relative">
                            {prod.imagen ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={prod.imagen} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold">SIN FOTO</div>
                            )}
                            {prod.descuento && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    {prod.descuento.tipo === 'PORCENTAJE' ? `-${prod.descuento.valor}%` : `-S/${prod.descuento.valor}`}
                                </span>
                            )}
                        </div>
                        <div className="p-3">
                            <p className="font-bold text-gray-900 text-[11px] leading-tight line-clamp-2 mb-1 h-8">{prod.nombre}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <p className="text-slate-900 font-black text-xs">{formatMoney(prod.precioBase)}</p>
                                <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500">
                                    {prod.variantes.reduce((acc, v) => acc + v.stock, 0)} unid.
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Variantes Premium */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        {/* HERO HEADER */}
                        <div className="relative h-48 shrink-0">
                            {selectedProduct.imagen ? (
                                <img src={selectedProduct.imagen} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-xs font-bold">SIN FOTO</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-6 left-6 right-6">
                                <h4 className="text-2xl font-black text-white leading-tight mb-1">{selectedProduct.nombre}</h4>
                                <p className="text-slate-200 text-sm font-medium">Selecciona una variante</p>
                            </div>
                        </div>

                        {/* LISTA DE VARIANTES */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar max-h-[60vh]">
                            {selectedProduct.variantes.map(v => (
                                <button
                                    key={v.id}
                                    disabled={v.stock <= 0}
                                    onClick={() => {
                                        onAdd({
                                            varianteId: v.id,
                                            cantidad: 1,
                                            precioUnitario: selectedProduct.precioBase,
                                            titulo: selectedProduct.nombre,
                                            detalle: `${v.color} / ${v.talla}`,
                                            imagen: selectedProduct.imagen,
                                            stockMax: v.stock
                                        });
                                        setSelectedProduct(null);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-900 hover:shadow-md transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed group text-left"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-slate-50 shadow-sm shrink-0" style={getColorStyle(v.hex)}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">{v.color} / {v.talla}</p>
                                        <p className="text-[10px] font-bold text-slate-500">Stock: {v.stock}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{formatMoney(selectedProduct.precioBase)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
