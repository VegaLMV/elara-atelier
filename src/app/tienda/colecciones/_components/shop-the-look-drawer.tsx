"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ShoppingBag, AlertCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/precios";
import { useCartStore } from "@/store/cart-store";

export interface Variante {
    id: string;
    talla: { nombre: string } | null;
    color: { nombre: string, hex: string | null } | null;
    stockActual: number;
}

export interface Producto {
    id: string;
    nombre: string;
    slug: string;
    precioOriginal: number;
    precioFinal: number;
    imagenes: string[];
    imagenesColor: { colorNombre: string; url: string }[];
    variantes: Variante[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lookTitle: string;
    productos: Producto[];
}

export default function ShopTheLookDrawer({ isOpen, onClose, lookTitle, productos }: Props) {
    const { addItem, openCart } = useCartStore();

    const [selecciones, setSelecciones] = useState<Record<string, { talla: string | null, color: string | null }>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const inicial: Record<string, { talla: string | null, color: string | null }> = {};
            productos.forEach(p => {
                const primeraConStock = p.variantes.find(v => v.stockActual > 0);
                if (primeraConStock) {
                    inicial[p.id] = {
                        talla: primeraConStock.talla?.nombre || null,
                        color: primeraConStock.color?.nombre || null
                    };
                } else {
                    inicial[p.id] = { talla: null, color: null };
                }
            });
            setSelecciones(inicial);
            setError(null);
        }
    }, [isOpen, productos]);

    function getColorStyle(hex: string | null | undefined) {
        if (!hex) return { backgroundColor: '#f0ebe6' };
        const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
        if (codes.length <= 1) return { backgroundColor: codes[0] || '#f0ebe6' };
        const percentage = 100 / codes.length;
        const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
        return { background: `linear-gradient(135deg, ${stops})` };
    }

    const totalLook = useMemo(() => {
        return productos.reduce((acc, p) => {
            const sel = selecciones[p.id];
            const varianteValida = p.variantes.find(v => v.talla?.nombre === sel?.talla && v.color?.nombre === sel?.color && v.stockActual > 0);
            if (varianteValida) return acc + p.precioFinal;
            return acc;
        }, 0);
    }, [productos, selecciones]);

    const isLookAgotado = useMemo(() => {
        return totalLook === 0;
    }, [totalLook]);

    const handleAddFullLook = () => {
        if (isLookAgotado) {
             setError("Las opciones seleccionadas no se encuentran disponibles.");
             return;
        }

        let hayErrores = false;

        productos.forEach(p => {
            const totalStock = p.variantes.reduce((acc, v) => acc + v.stockActual, 0);
            if (totalStock === 0) return;

            const sel = selecciones[p.id];
            const variante = p.variantes.find(v => v.talla?.nombre === sel?.talla && v.color?.nombre === sel?.color && v.stockActual > 0);

            if (!variante) {
                hayErrores = true;
            }
        });

        if (hayErrores) {
            setError("Por favor, selecciona talla y color para todas las prendas disponibles.");
            return;
        }

        productos.forEach(p => {
            const sel = selecciones[p.id];
            const variante = p.variantes.find(v => v.talla?.nombre === sel?.talla && v.color?.nombre === sel?.color && v.stockActual > 0);
            if (!variante) return;

            const imagenParaCarrito = p.imagenesColor?.find(ic => ic.colorNombre === sel.color)?.url || p.imagenes[0] || "";

            addItem({
                productoId: p.id,
                varianteId: variante.id,
                nombre: p.nombre,
                precio: p.precioFinal,
                cantidad: 1,
                talla: variante.talla?.nombre || null,
                color: variante.color?.nombre || null,
                imagen: imagenParaCarrito,
            });
        });

        onClose();
        openCart();
    };

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 bg-[#3f2f2f]/60 backdrop-blur-sm z-[100] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* FIX CLAVE: Se maneja pointer-events-none estricto cuando está cerrado para no bloquear la pantalla */}
            <div
                className={cn(
                    "fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6 transition-all duration-500",
                    isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                )}
            >
                <div
                    className="bg-[#fcfaf8] w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] md:rounded-sm shadow-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 md:px-8 py-5 md:py-6 border-b border-[#e6dad1]/50 flex items-center justify-between bg-white relative shrink-0">
                        <div className="text-center w-full space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#864d2d]">Personaliza tu Look</span>
                            <h2 className="text-2xl md:text-3xl font-serif text-[#3f2f2f] italic tracking-tight">{lookTitle}</h2>
                        </div>
                        <button onClick={onClose} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-[#e6dad1]/30 rounded-full transition-colors text-[#3f2f2f]/60 hover:text-[#3f2f2f]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenido (Lista de productos) */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-8 hide-scrollbar bg-[#fcfaf8]/50">
                        {productos.map((producto) => {
                            const totalStock = producto.variantes.reduce((acc, v) => acc + v.stockActual, 0);
                            const sel = selecciones[producto.id] || { talla: null, color: null };

                            const activeImage = producto.imagenesColor?.find(ic => ic.colorNombre === sel.color)?.url || producto.imagenes[0];

                            const tallasUnicas = Array.from(new Set(producto.variantes.map(v => v.talla?.nombre).filter((t): t is string => !!t)));
                            const coloresDisponibles = producto.variantes
                                .filter(v => !sel.talla || v.talla?.nombre === sel.talla)
                                .map(v => v.color)
                                .filter((color, index, self): color is NonNullable<typeof color> =>
                                    !!color && index === self.findIndex((c) => c?.nombre === color.nombre)
                                );

                            return (
                                <div key={producto.id} className="flex flex-row gap-4 md:gap-8 bg-white p-4 md:p-6 rounded-sm border border-[#e6dad1]/40 shadow-sm items-start">
                                    <div className="w-20 md:w-40 shrink-0 aspect-[3/4] relative bg-[#f0ebe6] rounded-sm overflow-hidden transition-opacity duration-300">
                                        {activeImage && (
                                            <Image src={activeImage} alt={producto.nombre} fill className="object-cover" sizes="(max-width: 768px) 80px, 160px" />
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="mb-4">
                                            <h3 className="text-[11px] md:text-sm font-bold text-[#3f2f2f] uppercase tracking-widest leading-snug truncate">
                                                {producto.nombre}
                                            </h3>
                                            <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2">
                                                <span className="text-xs md:text-base font-medium text-[#864d2d]">
                                                    {formatMoney(producto.precioFinal)}
                                                </span>
                                                {producto.precioFinal < producto.precioOriginal && (
                                                    <span className="text-[10px] md:text-xs text-[#3f2f2f]/40 line-through">
                                                        {formatMoney(producto.precioOriginal)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {totalStock === 0 ? (
                                            <div className="inline-flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-2 rounded-sm border border-red-100 w-fit">
                                                <AlertCircle className="w-3 h-3 md:w-4 md:h-4" /> Agotado
                                            </div>
                                        ) : (
                                            <div className="space-y-4 md:space-y-6">
                                                {tallasUnicas.length > 0 && (
                                                    <div className="space-y-2 md:space-y-3">
                                                        <span className="text-[9px] md:text-[10px] font-bold text-[#3f2f2f] uppercase tracking-[0.2em]">Talla</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {tallasUnicas.map(t => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setSelecciones(prev => ({
                                                                        ...prev,
                                                                        [producto.id]: { talla: t, color: prev[producto.id]?.color || null }
                                                                    }))}
                                                                    className={cn(
                                                                        "h-8 md:h-10 min-w-[2.5rem] md:min-w-[3rem] px-2 md:px-3 text-[9px] md:text-[10px] font-medium uppercase tracking-wider transition-all border rounded-sm",
                                                                        sel.talla === t
                                                                            ? "bg-[#3f2f2f] border-[#3f2f2f] text-white shadow-sm"
                                                                            : "bg-white border-[#e6dad1] text-[#3f2f2f] hover:border-[#864d2d]"
                                                                    )}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {coloresDisponibles.length > 0 && (
                                                    <div className="space-y-2 md:space-y-3">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[9px] md:text-[10px] font-bold text-[#3f2f2f] uppercase tracking-[0.2em]">Color:</span>
                                                            <span className="text-[10px] md:text-[11px] text-[#3f2f2f]/60 font-serif italic truncate max-w-[120px] md:max-w-none">{sel.color || "Selecciona"}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 md:gap-3">
                                                            {coloresDisponibles.map(c => {
                                                                if (!c) return null;
                                                                const isSelected = sel.color === c.nombre;
                                                                return (
                                                                    <button
                                                                        key={c.nombre}
                                                                        onClick={() => setSelecciones(prev => ({
                                                                            ...prev,
                                                                            [producto.id]: { talla: prev[producto.id]?.talla || null, color: c.nombre }
                                                                        }))}
                                                                        className={cn(
                                                                            "w-6 h-6 md:w-8 md:h-8 rounded-full border p-[2px] transition-all flex items-center justify-center",
                                                                            isSelected ? "border-[#864d2d] scale-110" : "border-transparent hover:scale-105 hover:border-[#e6dad1]"
                                                                        )}
                                                                        title={c.nombre}
                                                                    >
                                                                        <span className="w-full h-full rounded-full shadow-sm border border-black/5" style={getColorStyle(c.hex)} />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer del Modal */}
                    <div className="px-6 md:px-8 py-5 md:py-6 border-t border-[#e6dad1]/50 bg-white shrink-0 pb-safe">
                        {error && (
                            <div className="mb-3 md:mb-4 text-[9px] md:text-[10px] font-bold text-red-500 bg-red-50 p-2 md:p-3 rounded-sm border border-red-100 flex items-center justify-center gap-2 text-center">
                                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5 md:space-y-1">
                                <span className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#3f2f2f]/50">Subtotal</span>
                                <span className="hidden md:block text-[9px] text-[#3f2f2f]/40 uppercase tracking-widest">Los costos de envio son adicionales</span>
                            </div>
                            <span className="block text-2xl md:text-4xl font-serif text-[#3f2f2f] tracking-tight leading-none">
                                {formatMoney(totalLook)}
                            </span>
                        </div>

                        <button
                            onClick={handleAddFullLook}
                            className={cn(
                                "mt-4 md:mt-6 w-full py-4 md:py-5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 flex items-center justify-center gap-3 rounded-sm shadow-xl",
                                isLookAgotado
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                                    : "bg-[#3f2f2f] text-white hover:bg-[#864d2d] active:scale-[0.98] shadow-[#3f2f2f]/10"
                            )}
                        >
                            {isLookAgotado ? "No Disponible" : "Añadir Look a la bolsa"}
                            {!isLookAgotado && <ShoppingBag className="w-3 h-3 md:w-4 md:h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
            `}} />
        </>
    );
}