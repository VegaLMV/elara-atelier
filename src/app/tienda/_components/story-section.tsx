"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StorySectionProps {
    title: string;
    body: string;
    imageUrl: string | null;
    ctaText?: string;
    ctaHref?: string;
}

export default function StorySection({
    title = "Nuestra Historia",
    body = "ELARA ATELIER nace de la pasión por la elegancia y el detalle...",
    imageUrl,
    ctaText = "Conocer más",
    ctaHref = "/identidad"
}: StorySectionProps) {
    return (
        <section className="max-w-[1400px] mx-auto px-6 py-24">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                {/* Image Side - Left */}
                <div className="w-full lg:w-1/2 relative group">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-10 -left-10 w-48 h-48 border-l-2 border-t-2 border-slate-200/60 pointer-events-none transition-transform duration-700 group-hover:-translate-x-4 group-hover:-translate-y-4" />
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 border-r-2 border-b-2 border-slate-200/60 pointer-events-none transition-transform duration-700 group-hover:translate-x-4 group-hover:translate-y-4" />

                    {/* Decorative Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-slate-100 rounded-full opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-1000 ease-out z-0 pointer-events-none" />

                    {/* Floating Decorative Label */}
                    <div className="absolute top-8 right-[-30px] bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.35em] px-5 py-8 [writing-mode:vertical-lr] z-20 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-1000">
                        2026 • ELARA ATELIER
                    </div>

                    {/* Main Image Container */}
                    <div className="relative aspect-[4/5] overflow-hidden shadow-2xl z-10">
                        {/* Inner Border Frame */}
                        <div className="absolute inset-2 border border-white/20 z-20 pointer-events-none" />

                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-[2.5s] ease-out group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center font-serif italic text-slate-400">
                                Imagen de Historia
                            </div>
                        )}
                        {/* Overlay subtle */}
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors duration-700" />
                    </div>

                    {/* Accent Detail - Quote */}
                    <div className="absolute -bottom-8 -left-12 hidden lg:block z-30">
                        <span className="text-9xl font-serif text-slate-200 select-none opacity-80 mix-blend-multiply">“</span>
                    </div>
                </div>

                {/* Text Side - Right */}
                <div className="w-full lg:w-1/2 space-y-8 relative">
                    {/* Decorative Watermark bg */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 text-[10rem] font-serif text-slate-50 opacity-50 select-none pointer-events-none z-0">
                        Story
                    </div>

                    <div className="space-y-6 relative z-10">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 block animate-in fade-in slide-in-from-bottom-2 duration-700">
                            Our Essence
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-slate-900 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 relative inline-block">
                            {title}
                            <svg className="absolute w-full h-3 -bottom-2 left-0 text-amber-400/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                        </h2>
                    </div>
                    {/* Decorative Separator Line */}
                    <div className="w-24 h-[1px] bg-slate-300" />

                    <div className="space-y-6">
                        {body.split('\n').map((paragraph, i) => (
                            <p
                                key={i}
                                className="text-slate-600 leading-relaxed font-light text-lg animate-in fade-in slide-in-from-bottom-6 duration-1000"
                                style={{ animationDelay: `${200 + i * 100}ms` }}
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="pt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                        <Link
                            href={ctaHref}
                            className="inline-flex items-center gap-4 group/btn"
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 group-hover/btn:tracking-[0.4em] transition-all duration-300 border-b border-slate-900 pb-2">
                                {ctaText}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-900 transition-transform duration-300 group-hover/btn:translate-x-2" />
                        </Link>
                    </div>

                    {/* Sign or Stamp */}
                    <div className="pt-12 flex items-center gap-4 opacity-30 select-none animate-in fade-in duration-[2s]">
                        <div className="h-[1px] w-12 bg-slate-900" />
                        <span className="font-serif italic text-sm text-slate-900">Elara Atelier Signature</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
