"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Filter, X, Tag } from "lucide-react";

interface FiltrosProps {
  initialQ: string;
  initialEstado: string;
  initialTipo: string;
  initialDesde: string;
  initialHasta: string;
}

export default function FiltrosDescuentos({ 
  initialQ, initialEstado, initialTipo, initialDesde, initialHasta 
}: FiltrosProps) {
  const router = useRouter();
  
  const [q, setQ] = useState(initialQ);
  const [estado, setEstado] = useState(initialEstado);
  const [tipo, setTipo] = useState(initialTipo);
  const [desde, setDesde] = useState(initialDesde);
  const [hasta, setHasta] = useState(initialHasta);

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
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
      <div className="flex justify-between items-center pb-2 border-b border-gray-50">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Filter className="w-3 h-3" /> Filtros
        </h3>
        {hayFiltrosActivos && (
          <button onClick={limpiarFiltros} className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-0.5">
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <input
            className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-slate-900 outline-none transition-all"
            placeholder="Buscar campaña..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>

        {/* Estado */}
        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-gray-500 px-1 uppercase">Estado</label>
           <select 
             value={estado}
             onChange={(e) => setEstado(e.target.value)}
             className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer focus:border-slate-900"
           >
             <option value="">Cualquier estado</option>
             <option value="ACTIVO">Activos</option>
             <option value="PROGRAMADO">Programados</option>
             <option value="FINALIZADO">Finalizados</option>
             <option value="CANCELADO">Cancelados</option>
           </select>
        </div>

        {/* Tipo de Descuento */}
        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-gray-500 px-1 uppercase">Modalidad</label>
           <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setTipo(tipo === "PORCENTAJE" ? "" : "PORCENTAJE")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tipo === "PORCENTAJE" ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}
              >
                 % Porcentaje
              </button>
              <button 
                onClick={() => setTipo(tipo === "MONTO" ? "" : "MONTO")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${tipo === "MONTO" ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}
              >
                 S/ Monto
              </button>
           </div>
        </div>

        {/* Fechas */}
        <div className="space-y-2 pt-2 border-t border-gray-50">
           <label className="text-[10px] font-bold text-gray-500 px-1 uppercase">Rango de Inicio</label>
           <div className="grid grid-cols-2 gap-2">
             <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="w-full border border-gray-200 rounded-xl px-2 py-2 text-[11px] outline-none focus:border-slate-900" />
             <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="w-full border border-gray-200 rounded-xl px-2 py-2 text-[11px] outline-none focus:border-slate-900" />
           </div>
        </div>
      </div>
    </div>
  );
}