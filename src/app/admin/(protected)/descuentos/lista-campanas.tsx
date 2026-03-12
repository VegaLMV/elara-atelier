"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Tag, Clock, Ban, Pencil, MoreHorizontal, X } from "lucide-react";

interface ProductoMini {
  id: string;
  nombre: string;
  imagen: string | null;
}

interface Campana {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: "PORCENTAJE" | "MONTO";
  valor: number;
  inicio: Date;
  fin: Date;
  estadoCalculado: string;
  productos: ProductoMini[];
}

export default function ListaCampanas({ campañas }: { campañas: Campana[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  const cancelarCampaña = async (id: string) => {
    if (!confirm("¿Estás seguro de cancelar esta campaña? Se revertirán los precios de los productos.")) return;
    try {
      setLoading(id);
      const res = await fetch("/api/admin/descuentos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error();
      toast.success("Campaña cancelada");
      router.refresh();
    } catch {
      toast.error("Error al cancelar");
    } finally {
      setLoading(null);
      setMenuAbierto(null);
    }
  };

  const formatFecha = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Lima',
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
    
    const parts = formatter.formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <div className="grid gap-4 md:gap-6">
        {campañas.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-2xl p-4 md:p-6 border transition-all hover:shadow-md relative ${
              c.estadoCalculado === 'ACTIVO' ? 'border-green-200' :
              c.estadoCalculado === 'CANCELADO' ? 'border-red-100 opacity-80' : 'border-gray-200'
            }`}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      c.estadoCalculado === 'ACTIVO' ? 'bg-green-100 text-green-700' :
                      c.estadoCalculado === 'PROGRAMADO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.estadoCalculado}
                    </span>
                    <span className="text-[10px] md:text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {c.tipo === 'PORCENTAJE' ? `-${c.valor}%` : `-S/ ${c.valor}`}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 truncate leading-tight">{c.nombre}</h3>
                  {c.descripcion && <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-1">{c.descripcion}</p>}
                </div>

                <div className="relative shrink-0">
                  <button onClick={() => setMenuAbierto(menuAbierto === c.id ? null : c.id)} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                  </button>
                  {menuAbierto === c.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(null)}></div>
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button
                          disabled={c.estadoCalculado === 'FINALIZADO' || c.estadoCalculado === 'CANCELADO'}
                          onClick={() => router.push(`/admin/descuentos/${c.id}`)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <Pencil className="h-4 w-4 text-blue-500" /> Editar
                        </button>
                        <div className="h-px bg-gray-100"></div>
                        <button
                          disabled={loading === c.id || c.estadoCalculado === 'FINALIZADO' || c.estadoCalculado === 'CANCELADO'}
                          onClick={() => cancelarCampaña(c.id)}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <Ban className="h-4 w-4" /> Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-xs md:text-sm text-gray-600 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatFecha(c.inicio)}</span>
                  </div>
                  <span className="text-gray-300">➜</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatFecha(c.fin)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    {c.productos.slice(0, 5).map((p, idx) => (
                      <div key={p.id + idx} className="relative w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shrink-0">
                        {p.imagen && <img src={p.imagen} alt="" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                    {c.productos.length > 5 && (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shrink-0">
                        +{c.productos.length - 5}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setCampanaSeleccionada(c); setImagenZoom(c.productos[0]?.imagen || null); }}
                    className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline px-2 py-1 bg-blue-50 rounded-lg"
                  >
                    Ver todo
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {campanaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            <div className="w-full md:w-1/2 bg-gray-100 p-4 md:p-8 flex items-center justify-center relative min-h-[250px]">
              {imagenZoom ? (
                <img src={imagenZoom} alt="Zoom" className="max-w-full max-h-[40vh] md:max-h-full object-contain rounded-xl shadow-lg" />
              ) : (
                <Tag className="w-16 h-16 opacity-10" />
              )}
              <button onClick={() => setCampanaSeleccionada(null)} className="absolute top-4 right-4 md:hidden bg-white/90 p-2 rounded-full shadow-md"><X className="w-5 h-5" /></button>
            </div>
            <div className="w-full md:w-1/2 flex flex-col h-full bg-white overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-gray-900 truncate">{campanaSeleccionada.nombre}</h2>
                  <p className="text-xs text-gray-500">
                    {campanaSeleccionada.tipo === 'PORCENTAJE' ? `Descuento: ${campanaSeleccionada.valor}%` : `Descuento: S/ ${campanaSeleccionada.valor}`}
                  </p>
                </div>
                <button onClick={() => setCampanaSeleccionada(null)} className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {campanaSeleccionada.productos.map((prod) => (
                  <div key={prod.id} onClick={() => setImagenZoom(prod.imagen)} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${imagenZoom === prod.imagen ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}>
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      {prod.imagen && <img src={prod.imagen} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-xs font-bold text-gray-700 truncate">{prod.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}