"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Filter, RotateCcw, Calendar } from "lucide-react";

type TipoKardex = "TODOS" | "COMPRA" | "VENTA" | "AJUSTE" | "DEVOLUCION";

/**
 * ============================================================================
 * COMPONENTE: FILTROS AVANZADOS DE KARDEX
 * ============================================================================
 * Permite filtrar el historial por texto, tipo de movimiento y rangos de fecha.
 */
export default function FiltrosKardex({
  initial,
}: {
  initial: {
    q: string;
    tipo: TipoKardex;
    from: string;
    to: string;
  };
}) {
  const router = useRouter();

  const [q, setQ] = useState(initial.q || "");
  const [tipo, setTipo] = useState<TipoKardex>(initial.tipo || "TODOS");
  const [from, setFrom] = useState(initial.from || "");
  const [to, setTo] = useState(initial.to || "");

  function aplicar() {
    const sp = new URLSearchParams();

    if (q.trim()) sp.set("q", q.trim());
    if (tipo && tipo !== "TODOS") sp.set("tipo", tipo);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);

    sp.set("page", "1");

    const qs = sp.toString();
    router.push(qs ? `/admin/kardex?${qs}` : "/admin/kardex");
  }

  function limpiar() {
    setQ("");
    setTipo("TODOS");
    setFrom("");
    setTo("");
    router.push("/admin/kardex");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
         <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" /> Filtros de Búsqueda
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
        
        {/* Buscador Textual */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Buscar Referencia</label>
          <div className="relative group">
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-slate-800 transition-colors" />
             <input
               className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400 font-medium"
               placeholder="Producto, SKU o nota..."
               value={q}
               onChange={(e) => setQ(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && aplicar()}
             />
          </div>
        </div>

        {/* Tipo Movimiento */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tipo</label>
          <div className="relative">
              <select 
                 className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all cursor-pointer appearance-none font-medium"
                 value={tipo} 
                 onChange={(e) => setTipo(e.target.value as any)}
              >
                <option value="TODOS">Todos</option>
                <option value="COMPRA">Compras</option>
                <option value="VENTA">Ventas</option>
                <option value="AJUSTE">Ajustes</option>
                <option value="DEVOLUCION">Devoluciones</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="md:col-span-4 grid grid-cols-2 gap-3">
           <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Desde</label>
             <div className="relative">
                 <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                 <input 
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium" 
                    type="date" 
                    value={from} 
                    onChange={(e) => setFrom(e.target.value)} 
                 />
             </div>
           </div>
           <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Hasta</label>
             <div className="relative">
                 <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                 <input 
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium" 
                    type="date" 
                    value={to} 
                    onChange={(e) => setTo(e.target.value)} 
                 />
             </div>
           </div>
        </div>

        {/* Botones */}
        <div className="md:col-span-2 flex items-center gap-2 pb-0.5">
          <button 
             type="button" 
             className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
             onClick={aplicar}
          >
            Filtrar
          </button>
          <button 
             type="button" 
             className="px-3 py-2.5 border border-gray-200 bg-white rounded-xl text-gray-500 hover:bg-gray-50 hover:text-slate-900 hover:border-gray-300 transition-colors shadow-sm"
             onClick={limpiar}
             title="Limpiar filtros"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}