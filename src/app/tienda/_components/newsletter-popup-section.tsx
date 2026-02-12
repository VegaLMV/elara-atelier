"use client";

import { ArrowRight, Mail } from "lucide-react";

export default function NewsletterPopupSection() {
    return (
        <section className="bg-[#3f2f2f] text-[#e6dad1] py-24 relative overflow-hidden">
            {/* Decorative Lines */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e6dad1]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#e6dad1]/30 to-transparent" />

            <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#e6dad1]/30 rounded-full text-xs font-bold uppercase tracking-widest text-[#e6dad1]/80">
                        <span className="w-2 h-2 rounded-full bg-[#864d2d] animate-pulse" />
                        Únete al Círculo Exclusivo
                    </div>

                    <h2 className="text-4xl md:text-6xl font-serif leading-tight">
                        Desbloquea <span className="text-[#864d2d]">10% OFF</span> <br />
                        en tu Primera Orden
                    </h2>

                    <p className="text-lg text-[#e6dad1]/70 font-light max-w-md leading-relaxed">
                        Regístrate para acceso exclusivo a nuevos lanzamientos, ventas secretas y consejos de estilo de nuestros maestros del atelier.
                    </p>

                    <form className="flex flex-col sm:flex-row gap-4 max-w-lg">
                        <div className="relative flex-1">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3f2f2f]/60 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="Ingresa tu correo electrónico"
                                className="w-full bg-[#e6dad1] text-[#3f2f2f] placeholder-[#3f2f2f]/50 px-12 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#864d2d] transition-shadow"
                            />
                        </div>
                        <button className="bg-[#864d2d] text-white px-8 py-4 rounded-full font-bold hover:bg-[#a0623f] transition-colors flex items-center justify-center gap-2 group">
                            Suscribirse
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <p className="text-xs text-[#e6dad1]/40">
                        Al suscribirte aceptas nuestros Términos y Política de Privacidad. Sin spam, nunca.
                    </p>
                </div>

                {/* Decorative Visual Side */}
                <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#3f2f2f]/80 to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                        alt="Elara Fashion"
                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                    />

                    <div className="absolute bottom-8 left-8 z-20">
                        <div className="text-3xl font-serif italic text-white mb-2">"Eleganza"</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-white/80">Vista Previa Nueva Colección</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
