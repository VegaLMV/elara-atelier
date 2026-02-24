"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Clock, Calendar } from "lucide-react";

type CampaignData = {
    nombre: string;
    descripcion: string | null;
    imagenUrl: string | null;
    tipo: string | null;
    valor: number;
    startsAt: string;
    endsAt: string;
};

type PromoCampaignSectionProps = {
    title?: string;
    subtitle?: string;
    campaign: CampaignData;
};

export default function PromoCampaignSection({
    title,
    subtitle,
    campaign
}: PromoCampaignSectionProps) {
    // --- Estados ---
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; isFuture: boolean } | null>(null);

    // --- Lógica del Countdown ---
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const start = new Date(campaign.startsAt);
            const end = new Date(campaign.endsAt);

            // Determinar a qué fecha estamos contando
            const isFuture = now < start;
            const target = isFuture ? start : end;
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                // Si ya pasó el fin, o si justo cambió de futuro a activo, recalculamos
                if (!isFuture && now > end) {
                    setTimeLeft(null);
                    return;
                }
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ d, h, m, s, isFuture });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [campaign.startsAt, campaign.endsAt]);

    // --- Mapeo de Datos ---
    const finalTitle = title || campaign.nombre;
    const finalSubtitle = subtitle || campaign.descripcion || "Descubre nuestra colección exclusiva con descuentos especiales.";
    const bgImage = campaign.imagenUrl || "/images/promo-placeholder.jpg";

    // Formato de Fechas (DD MMM)
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        // Forzamos la visualización en la zona horaria de Perú (America/Lima)
        return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' }).format(d);
    };

    const rangoFechas = `Del ${formatDate(campaign.startsAt)} al ${formatDate(campaign.endsAt)}`;

    if (!timeLeft) return null;

    return (
        <section className="relative w-full overflow-hidden my-24 group">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Contenedor Principal (Card Gigante) */}
                <div className="bg-[#e6dad1]/20 rounded-[2.5rem] p-6 md:p-12 lg:p-16 border border-[#e6dad1]/50 shadow-sm relative overflow-hidden">
                    {/* Decoración de Fondo (Patrón sutil) */}
                    <div className="absolute top-0 right-0 w-full h-full opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3f2f2f 1px, transparent 0)', backgroundSize: '40px 40px' }}
                    />
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10">
                        {/* === COLUMNA IZQUIERDA: TEXTO === */}
                        <div className="w-full lg:w-1/2 order-2 lg:order-1 space-y-8 text-center lg:text-left">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#864d2d]/10 text-[#864d2d] rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                                    <Calendar className="w-3 h-3" />
                                    {rangoFechas}
                                </div>
                                <h2 className="text-5xl md:text-7xl font-serif text-[#3f2f2f] leading-[1.1] tracking-tight relative inline-block">
                                    {finalTitle}
                                    {/* Decorative Line under Title */}
                                    <span className="block h-2 w-full mt-2 bg-gradient-to-r from-[#864d2d]/60 to-transparent rounded-full" />
                                </h2>
                                <p className="text-xl text-[#3f2f2f]/80 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                    {finalSubtitle}
                                </p>
                                {/* Decorative Line under Description */}
                                <div className="w-24 h-[1px] bg-[#e6dad1] mx-auto lg:mx-0" />
                            </div>

                            {/* Contador Rediseñado */}
                            <div className="py-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
                                <div className="flex items-center gap-3 text-[#3f2f2f]/60">
                                    <Clock className="w-5 h-5 text-[#864d2d]" />
                                    <span className="text-sm font-bold uppercase tracking-wider">
                                        {(timeLeft as any).isFuture ? "Inicia en:" : "Termina en:"}
                                    </span>
                                </div>

                                <div className="flex gap-4">
                                    <TimeBox value={timeLeft.d} label="Días" />
                                    <span className="text-2xl text-[#e6dad1] font-light self-start mt-1">:</span>
                                    <TimeBox value={timeLeft.h} label="Hrs" />
                                    <span className="text-2xl text-[#e6dad1] font-light self-start mt-1">:</span>
                                    <TimeBox value={timeLeft.m} label="Min" />
                                    <span className="text-2xl text-[#e6dad1] font-light self-start mt-1">:</span>
                                    <TimeBox value={timeLeft.s} label="Seg" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link
                                    href="/tienda/catalogo"
                                    className="inline-flex items-center justify-center bg-[#3f2f2f] text-[#e6dad1] px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 hover:bg-[#864d2d] hover:text-white hover:shadow-2xl hover:shadow-[#864d2d]/30 hover:-translate-y-1 active:translate-y-0 group/btn"
                                >
                                    <span className="relative z-10 flex items-center gap-4">
                                        Aprovechar Oferta
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* === COLUMNA DERECHA: IMAGEN (Card Decorada) === */}
                        <div className="w-full lg:w-1/2 order-1 lg:order-2 relative perspective-1000">
                            {/* Decoraciones Flotantes detrás de la imagen */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#864d2d]/20 rounded-full blur-[80px] animate-pulse" />
                            <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-[#e6dad1]/40 rounded-full blur-[80px] animate-pulse delay-700" />

                            {/* Card Container */}
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 group-hover:shadow-[0_20px_60px_-15px_rgba(63,47,47,0.3)] group-hover:translate-y-[-5px]">
                                <div className="aspect-[3/4] lg:aspect-[4/5] bg-[#e6dad1] relative">
                                    <Image
                                        src={bgImage}
                                        alt={finalTitle}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                                    />
                                    {/* Overlay Gradiente sutil */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#3f2f2f]/60 via-transparent to-transparent opacity-80" />

                                    {/* SUPER BADGE DE DESCUENTO  */}
                                    <div className="absolute top-8 right-8 z-20">
                                        <div className="relative flex items-center justify-center w-28 h-28 bg-[#e6dad1] text-[#3f2f2f] rounded-full shadow-2xl animate-bounce-slow">
                                            <div className="absolute inset-1 border-2 border-dashed border-[#864d2d]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                            <div className="flex flex-col items-center leading-none mt-1">
                                                {/* MEJORA: Tipografía diferenciada para Moneda vs Porcentaje */}
                                                {campaign.tipo === "PORCENTAJE" ? (
                                                    <span className="text-3xl font-black text-[#864d2d]">{campaign.valor}%</span>
                                                ) : (
                                                    <div className="flex items-start text-[#864d2d]">
                                                        <span className="text-sm font-bold mt-1 mr-0.5">S/</span>
                                                        <span className="text-3xl font-black">{campaign.valor}</span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-[#3f2f2f]/70">Desc.</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Decorative Floating Elements (MEJORA: Texto en Español) */}
                            <div className="absolute -bottom-8 -right-8 bg-[#3f2f2f] text-[#e6dad1] px-6 py-4 rounded-2xl shadow-xl animate-float-delayed hidden lg:block rotate-[-5deg] z-30">
                                <div className="text-sm font-bold text-center leading-tight tracking-wider">
                                    ÚLTIMOS<br />DÍAS
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 1s; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
        </section>
    );
}

function TimeBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-[#3f2f2f] tabular-nums leading-none">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-[#3f2f2f]/40 uppercase tracking-wider mt-1">{label}</span>
        </div>
    );
}