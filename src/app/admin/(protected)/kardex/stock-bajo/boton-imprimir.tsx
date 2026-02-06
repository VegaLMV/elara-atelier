"use client";

import { Printer } from "lucide-react";

export default function BotonImprimir() {
  return (
    <button 
      type="button"
      onClick={() => window.print()}
      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95 print:hidden"
    >
       <Printer className="w-4 h-4" />
       <span>Imprimir Reporte</span>
    </button>
  );
}