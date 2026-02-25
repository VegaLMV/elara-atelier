"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

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

  function go(nextIdx: number) {
    if (total === 0) return;
    const safe = ((nextIdx % total) + total) % total;
    setIdx(safe);
  }

  function next() { go(idx + 1); }
  function prev() { go(idx - 1); }

  useEffect(() => {
    if (total <= 1 || paused) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      setIdx((p) => (p + 1) % total);
    }, 5000);

    return () => {
      timer.current && clearInterval(timer.current);
      timer.current = null;
    };
  }, [total, paused]);

  if (total === 0) return null;

  return (
    <section
      className="relative w-full h-[85vh] md:h-screen overflow-hidden bg-[#3f2f2f]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* 1. CONTENEDOR DE IMÁGENES */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-[1.5s] ease-in-out ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <Image
              src={s.imagenUrl}
              alt={s.titulo || "Hero Élara"}
              fill
              priority={i === idx}
              quality={90}
              className={`object-cover transition-transform duration-[10s] ease-out ${i === idx ? "scale-105" : "scale-100"
                }`}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1515]/80 via-[#1a1515]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1515]/60 via-transparent to-transparent opacity-80" />
          </div>
        ))}
      </div>

      {/* 2. TEXTOS CON ANIMACIÓN */}
      <div className="absolute bottom-12 left-6 md:bottom-20 md:left-16 z-30 max-w-2xl pointer-events-none">
        {slides.map((s, i) => {
          if (i !== idx) return null;

          const title = s.titulo || (categoriaNombre ? categoriaNombre : "Vestimos tu Esencia");
          const subtitle = s.subtitulo || "Descubre piezas curadas para resaltar tu elegancia natural.";
          const ctaText = s.botonTexto || "Explorar Colección";
          const href = s.enlace || "#catalogo-grid";

          return (
            <div key={s.id + "-content"} className="pointer-events-auto">
              
              {/* Etiqueta superior */}
              <ScrollReveal direction="right" delay={0.1}>
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-[1px] bg-white/60" />
                  <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-white/80">
                    Élara Atelier
                  </span>
                </div>
              </ScrollReveal>

              {/* Título Elegante */}
              <ScrollReveal direction="up" delay={0.3}>
                <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-serif text-white leading-[1.05] tracking-tight mb-6">
                  {title}
                </h1>
              </ScrollReveal>

              {/* Subtítulo refinado */}
              <ScrollReveal direction="up" delay={0.5}>
                <p className="text-sm md:text-lg text-white/70 font-light leading-relaxed max-w-lg mb-8 md:mb-10">
                  {subtitle}
                </p>
              </ScrollReveal>

              {/* Botón de Acción */}
              <ScrollReveal direction="up" delay={0.7}>
                <CtaLink
                  href={href}
                  className="group inline-flex items-center gap-4 bg-transparent border border-white/40 text-white px-8 md:px-10 py-3.5 md:py-4 hover:bg-white hover:text-[#3f2f2f] transition-all duration-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]"
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </CtaLink>
              </ScrollReveal>
            </div>
          );
        })}
      </div>

      {/* 3. CONTROLES MINIMALISTAS */}
      {total > 1 && (
        <div className="absolute bottom-12 right-6 md:bottom-20 md:right-16 z-30 flex flex-col items-end gap-6">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id + "-dot"}
                type="button"
                onClick={() => go(i)}
                className={`h-[2px] transition-all duration-500 ${i === idx ? "w-10 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
                  }`}
                aria-label={`Ir al banner ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-px bg-white/10 backdrop-blur-md border border-white/10">
            <button
              onClick={prev}
              className="p-3 md:p-4 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Anterior"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
            </button>
            <div className="w-px h-6 bg-white/20" />
            <button
              onClick={next}
              className="p-3 md:p-4 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Siguiente"
            >
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}