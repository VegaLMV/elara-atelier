"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Calendar, Filter, X, Tag, ListFilter } from "lucide-react";

interface FiltrosProps {
  initialQ: string;
  initialEstado: string;
  initialTipo: string;
  initialDesde: string;
  initialHasta: string;
}

export default function FiltrosDescuentos({ 
  initialQ, 
  initialEstado, 
  initialTipo,
  initialDesde,
  initialHasta 
}: FiltrosProps) {
  const router = useRouter();
  
  const [q, setQ] = useState(initialQ);
  const [estado, setEstado] = useState(initialEstado);
  const [tipo, setTipo] = useState(initialTipo);
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);

  // Efecto Debounce para actualizar URL
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (estado) params.set("estado", estado);
      if (tipo) params.set("tipo", tipo);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      router.replace(`/admin/descuentos?${params.toString()}`);
    }, 400);
    return () => clearTimeout(t);
  }, [q, estado, tipo, desde, hasta, router]);

  const limpiarFiltros = () => {
    setQ(""); setEstado(""); setTipo(""); setDesde(""); setHasta("");
    router.replace("/admin/descuentos");
  };

  const hayFiltrosActivos = q || estado || tipo || desde || hasta;

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      
      {/* Header del Widget */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-800">
           <ListFilter className="w-4 h-4" />
           <span className="text-sm font-bold">Filtros</span>
        </div>
        {hayFiltrosActivos && (
          <button 
            onClick={limpiarFiltros}
            className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 hover:underline transition-all bg-red-50 px-2 py-1 rounded-full"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Grid Vertical (Stack) para Sidebar */}
      <div className="space-y-4">
        
        {/* 1. Búsqueda */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Nombre Campaña</label>
          <div className="relative">
            <input
              className="w-full border border-gray-200 bg-gray-50/50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400"
              placeholder="Nombre..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* 2. Estado */}
        <div>
           <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Estado</label>
           <div className="relative">
             <select 
               value={estado}
               onChange={(e) => setEstado(e.target.value)}
               className="w-full appearance-none border border-gray-200 bg-white rounded-xl pl-3 pr-8 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none cursor-pointer hover:border-gray-300 transition-colors"
             >
               <option value="">Todos los estados</option>
               <option value="ACTIVO">Activos</option>
               <option value="PROGRAMADO">Programados</option>
               <option value="FINALIZADO">Finalizados</option>
               <option value="CANCELADO">Cancelados</option>
             </select>
             <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
           </div>
        </div>

        {/* 3. Tipo */}
        <div>
           <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Tipo</label>
           <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setTipo(tipo === "PORCENTAJE" ? "" : "PORCENTAJE")}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg border transition-all ${tipo === "PORCENTAJE" ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                 <Tag className="w-3 h-3" /> % Porcentaje
              </button>
              <button 
                onClick={() => setTipo(tipo === "MONTO" ? "" : "MONTO")}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg border transition-all ${tipo === "MONTO" ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                 <span className="font-serif italic font-bold">S/</span> Monto
              </button>
           </div>
        </div>

        {/* 4. Fechas */}
        <div className="pt-2 border-t border-gray-100">
           <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Rango de Fechas</label>
           <div className="grid grid-cols-2 gap-2">
             <div className="relative">
               <input 
                 type="date"
                 value={desde}
                 onChange={(e) => setDesde(e.target.value)}
                 className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:border-slate-900 outline-none"
               />
               <span className="absolute -top-1.5 left-2 bg-white px-1 text-[8px] text-gray-400">Desde</span>
             </div>
             <div className="relative">
               <input 
                 type="date"
                 value={hasta}
                 onChange={(e) => setHasta(e.target.value)}
                 className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:border-slate-900 outline-none"
               />
               <span className="absolute -top-1.5 left-2 bg-white px-1 text-[8px] text-gray-400">Hasta</span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}