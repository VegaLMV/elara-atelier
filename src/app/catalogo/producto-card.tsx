"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
  };
};

export default function ProductoCard({ producto }: ProductoCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Lógica del Carrusel Automático
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isHovered && producto.imagenes.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % producto.imagenes.length);
      }, 1200); // Cambia cada 1.2 segundos
    } else {
      // Al salir del hover, volvemos a la portada (índice 0)
      setCurrentImageIndex(0);
    }

    return () => clearInterval(interval);
  }, [isHovered, producto.imagenes.length]);

  // Formateador
  const soles = (v: number) => `S/ ${v.toFixed(2)}`;

  return (
    <Link 
      href={`/catalogo/${producto.slug}`}
      className="group flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenedor Imagen */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 rounded-xl mb-3 shadow-sm group-hover:shadow-md transition-all duration-500">
        
        {producto.imagenes.length > 0 ? (
          <>
            {/* Renderizamos la imagen activa con efecto de transición */}
            {producto.imagenes.map((img, index) => (
                <img 
                  key={img}
                  src={img} 
                  alt={`${producto.nombre} - vista ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                    index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
                />
            ))}
            
            {/* Indicadores de Carrusel (Puntos) - Solo si hay hover y más de 1 foto */}
            {isHovered && producto.imagenes.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 animate-in fade-in slide-in-from-bottom-2">
                    {producto.imagenes.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1 rounded-full transition-all duration-300 ${
                                idx === currentImageIndex ? 'w-4 bg-slate-900' : 'w-1.5 bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs uppercase tracking-widest">Sin foto</div>
        )}
        
        {/* Etiqueta de Oferta */}
        {producto.tieneDescuento && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-md tracking-wider transform transition-transform group-hover:scale-105 z-20">
            {producto.porcentaje ? `-${producto.porcentaje}% OFF` : 'OFERTA'}
          </div>
        )}
      </div>

      {/* Info Producto */}
      <div className="space-y-1 relative z-20 bg-white">
        <h2 className="text-slate-900 font-medium text-sm group-hover:underline decoration-slate-300 underline-offset-4 decoration-1 transition-all leading-tight line-clamp-1">
          {producto.nombre}
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-bold ${producto.tieneDescuento ? 'text-red-600' : 'text-slate-900'}`}>
              {soles(producto.precioFinal)}
          </span>
          {producto.tieneDescuento && (
            <span className="text-slate-400 line-through text-xs decoration-slate-300">
              {soles(producto.precioOriginal)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}