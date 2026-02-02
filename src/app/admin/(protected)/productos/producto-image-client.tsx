"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  id: string;
  nombre: string;
  src: string | null;
  precioDisplay: string;
  stock: number;
};

export default function ProductoImageClient({ id, nombre, src, precioDisplay, stock }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="w-full h-full cursor-zoom-in relative group"
        onClick={() => setIsOpen(true)}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={src} 
            alt={nombre} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs bg-gray-50">Sin foto</div>
        )}
        
        {/* Overlay sutil al pasar el mouse indicando que es clicable */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
           <span className="bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded shadow-sm text-gray-700 font-medium">Ver</span>
        </div>
      </div>

      {/* --- MODAL / MINI VENTANA --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
        >
           <div 
             className="bg-white p-5 rounded-2xl shadow-2xl max-w-sm w-full relative flex flex-col gap-4 animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Botón Cerrar */}
              <button 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors z-10" 
                onClick={() => setIsOpen(false)}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {/* Imagen en Grande */}
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative border shadow-inner">
                 {src ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={src} alt={nombre} className="w-full h-full object-contain mix-blend-multiply" />
                 ) : (
                   <div className="flex items-center justify-center h-full text-gray-400">Sin imagen</div>
                 )}
              </div>

              {/* Info Rápida */}
              <div>
                 <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">{nombre}</h3>
                 <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold border border-green-100">
                       {precioDisplay}
                    </span>
                    <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs">
                       Stock: <b className="text-gray-900">{stock}</b>
                    </span>
                 </div>
              </div>

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-gray-100">
                 <Link 
                   href={`/admin/productos/${id}/ver/`}
                   className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium transition-colors border border-gray-200"
                 >
                    👁️ Ver Detalle
                 </Link>
                 <Link 
                   href={`/admin/productos/${id}`}
                   className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors shadow-md"
                 >
                    ✏️ Editar
                 </Link>
              </div>
           </div>
        </div>
      )}
    </>
  );
}