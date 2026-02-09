"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HeroSection({ categoriaNombre }: { categoriaNombre?: string }) {
    return (
        <div className="relative overflow-hidden bg-slate-900 text-white pb-20 pt-24 md:pt-32">
            {/* Fondo Abstracto Animado */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[12000ms]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest text-indigo-300 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="w-3 h-3" /> Nueva Colección 2026
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight leading-[0.9] text-white animate-in fade-in zoom-in-95 duration-1000">
                    {categoriaNombre ? categoriaNombre : "Vestimos tu\nEsencia Unica"}
                </h1>

                <p className="max-w-xl mx-auto text-lg text-slate-300 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    Descubre piezas exclusivas diseñadas para resaltar tu personalidad.
                    Moda atemporal con un toque de sofisticación contemporánea.
                </p>

                <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    <Link
                        href="#catalogo-grid"
                        className="group bg-white text-slate-900 px-8 py-4 rounded-full font-bold transition-all hover:bg-indigo-50 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        Explorar Colección
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
