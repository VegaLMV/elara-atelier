"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { formatMoney } from "@/lib/precios";

type ProductoCardProps = {
  producto: {
    id: string;
    nombre: string;
    slug: string;
    categoria?: string;
    imagenes: string[];
    precioOriginal: number;
    precioFinal: number;
    tieneDescuento: boolean;
    porcentaje: number | null;
    esNuevo: boolean;
    stock: number;
    destacado: boolean;
  };
};

export default function ProductoCard({ producto }: ProductoCardProps) {
  const hasImages = producto.imagenes && producto.imagenes.length > 0;
  const mainImage = hasImages ? producto.imagenes[0] : null;
  const hoverImage = hasImages && producto.imagenes.length > 1 ? producto.imagenes[1] : null;

  return (
    <Link
      href={`/tienda/${producto.slug}`}
      className="group flex flex-col gap-4 cursor-pointer w-full h-full"
    >
      {/* Contenedor de Imagen de Alta Costura */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe6] rounded-sm">
        
        {/* Badges Flotantes Minimalistas */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
          {producto.tieneDescuento && (
            <span className="bg-[#864d2d] text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
              {producto.porcentaje}% OFF
            </span>
          )}
          {producto.esNuevo && (
            <span className="bg-[#3f2f2f] text-[#fcfaf8] text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
              Nuevo
            </span>
          )}
          {producto.destacado && (
            <span className="bg-white/90 backdrop-blur-md text-[#3f2f2f] border border-[#3f2f2f]/10 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 shadow-sm">
              Top
            </span>
          )}
        </div>

        {/* Sistema de Imágenes */}
        {mainImage ? (
          <>
            <Image
              src={mainImage}
              alt={producto.nombre}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={90}
              className={`object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105
                ${hoverImage ? 'group-hover:opacity-0' : ''}
              `}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={`${producto.nombre} vista 2`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={90}
                className="object-cover absolute inset-0 opacity-0 transition-all duration-[1s] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:opacity-100 group-hover:scale-105"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#3f2f2f]/30 space-y-3">
            <ImageIcon className="w-8 h-8 opacity-50" />
            <span className="font-serif italic text-sm">Imagen en curaduría</span>
          </div>
        )}

        {/* Botón "Ver Pieza" estilo Boutique (Sustituye al Shopping Bag + Ojo) */}
        {producto.stock > 0 && (
          <div className="absolute inset-x-4 bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20">
            <div className="w-full bg-white/95 backdrop-blur-md text-[#3f2f2f] text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 text-center flex items-center justify-center gap-2 border border-black/5 hover:bg-[#3f2f2f] hover:text-white transition-colors">
              Ver detalles <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* Overlay Agotado Total Elegante */}
        {producto.stock === 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-20">
            <div className="border border-[#3f2f2f] text-[#3f2f2f] bg-white/80 px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] shadow-lg">
              Agotado
            </div>
          </div>
        )}
      </div>

      {/* Textos del Producto (Centrados y editoriales) */}
      <div className="space-y-1.5 px-1 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#864d2d]/70">
          {producto.categoria || "Colección Exclusiva"}
        </p>
        <h3 className="text-sm md:text-base font-serif text-[#3f2f2f] line-clamp-1 group-hover:text-[#864d2d] transition-colors">
          {producto.nombre}
        </h3>
        
        <div className="flex items-center justify-center gap-3 pt-1">
          {producto.tieneDescuento ? (
            <>
              <span className="text-xs text-[#3f2f2f]/40 line-through">
                {formatMoney(producto.precioOriginal)}
              </span>
              <span className="text-sm font-bold text-[#864d2d]">
                {formatMoney(producto.precioFinal)}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-[#3f2f2f]/80">
              {formatMoney(producto.precioFinal)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}