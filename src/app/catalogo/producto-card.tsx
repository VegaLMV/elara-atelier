"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Eye } from "lucide-react";
import { formatMoney } from "@/lib/precios";

type ProductoCardProps = {
  producto: {
    id: string;
    nombre: string;
    slug: string;
    categoria: string | undefined;
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Lógica del Carrusel Automático al Hover
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && producto.imagenes.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % producto.imagenes.length);
      }, 1000);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, producto.imagenes.length]);

  return (
    <Link
      href={`/catalogo/${producto.slug}`}
      className="group relative flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- IMAGEN CON EFECTOS --- */}
      <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-2xl transition-all duration-500">

        {producto.imagenes.length > 0 ? (
          producto.imagenes.map((img, index) => (
            <img
              key={img}
              src={img}
              alt={producto.nombre}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${index === currentImageIndex
                ? 'opacity-100 scale-105'
                : 'opacity-0 scale-100'
                }`}
            />
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs tracking-widest">NO FOTO</div>
        )}

        {/* Overlay Gradiente en Hover */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* BADGES */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {producto.tieneDescuento && (
            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-md backdrop-blur-md shadow-lg flex items-center gap-1">
              {producto.porcentaje}% OFF
            </span>
          )}
          {producto.esNuevo && (
            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-md backdrop-blur-md shadow-lg">
              NUEVO
            </span>
          )}
          {producto.destacado && (
            <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-1 rounded-md backdrop-blur-md shadow-lg">
              ★ TOP
            </span>
          )}
          {producto.stock === 0 && (
            <span className="bg-slate-900/80 text-white text-[9px] font-black px-2 py-1 rounded-md backdrop-blur-md shadow-lg">
              AGOTADO
            </span>
          )}
        </div>

        {/* ACCIONES FLOTANTES (Solo en Hover) */}
        {producto.stock > 0 && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 pointer-events-auto">
            <button className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-colors shadow-lg active:scale-95">
              <ShoppingBag className="w-3.5 h-3.5" /> Agregar
            </button>
            <button className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-slate-900 transition-colors shadow-lg active:scale-95">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overlay Agotado */}
        {producto.stock === 0 && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
             <div className="bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">Agotado temporalmente</div>
          </div>
        )}
      </div>

      {/* --- INFO --- */}
      <div className="space-y-1">
        <h3 className="font-serif text-lg text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
          {producto.nombre}
        </h3>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          {producto.categoria || "Colección"}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="font-bold text-slate-900">
            {formatMoney(producto.precioFinal)}
          </span>
          {producto.tieneDescuento && (
            <span className="text-xs text-slate-400 line-through decoration-slate-300">
              {formatMoney(producto.precioOriginal)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
