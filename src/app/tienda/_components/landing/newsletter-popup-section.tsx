"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Star, Sparkles, Gift, MapPin } from "lucide-react";

type PromoBannerProps = {
  title?: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
};

export default function NewsletterSection({
  title = "PRIMER ENVÍO GRATIS",
  // 1. CAMBIO AQUÍ: Especificamos "Perú" en la descripción
  subtitle = "Tu primera compra merece ser especial. Descubre nuestra colección y nosotros cubrimos el costo de envío a nivel nacional.",
  badge = "REGALO DE BIENVENIDA",
  imageUrl = "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1886&auto=format&fit=crop", 
}: PromoBannerProps) {
  return (
    <section className="py-20 md:py-28 bg-[var(--brand-bg)] relative overflow-hidden">
      {/* --- FONDOS ABSTRACTOS --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[120%] bg-[var(--brand-primary)] opacity-[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[100%] bg-[var(--brand-accent)] opacity-[0.05] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className={`mx-auto ${imageUrl ? 'grid grid-cols-1 lg:grid-cols-2 gap-10 items-center' : 'max-w-4xl text-center'}`}>
          
          {/* === COLUMNA DE TEXTO === */}
          <div className={`space-y-6 ${!imageUrl && 'flex flex-col items-center'} relative z-10`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 backdrop-blur-sm relative overflow-hidden group">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-accent)]">
                {badge}
              </span>
            </div>

            {/* Títulos */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--brand-primary)]/60" style={{ fontFamily: "var(--brand-font-body)" }}>
                Solo por tiempo limitado
              </h2>
              <h3 
                className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-[var(--brand-primary)] tracking-tighter leading-[0.9]"
                style={{ fontFamily: "var(--brand-font-heading)" }}
              >
                {title}
              </h3>
            </div>
            
            {/* PUNTOS DE CONFIANZA (AQUÍ ESTÁ EL CAMBIO PRINCIPAL) */}
            <div className={`flex flex-wrap gap-3 md:gap-4 pt-2 ${!imageUrl && 'justify-center'}`}>
                {/* Etiqueta Perú */}
                <div className="flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-wider text-[var(--brand-primary)] font-black bg-white/80 shadow-sm px-3 py-2 rounded-md border border-[var(--brand-primary)]/10">
                    <span className="text-sm leading-none">🇵🇪</span> 
                    A todo el Perú
                </div>
            </div>

            {/* Descripción */}
            <p 
              className={`text-base md:text-lg text-[var(--brand-primary)]/70 leading-relaxed font-light ${!imageUrl ? 'max-w-2xl' : 'max-w-md'}`}
              style={{ fontFamily: "var(--brand-font-body)" }}
            >
              {subtitle}
            </p>

            {/* Botón CTA */}
            <div className="pt-4">
              <Link 
                href="/tienda/catalogo"
                className="inline-flex items-center gap-4 px-8 py-4 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-accent)] transition-all duration-500 shadow-xl hover:shadow-[var(--brand-accent)]/20 group relative overflow-hidden rounded-sm"
                style={{ fontFamily: "var(--brand-font-body)" }}
              >
                <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10">
                  Reclamar Mi Envío Gratis
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
          </div>

          {/* === COLUMNA DE IMAGEN CON ACCESORIOS === */}
          {imageUrl && (
            <div className="relative h-[400px] sm:h-[450px] lg:h-[550px] w-full group perspective-1000 mt-10 lg:mt-0">
              
              <div className="absolute top-1/4 left-1/4 w-[80%] h-[80%] bg-[var(--brand-accent)]/20 blur-[80px] rounded-full -z-10 pointer-events-none mix-blend-multiply" />
              <div className="absolute inset-0 border-2 border-[var(--brand-primary)]/5 translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6 transition-all duration-700 group-hover:translate-x-3 group-hover:translate-y-3 group-hover:border-[var(--brand-accent)]/20 z-0" />
              
              <div className="relative w-full h-full overflow-hidden shadow-2xl rounded-sm z-10">
                <div className="absolute inset-0 bg-[var(--brand-primary)]/10 z-10 group-hover:bg-transparent transition-colors duration-700 mix-blend-overlay" />
                <Image
                  src={imageUrl}
                  alt="Promoción de envío gratis Perú"
                  fill
                  className="object-cover object-top scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* BADGE FLOTANTE */}
              <div className="absolute -top-4 -right-2 md:-top-5 md:-right-5 z-20 bg-white p-1 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-[bounce_3s_ease-in-out_infinite]">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--brand-accent)] flex flex-col items-center justify-center text-white text-center p-2 border-2 border-white dashed">
                    {/* CAMBIO: Ícono de Mapa en lugar del camión para reforzar territorio */}
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 mb-0.5 md:mb-1" />
                    <span className="text-[7px] md:text-[9px] font-black uppercase leading-none tracking-tighter">
                        Envíos <br/> Perú
                    </span>
                </div>
              </div>
              
              {/* Etiqueta inferior */}
              <div className="absolute -bottom-3 left-4 md:-bottom-4 md:left-8 z-20 bg-white px-3 py-1.5 md:px-4 md:py-2 shadow-lg rounded-sm flex items-center gap-2">
                 <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-800">Oferta Activa Febrero - Marzo 2026</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </section>
  );
}