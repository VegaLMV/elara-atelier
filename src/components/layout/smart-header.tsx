"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { ShoppingBag, Search, Menu, X, ChevronDown, ArrowRight } from "lucide-react";

function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
    const [prevOffset, setPrevOffset] = useState(0);
    const [isAtTop, setIsAtTop] = useState(true);

    useEffect(() => {
        const threshold = 10;
        const updateScrollDirection = () => {
            const scrollY = window.pageYOffset;

            if (Math.abs(scrollY - prevOffset) < threshold) {
                return;
            }

            const direction = scrollY > prevOffset ? "down" : "up";
            if (
                direction !== scrollDirection &&
                (scrollY > 50 || scrollY < prevOffset)
            ) {
                setScrollDirection(direction);
            }
            setPrevOffset(scrollY > 0 ? scrollY : 0);
            setIsAtTop(scrollY < 50);
        };

        window.addEventListener("scroll", updateScrollDirection);
        return () => window.removeEventListener("scroll", updateScrollDirection);
    }, [scrollDirection, prevOffset]);

    return { scrollDirection, isAtTop, offset: prevOffset };
}

interface SmartHeaderProps {
    settings: {
        storeName: string;
        logoUrl?: string | null;
    };
    navItems: { id: string; label: string; href: string }[];
    categorias: { id: string; nombre: string; slug: string }[];
}

