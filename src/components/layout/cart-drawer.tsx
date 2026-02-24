"use client";

import { useCartStore } from "@/store/cart-store";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { formatMoney } from "@/lib/precios";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function CartDrawer() {
    const {
        items,
        isOpen,
        closeCart,
        updateQuantity,
        removeItem,
        getTotal
    } = useCartStore();

    const [mounted, setMounted] = useState(false);

    // Evitar problemas de hidratación con Zustand persist
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleWhatsAppCheckout = () => {
        const total = getTotal();
        let message = "✨ *¡Hola Élara Atelier!* 🌸\n\nQuiero hacer el siguiente pedido desde la tienda:\n\n";

        items.forEach((item) => {
            message += `👗 *Producto:* ${item.nombre}\n`;
            if (item.talla) message += `📏 *Talla:* ${item.talla}\n`;
            if (item.color) message += `🎨 *Color:* ${item.color}\n`;
            message += `💰 *Precio:* ${formatMoney(item.precio)}\n`;
            if (item.cantidad > 1) message += `🔢 *Cantidad:* ${item.cantidad}\n`;
            if (item.imagen) message += `🖼️ *Referencia:* ${item.imagen}\n`;
            message += `\n`;
        });

        message += `*Total a pagar: ${formatMoney(total)}*`;

        const encodedMessage = encodeURIComponent(message);
        const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO;
        const whatsappUrl = `https://wa.me/${numero}?text=${encodedMessage}`;

        window.open(whatsappUrl, "_blank");
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-500",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={closeCart}
            />

            {/* Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 right-0 z-[70] w-full md:w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white text-[var(--brand-primary)]">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-[#864d2d]" />
                        <h2 className="text-xl font-black uppercase tracking-widest text-[#3f2f2f]" style={{ fontFamily: "var(--brand-font-heading)" }}>
                            Tu Carrito
                        </h2>
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-[#e6dad1]/30 rounded-full transition-colors text-[#3f2f2f]/60 hover:text-[#3f2f2f]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-[#fcfaf8] rounded-full flex items-center justify-center border border-[#e6dad1]">
                                <ShoppingBag className="w-10 h-10 text-[#e6dad1]" />
                            </div>
                            <p className="text-[#3f2f2f]/60 font-serif italic text-lg">Tu carrito está vacío</p>
                            <button
                                onClick={closeCart}
                                className="text-[10px] font-black uppercase tracking-widest text-[#864d2d] hover:text-[#3f2f2f] transition-colors hover:underline"
                            >
                                Continuar explorando
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.varianteId} className="flex gap-5 group pb-6 border-b border-[#e6dad1]/30 last:border-0 last:pb-0">
                                
                                {/* Imagen del Producto */}
                                <div className="relative w-24 h-[130px] bg-[#fcfaf8] rounded-sm overflow-hidden shrink-0 border border-[#e6dad1]/50">
                                    {item.imagen && item.imagen.trim() !== "" ? (
                                        <Image
                                            src={item.imagen}
                                            alt={item.nombre}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                                            Sin foto
                                        </div>
                                    )}
                                </div>

                                {/* Detalles y Controles */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-sm text-[#3f2f2f] uppercase tracking-wider leading-tight">
                                                {item.nombre}
                                            </h3>
                                            <button
                                                onClick={() => removeItem(item.varianteId)}
                                                className="text-[#3f2f2f]/30 hover:text-red-500 transition-colors p-1"
                                                title="Eliminar producto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {item.talla && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#fcfaf8] border border-[#e6dad1] px-2 py-1 rounded-sm text-[#3f2f2f]/70">
                                                    {item.talla}
                                                </span>
                                            )}
                                            {item.color && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#fcfaf8] border border-[#e6dad1] px-2 py-1 rounded-sm text-[#3f2f2f]/70">
                                                    {item.color}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONTROLES DE CANTIDAD (Corregidos visualmente) */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-3">
                                            {/* Etiqueta clara */}
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3f2f2f]/40">
                                                CANT:
                                            </span>
                                            
                                            {/* Selector oscuro y visible */}
                                            <div className="flex items-center border border-[#3f2f2f]/20 rounded-sm bg-white overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.varianteId, item.cantidad - 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-[#3f2f2f] hover:bg-[#fcfaf8] hover:text-[#864d2d] transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                
                                                <span className="w-8 text-center text-xs font-black text-[#3f2f2f]">
                                                    {item.cantidad}
                                                </span>
                                                
                                                <button
                                                    onClick={() => updateQuantity(item.varianteId, item.cantidad + 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-[#3f2f2f] hover:bg-[#fcfaf8] hover:text-[#864d2d] transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <span className="font-serif text-lg italic text-[#3f2f2f]">
                                            {formatMoney(item.precio * item.cantidad)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-[#e6dad1]/50 bg-white space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-black text-[#3f2f2f]/60">Subtotal</span>
                            <span className="text-3xl font-serif tracking-tight text-[#3f2f2f]">
                                {formatMoney(getTotal())}
                            </span>
                        </div>

                        <p className="text-[9px] text-[#3f2f2f]/40 text-center uppercase tracking-widest leading-relaxed">
                            Los costos de envío se calculan al finalizar el pedido.
                        </p>

                        <button
                            onClick={handleWhatsAppCheckout}
                            className="w-full bg-[#3f2f2f] text-white py-5 rounded-sm text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#864d2d] transition-all duration-300 shadow-xl shadow-[#3f2f2f]/10 flex items-center justify-center gap-3 group"
                        >
                            Finalizar Pedido
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}

const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);