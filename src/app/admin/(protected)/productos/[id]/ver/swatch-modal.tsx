"use client";

import { useState } from "react";

type SwatchModalProps = {
  hex: string | null;
  nombre: string;
};

export function SwatchModal({ hex, nombre }: SwatchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Validación básica del hex
  const esHexValido = typeof hex === "string" && /^#([0-9a-fA-F]{6})$/.test(hex.trim());
  const bg = esHexValido ? hex!.trim() : null;
  const backgroundStyle = bg 
    ? { backgroundColor: bg } 
    : { background: "linear-gradient(to bottom right, #fff, #f3f4f6)" };

  return (
    <>
      {/* Trigger (El circulito pequeño) */}
      <button
        onClick={() => setIsOpen(true)}
        className="block w-6 h-6 rounded-full border border-gray-200 shadow-sm hover:scale-110 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
        style={backgroundStyle}
        title={`Ver color: ${nombre}`}
        type="button"
      />

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            
            {/* Header con botón cerrar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Detalle de Color</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center gap-6">
              {/* Gran visualizador de color */}
              <div 
                className="w-40 h-40 rounded-full shadow-inner border-4 border-white ring-1 ring-gray-200"
                style={backgroundStyle}
              />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Nombre del Color</p>
                <p className="text-2xl font-bold text-gray-900">{nombre}</p>
                
                <div className="flex items-center justify-center gap-2 mt-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                   <span className="text-gray-400 font-mono">#</span>
                   <span className="font-mono text-lg font-bold text-slate-700 uppercase">{bg ? bg.replace('#','') : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
          
          {/* Click fuera para cerrar */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}