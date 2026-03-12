"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Calendar, Tag } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

type CampaignData = {
    selectedCampaignId?: string | null;
    nombreCampaña?: string;
    descripcionCampaña?: string;
    title?: string | null; // Para compatibilidad con datos guardados antes
    subtitle?: string | null; // Para compatibilidad con datos guardados antes
    nombre?: string | null; // Fallback
    descripcion?: string | null; // Fallback
    imagenUrl?: string | null;
    imageUrl?: string | null; // Fallback
    tipo?: string | null;
    valor?: number;
    startsAt?: string | null;
    endsAt?: string | null;
};

type PromoCampaignSectionProps = {
    campaign: CampaignData;
};

export default function PromoCampaignSection({ campaign }: PromoCampaignSectionProps) {
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; isFuture: boolean } | null>(null);

    // Evita renderizar si no hay datos válidos
    if (!campaign.startsAt || !campaign.endsAt || !campaign.valor) {
        return null;
    }

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const start = new Date(campaign.startsAt!);
            const end = new Date(campaign.endsAt!);

            const isFuture = now < start;
            const target = isFuture ? start : end;
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                if (!isFuture) {
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

    // BÚSQUEDA ROBUSTA: Busca la información en todas las llaves posibles que el JSON podría tener
    const finalTitle = campaign.nombreCampaña || campaign.title || campaign.nombre || "Oferta Especial";
    const finalSubtitle = campaign.descripcionCampaña || campaign.subtitle || campaign.descripcion || "Descubre nuestra colección exclusiva con descuentos especiales.";
    const bgImage = campaign.imagenUrl || campaign.imageUrl;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' }).format(d);
    };

    const rangoFechas = `${formatDate(campaign.startsAt)} - ${formatDate(campaign.endsAt)}`;

    if (!timeLeft) return null;

    const isPorcentaje = campaign.tipo === "PORCENTAJE";

    return (
        <section className="relative w-full overflow-hidden my-24 group py-8">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                <div className="bg-white rounded-[2.5rem] p-6 md:p-12 lg:p-16 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-[#e6dad1]/50 relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3f2f2f 1px, transparent 0)', backgroundSize: '32px 32px' }}
                    />

                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">

                        <div className="w-full lg:w-1/2 order-2 lg:order-1 space-y-8 text-center lg:text-left pt-8 lg:pt-0">
                            <ScrollReveal direction="left" delay={0.1}>
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#864d2d]/10 text-[#864d2d] rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Válido: {rangoFechas}
                                    </div>

                                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#3f2f2f] leading-[1.05] tracking-tight relative inline-block">
                                        {finalTitle}
                                        <span className="block h-1.5 w-1/2 mt-4 bg-[#864d2d] rounded-full mx-auto lg:mx-0" />
                                    </h2>

                                    <p className="text-lg md:text-xl text-[#3f2f2f]/70 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                        {finalSubtitle}
                                    </p>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal direction="up" delay={0.3}>
                                <div className="py-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 border-y border-[#e6dad1]/40">
                                    <div className="flex items-center gap-2 text-[#864d2d]">
                                        <Clock className="w-5 h-5" />
                                        <span className="text-sm font-bold uppercase tracking-widest">
                                            {timeLeft.isFuture ? "Empieza en:" : "Termina en:"}
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <TimeBox value={timeLeft.d} label="Días" />
                                        <span className="text-2xl text-[#3f2f2f]/30 font-light mt-1">:</span>
                                        <TimeBox value={timeLeft.h} label="Hrs" />
                                        <span className="text-2xl text-[#3f2f2f]/30 font-light mt-1">:</span>
                                        <TimeBox value={timeLeft.m} label="Min" />
                                        <span className="text-2xl text-[#3f2f2f]/30 font-light mt-1">:</span>
                                        <TimeBox value={timeLeft.s} label="Seg" />
                                    </div>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal direction="up" delay={0.5}>
                                <div className="pt-4">
                                    <Link
                                        href="/tienda/catalogo"
                                        className="inline-flex items-center justify-center bg-[#864d2d] text-white px-10 py-5 rounded-full font-bold text-lg transition-all duration-300 hover:bg-[#3f2f2f] hover:shadow-xl hover:-translate-y-1 active:translate-y-0 group/btn"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Tag className="w-5 h-5" />
                                            Ver Catálogo en Oferta
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
                                        </span>
                                    </Link>
                                </div>
                            </ScrollReveal>
                        </div>

                        <div className="w-full lg:w-1/2 order-1 lg:order-2 relative mt-10 lg:mt-0">
                            <ScrollReveal direction="right" delay={0.2}>
                                <div className="relative mx-auto max-w-[450px] lg:max-w-none">

                                    <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#864d2d]/20 rounded-full blur-[80px] animate-pulse" />
                                    <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#3f2f2f]/10 rounded-full blur-[80px] animate-pulse delay-700" />

                                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 group-hover:shadow-[0_20px_50px_-15px_rgba(134,77,45,0.4)]">
                                        <div className="aspect-[4/5] bg-gradient-to-tr from-[#3f2f2f] to-[#1a1414] relative flex items-center justify-center overflow-hidden">
                                            {bgImage ? (
                                                <Image
                                                    src={bgImage}
                                                    alt={finalTitle}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 opacity-90"
                                                    priority
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#864d2d] to-[#3f2f2f]">
                                                    <span className="text-white/10 font-serif text-5xl font-black rotate-[-10deg] px-10 text-center uppercase tracking-widest leading-none">
                                                        {finalTitle}
                                                    </span>
                                                </div>
                                            )}

                                            {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-[#1a1414]/90 via-[#1a1414]/20 to-transparent" />}
                                        </div>
                                    </div>

                                    <div className="absolute -top-12 -left-6 lg:-left-16 z-30 animate-float-slow">
                                        <div className="bg-[#e6dad1] p-2 rounded-[2rem] shadow-2xl rotate-[-6deg]">
                                            <div className="border border-[#864d2d]/30 border-dashed rounded-[1.5rem] px-8 py-6 lg:px-10 lg:py-8 bg-[#fdfbf9] flex flex-col items-center justify-center min-w-[160px] lg:min-w-[200px]">
                                                <span className="text-[#864d2d] font-black uppercase tracking-[0.3em] text-[10px] lg:text-xs mb-1">
                                                    Descuento de
                                                </span>
                                                <span className="text-[#3f2f2f] text-6xl lg:text-8xl font-black tracking-tighter leading-none flex items-start">
                                                    {!isPorcentaje && <span className="text-3xl lg:text-4xl mt-1 lg:mt-2 mr-1">S/</span>}
                                                    {campaign.valor}
                                                    {isPorcentaje && <span className="text-4xl lg:text-6xl mt-0 lg:mt-2 ml-1">%</span>}
                                                </span>
                                                <span className="text-[#3f2f2f]/50 font-bold uppercase text-[9px] lg:text-[10px] tracking-widest mt-2 bg-[#3f2f2f]/5 px-3 py-1 rounded-full">
                                                    En la colección
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) rotate(-6deg); }
                    50% { transform: translateY(-12px) rotate(-8deg); }
                }
                .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
            `}</style>
        </section>
    );
}

function TimeBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center bg-[#fdfbf9] border border-[#e6dad1] rounded-xl w-14 h-16 sm:w-16 sm:h-20 justify-center shadow-sm">
            <span className="text-2xl sm:text-3xl font-black text-[#864d2d] tabular-nums leading-none">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#3f2f2f]/60 uppercase tracking-wider mt-1.5">{label}</span>
        </div>
    );
}