export default function SmartHeader({
    settings,
    navItems,
    categorias,
}: SmartHeaderProps) {
    const { scrollDirection, isAtTop, offset } = useScrollDirection();
    const { openCart, getItemCount } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const itemCount = getItemCount();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    const isHidden = scrollDirection === "down" && offset > 100;

    return (
        <>
            <div className="h-10 bg-[#3f2f2f] text-[#fcfaf8] flex items-center justify-center z-[60] relative">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] px-4 text-center">
                    ENVÍO GRATIS EN TU PRIMERA COMPRA
                </p>
            </div>

            <header
                className={cn(
                    "fixed top-10 w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] bg-white/90 backdrop-blur-md border-b border-[#e6dad1]/50",
                    isHidden ? "-translate-y-[calc(100%+2.5rem)]" : "translate-y-0",
                    !isAtTop ? "shadow-sm py-2" : "py-4"
                )}
            >
                <div className="max-w-[1500px] mx-auto px-6 grid grid-cols-3 items-center">

                    <div className="flex items-center gap-6">
                        <button
                            className="lg:hidden p-2 -ml-2 text-[#3f2f2f] hover:text-[#864d2d] transition-colors"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6 stroke-[1.5]" />
                        </button>

                        <nav className="hidden lg:flex items-center gap-10">
                            {navItems.map((item) => {
                                const isCatalog = item.label.toLowerCase().includes("catálogo") || item.label.toLowerCase().includes("colección");

                                if (isCatalog) {
                                    return (
                                        <div key={item.id} className="group relative py-2">
                                            {/* 🔥 PREFETCH APAGADO */}
                                            <Link
                                                href={item.href}
                                                prefetch={false}
                                                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f]/60 hover:text-[#3f2f2f] flex items-center gap-1 transition-colors"
                                            >
                                                {item.label}
                                                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                                            </Link>

                                            <div className="absolute top-full left-0 pt-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                <div className="bg-white shadow-2xl border border-[#e6dad1]/30 p-6 flex flex-col gap-3">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#864d2d] mb-2 border-b border-[#e6dad1]/50 pb-2">
                                                        Siluetas
                                                    </span>
                                                    {categorias.map(cat => (
                                                        <Link
                                                            key={cat.id}
                                                            href={`/tienda/catalogo?categoria=${cat.slug}`}
                                                            prefetch={false} 
                                                            className="text-sm font-serif text-[#3f2f2f]/80 hover:text-[#864d2d] hover:italic transition-all"
                                                        >
                                                            {cat.nombre}
                                                        </Link>
                                                    ))}
                                                    <div className="pt-3 mt-2 border-t border-[#e6dad1]/30">
                                                        <Link
                                                            href="/tienda/catalogo"
                                                            prefetch={false} 
                                                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f] hover:text-[#864d2d] transition-colors flex items-center gap-2"
                                                        >
                                                            Ver todo <ArrowRight className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        prefetch={false} 
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f]/60 hover:text-[#3f2f2f] transition-colors py-2 relative group"
                                    >
                                        {item.label}
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#864d2d] transition-all duration-300 group-hover:w-full" />
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex justify-center flex-1">
                        <Link href="/tienda" prefetch={false} className="relative group block">
                            {settings.logoUrl ? (
                                <div className="relative h-10 w-40 md:h-12 md:w-56 lg:h-16 lg:w-64 xl:w-60 transition-transform duration-700 ease-out group-hover:scale-105">
                                    <Image
                                        src={settings.logoUrl}
                                        alt={settings.storeName}
                                        fill
                                        priority
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <span className="text-2xl md:text-3xl font-serif text-[#3f2f2f] tracking-tight group-hover:text-[#864d2d] transition-colors">
                                    {settings.storeName}
                                </span>
                            )}
                        </Link>
                    </div>

                    <div className="flex items-center justify-end gap-2 md:gap-6">
                        {/* 🔥 PREFETCH APAGADO EN EL BUSCADOR MÓVIL */}
                        <Link href="/tienda/catalogo" prefetch={false} className="p-2 text-[#3f2f2f] hover:text-[#864d2d] transition-colors hidden sm:block">
                            <Search className="w-5 h-5 stroke-[1.5]" />
                        </Link>

                        <button
                            onClick={openCart}
                            className="relative p-2 text-[#3f2f2f] hover:text-[#864d2d] transition-colors group"
                            aria-label="Abrir Carrito"
                        >
                            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                            {mounted && itemCount > 0 && (
                                <div className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-[#864d2d] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in duration-300">
                                    {itemCount}
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] flex lg:hidden">
                    <div 
                        className="absolute inset-0 bg-[#3f2f2f]/60 backdrop-blur-md animate-in fade-in duration-300" 
                        onClick={() => setIsMenuOpen(false)} 
                    />
                    
                    <div className="relative w-[85vw] max-w-sm bg-[#fcfaf8] h-full shadow-2xl animate-in slide-in-from-left duration-500 flex flex-col">
                        <div className="p-6 border-b border-[#e6dad1]/50 flex justify-between items-center bg-white">
                            <span className="text-xl font-serif text-[#3f2f2f] italic">{settings.storeName}</span>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 text-[#3f2f2f]/50 hover:text-[#864d2d] transition-colors">
                                <X className="w-6 h-6 stroke-[1.5]" />
                            </button>
                        </div>

                        <nav className="flex flex-col flex-1 overflow-y-auto px-8 py-10 gap-8">
                            {navItems.map(item => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    prefetch={false} 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-2xl font-serif text-[#3f2f2f] hover:text-[#864d2d] transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="pt-8 border-t border-[#e6dad1]/50 mt-4">
                                <p className="text-[10px] font-black text-[#864d2d]/80 uppercase tracking-[0.3em] mb-6">
                                    Siluetas y Colecciones
                                </p>
                                <div className="grid gap-5">
                                    {categorias.map(cat => (
                                        <Link
                                            key={cat.id}
                                            href={`/tienda/catalogo?categoria=${cat.slug}`}
                                            prefetch={false} 
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-lg font-light text-[#3f2f2f]/80 hover:text-[#864d2d] hover:italic transition-all flex items-center gap-3"
                                        >
                                            <span className="w-4 h-[1px] bg-[#e6dad1]" />
                                            {cat.nombre}
                                        </Link>
                                    ))}
                                    
                                    <Link
                                        href={`/tienda/catalogo`}
                                        prefetch={false}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3f2f2f] hover:text-[#864d2d] transition-colors mt-4"
                                    >
                                        Ver catálogo completo →
                                    </Link>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}