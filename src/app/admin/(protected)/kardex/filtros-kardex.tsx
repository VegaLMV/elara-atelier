"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TipoKardex = "TODOS" | "COMPRA" | "VENTA" | "AJUSTE" | "DEVOLUCION";

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

    // reset paginación al filtrar
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <span>🔍</span> Filtros de Búsqueda
         </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Buscador Textual */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buscar</label>
          <div className="relative">
             <input
               className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400"
               placeholder="Producto / SKU / Nota..."
               value={q}
               onChange={(e) => setQ(e.target.value)}
             />
             <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Tipo Movimiento */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</label>
          <select 
             className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all cursor-pointer" 
             value={tipo} 
             onChange={(e) => setTipo(e.target.value as any)}
          >
            <option value="TODOS">Todos</option>
            <option value="COMPRA">Compras</option>
            <option value="VENTA">Ventas</option>
            <option value="AJUSTE">Ajustes</option>
            <option value="DEVOLUCION">Devoluciones</option>
          </select>
        </div>

        {/* Fechas */}
        <div className="md:col-span-4 grid grid-cols-2 gap-3">
           <div className="space-y-1.5">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Desde</label>
             <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all" 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
             />
           </div>
           <div className="space-y-1.5">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hasta</label>
             <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all" 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
             />
           </div>
        </div>

        {/* Botones */}
        <div className="md:col-span-2 flex items-end gap-2">
          <button 
             type="button" 
             className="flex-1 bg-slate-900 text-white rounded-lg px-4 py-2.5 font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]" 
             onClick={aplicar}
          >
            Filtrar
          </button>
          <button 
             type="button" 
             className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors" 
             onClick={limpiar}
             title="Limpiar filtros"
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}