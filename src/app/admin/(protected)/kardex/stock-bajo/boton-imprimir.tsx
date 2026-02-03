"use client"; // <--- Esto es lo que permite usar onClick

export default function BotonImprimir() {
  return (
    <button 
      type="button"
      onClick={() => window.print()}
      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
    >
       <span>🖨️</span> Imprimir Reporte
    </button>
  );
}