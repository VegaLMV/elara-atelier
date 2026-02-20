"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type HeroSlideDTO = {
  id: string;
  imagenUrl: string;
  titulo?: string | null;
  subtitulo?: string | null;
  botonTexto?: string | null;
  enlace?: string | null;
};

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function HeroCarousel({
  banners,
  categoriaNombre,
}: {
  banners: HeroSlideDTO[];
  categoriaNombre?: string;
}) {
  const slides = banners ?? [];
  const total = slides.length;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const current = slides[Math.min(idx, Math.max(0, total - 1))];

  function go(nextIdx: number) {
    if (total === 0) return;
    const safe = ((nextIdx % total) + total) % total;
    setIdx(safe);
  }

  function next() {
    go(idx + 1);
  }

  function prev() {
    go(idx - 1);
  }

  useEffect(() => {
    if (total <= 1 || paused) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      setIdx((p) => (p + 1) % total);
    }, 4000); // segundos de intervalo

    return () => {
      timer.current && clearInterval(timer.current);
      timer.current = null;
    };
  }, [total, paused]);

  if (total === 0) return null;

  return (
    <section
      className="relative overflow-hidden text-white min-h-[70vh] flex items-center bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Slides Container */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            {/* Image with Zoom Animation */}
            <Image
              src={s.imagenUrl}
              alt={s.titulo || "Hero"}
              fill
              priority={i === idx}
              quality={85}
              className={`object-cover transition-transform duration-[4000ms] linear ${i === idx ? "scale-110" : "scale-100"
                }`}
              sizes="100vw"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

            {/* Ambient Glows */}
            <div
              className={`absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-25 transition-all duration-1000 ${i === idx ? "scale-100" : "scale-50 opacity-0"
                }`}
              style={{ background: "var(--brand-accent, #bf8f71)" }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 text-center space-y-8 py-24 md:py-32">
        {/* Usamos el slide actual para los textos */}
        {slides.map((s, i) => {
          if (i !== idx) return null;

          const title = s.titulo || (categoriaNombre ? categoriaNombre : "Vestimos tu Esencia Única");
          const subtitle =
            s.subtitulo ||
            "Descubre piezas exclusivas diseñadas para resaltar tu personalidad.";
          const ctaText = s.botonTexto || "Ver colección";
          const href = s.enlace || "#catalogo-grid";

          return (
            <div key={s.id + "-content"} className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex items-center justify-center gap-2 mb-6">
                {categoriaNombre && (
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/80">
                    Explorando: {categoriaNombre}
                  </span>
                )}
                {total > 1 && (
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest text-white/70">
                    {idx + 1}/{total}
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-9xl font-serif font-medium tracking-tight leading-[0.85] text-white">
                {title}
              </h1>

              <p className="max-w-2xl mx-auto mt-8 text-base md:text-xl text-white/80 font-light leading-relaxed">
                {subtitle}
              </p>

              <div className="flex justify-center gap-4 mt-10">
                <CtaLink
                  href={href}
                  className="group inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-full font-bold transition-all hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
                >
                  {ctaText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </CtaLink>
              </div>
            </div>
          );
        })}

        {total > 1 && (
          <div className="pt-12 flex items-center justify-center gap-3">
            {slides.map((s, i) => (
              <button
                key={s.id + "-dot"}
                type="button"
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-500 border border-white/10 ${i === idx ? "w-12 bg-white" : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
                title={s.titulo ? `Ir a: ${s.titulo}` : `Ir al banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-30 active:scale-90"
            title="Anterior"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            type="button"
            onClick={next}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-30 active:scale-90"
            title="Siguiente"
          >
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}
    </section>
  );
}
