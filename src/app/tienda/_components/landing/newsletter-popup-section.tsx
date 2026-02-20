"use client";

import { ArrowRight, Mail } from "lucide-react";
import Image from "next/image";

export default function NewsletterPopupSection() {
    return (
        <section className="bg-[#3f2f2f] text-[#e6dad1] py-24 relative overflow-hidden">
            {/* Decorative Lines */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e6dad1]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e6dad1]/30 to-transparent" />

            <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#e6dad1]/30 rounded-full text-xs font-bold uppercase tracking-widest text-[#e6dad1]/80">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Oportunidad Limitada
                    </div>

                    <h2 className="text-4xl md:text-6xl font-serif leading-tight">
                        Tu Primera Compra <br />
                        <span className="text-emerald-400 italic">Envío Gratis</span>
                    </h2>

                    <p className="text-lg text-[#e6dad1]/70 font-light max-w-md leading-relaxed">
                        Disfruta de la experiencia completa de Elara Atelier sin costos de envío en tu primer pedido. Regístrate ahora.
                    </p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-lg">
                        <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3f2f2f]/60 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="Ingresa tu correo electrónico"
                                className="w-full bg-[#e6dad1] text-[#3f2f2f] placeholder-[#3f2f2f]/50 px-12 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                            />
                        </div>
                        <button className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 group shadow-emerald-900/20 shadow-xl">
                            Obtener Beneficio
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <p className="text-xs text-[#e6dad1]/40">
                        *Válido solo para nuevos registros. Aplican términos y condiciones.
                    </p>
                </div>

                {/* Decorative Visual Side */}
                <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group shadow-2xl shadow-black/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3f2f2f] via-transparent to-transparent z-10" />
                    <Image
                        src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2070&auto=format&fit=crop"
                        alt="Elara Unboxing"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                    />

                    <div className="absolute bottom-8 left-8 z-20">
                        <div className="text-3xl font-serif italic text-white mb-2">"Unboxing Experiencial"</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Envío Premium Incluido</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
