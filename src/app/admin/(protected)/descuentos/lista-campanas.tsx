"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Calendar, 
  Tag, 
  Clock, 
  Ban,
  Pencil,
  MoreHorizontal,
  X,
  Search
} from "lucide-react";

interface ProductoMini {
  id: string;
  nombre: string;
  imagen: string | null;
}

interface Campana {
  idRef: string;
  nombre: string;
  descripcion: string | null;
  tipo: "PORCENTAJE" | "MONTO";
  valor: number;
  inicio: Date;
  fin: Date;
  estadoCalculado: "ACTIVO" | "PROGRAMADO" | "FINALIZADO" | "CANCELADO";
  idsDescuentos: string[];
  productos: ProductoMini[];
}

export default function ListaCampanas({ campañas }: { campañas: Campana[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  
  const [campanaSeleccionada, setCampanaSeleccionada] = useState<Campana | null>(null);
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  // --- LÓGICA DE ORDENAMIENTO ---
  const campañasOrdenadas = [...campañas].sort((a, b) => {
    // 1. Prioridad absoluta: Estado ACTIVO
    const esActivoA = a.estadoCalculado === 'ACTIVO';
    const esActivoB = b.estadoCalculado === 'ACTIVO';

    if (esActivoA && !esActivoB) return -1; // A va primero
    if (!esActivoA && esActivoB) return 1;  // B va primero

    // 2. Secundaria: Fecha de Inicio Descendente (Lo más nuevo/futuro arriba)
    // Esto asegura que PROGRAMADO salga antes que FINALIZADO, y los finalizados recientes antes que los antiguos.
    return new Date(b.inicio).getTime() - new Date(a.inicio).getTime();
  });

  const cancelarCampaña = async (ids: string[]) => {
    if (!confirm("¿Estás seguro de cancelar esta campaña?")) return;
    try {
      setLoading(ids[0]);
      const res = await fetch("/api/admin/descuentos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
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

  return (
    <>
      <div className="grid gap-6">
        {campañasOrdenadas.map((c) => (
          <div 
            key={c.idRef} 
            className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-md relative ${
              c.estadoCalculado === 'ACTIVO' ? 'border-green-200 shadow-green-50/50' : 
              c.estadoCalculado === 'CANCELADO' ? 'border-red-100 opacity-75' : 
              c.estadoCalculado === 'FINALIZADO' ? 'border-gray-100 opacity-60' :
              'border-blue-100'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                
                {/* Header Tarjeta */}
                <div className="flex items-start justify-between">
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.estadoCalculado === 'ACTIVO' ? 'bg-green-100 text-green-700' :
                          c.estadoCalculado === 'PROGRAMADO' ? 'bg-blue-100 text-blue-700' :
                          c.estadoCalculado === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.estadoCalculado}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {c.tipo === 'PORCENTAJE' ? `-${c.valor}%` : `-S/ ${c.valor}`}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{c.nombre}</h3>
                      {c.descripcion && <p className="text-sm text-gray-500 mt-1">{c.descripcion}</p>}
                  </div>
                  
                  {/* Menú Acciones */}
                  <div className="relative">
                    <button onClick={() => setMenuAbierto(menuAbierto === c.idRef ? null : c.idRef)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    </button>
                    {menuAbierto === c.idRef && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(null)}></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button
                            disabled={c.estadoCalculado === 'FINALIZADO'}
                            onClick={() => router.push(`/admin/descuentos/${c.idRef}`)}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" /> Editar
                          </button>
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button
                            disabled={loading === c.idRef || c.estadoCalculado === 'FINALIZADO' || c.estadoCalculado === 'CANCELADO'}
                            onClick={() => cancelarCampaña(c.idsDescuentos)}
                            className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" /> Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Fechas */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(c.inicio).toLocaleDateString()}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{new Date(c.fin).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Lista Mini de Productos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Productos ({c.productos.length})
                    </p>
                    <button 
                      onClick={() => { setCampanaSeleccionada(c); setImagenZoom(c.productos[0]?.imagen || null); }}
                      className="text-[10px] text-blue-600 font-medium hover:underline"
                    >
                      Ver detalles
                    </button>
                  </div>
                  <div className="flex -space-x-2 overflow-hidden py-1">
                    {c.productos.slice(0, 8).map((p, idx) => (
                      <button 
                        key={p.id + idx} 
                        onClick={() => { setCampanaSeleccionada(c); setImagenZoom(p.imagen); }}
                        className="relative w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden hover:scale-110 transition-transform hover:z-10 focus:outline-none" 
                        title={p.nombre}
                      >
                        {p.imagen ? (
                          <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">IMG</div>
                        )}
                      </button>
                    ))}
                    {c.productos.length > 8 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +{c.productos.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {campañasOrdenadas.length === 0 && (
           <div className="text-center py-12 text-gray-400">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay campañas registradas.</p>
           </div>
        )}
      </div>

      {/* MODAL */}
      {campanaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            <div className="w-full md:w-1/2 bg-gray-100 p-8 flex items-center justify-center relative min-h-[300px]">
              {imagenZoom ? (
                <img src={imagenZoom} alt="Zoom" className="max-w-full max-h-[50vh] md:max-h-full object-contain rounded-lg shadow-sm" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Tag className="w-16 h-16 mb-2 opacity-20" />
                  <p className="text-sm">Sin imagen disponible</p>
                </div>
              )}
              <button 
                onClick={() => setCampanaSeleccionada(null)}
                className="absolute top-4 right-4 md:hidden bg-white/80 p-2 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full md:w-1/2 flex flex-col h-full bg-white">
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{campanaSeleccionada.nombre}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {campanaSeleccionada.tipo === 'PORCENTAJE' ? `Descuento del ${campanaSeleccionada.valor}%` : `Descuento de S/ ${campanaSeleccionada.valor}`}
                  </p>
                </div>
                <button 
                  onClick={() => setCampanaSeleccionada(null)}
                  className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-2">
                  Productos Incluidos ({campanaSeleccionada.productos.length})
                </p>
                {campanaSeleccionada.productos.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => setImagenZoom(prod.imagen)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${imagenZoom === prod.imagen ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-10 h-10 rounded-md bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                      {prod.imagen ? (
                        <img src={prod.imagen} alt="" className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[8px]">IMG</div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {prod.nombre}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                <button 
                   onClick={() => router.push(`/admin/descuentos/${campanaSeleccionada.idRef}`)}
                   disabled={campanaSeleccionada.estadoCalculado === 'FINALIZADO'}
                   className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  Editar Campaña Completa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}