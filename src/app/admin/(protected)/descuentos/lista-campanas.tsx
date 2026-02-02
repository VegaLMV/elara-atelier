"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Tipos adaptados para la vista
type CampanaVisual = {
  idRef: string; // ID de referencia (primer descuento del grupo)
  nombre: string;
  descripcion?: string | null;
  tipo: "PORCENTAJE" | "MONTO";
  valor: number;
  inicio: Date;
  fin: Date;
  estadoCalculado: "ACTIVO" | "PROGRAMADO" | "FINALIZADO" | "CANCELADO";
  // Lista de IDs de descuentos individuales que componen esta campaña
  idsDescuentos: string[]; 
  productos: Array<{
    id: string; // ID del descuento individual
    productoId: string;
    nombre: string;
    imagen: string | null;
  }>;
};

export default function ListaCampanas({ campañas }: { campañas: CampanaVisual[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function cancelarCampaña(campaña: CampanaVisual) {
    if (!confirm(`¿Estás seguro de CANCELAR la campaña "${campaña.nombre}"?\n\nEsto desactivará el descuento en ${campaña.productos.length} productos.`)) {
      return;
    }

    setLoadingId(campaña.idRef);

    try {
      const res = await fetch("/api/admin/descuentos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: campaña.idsDescuentos }),
      });

      if (!res.ok) throw new Error("Error al cancelar");
      
      router.refresh();
      alert("Campaña cancelada correctamente.");
    } catch (error) {
      alert("No se pudo cancelar la campaña.");
    } finally {
      setLoadingId(null);
    }
  }

  if (campañas.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
        <span className="text-5xl opacity-20 mb-4">🏷️</span>
        <p className="text-lg text-gray-600 font-medium">No se encontraron campañas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campañas.map((c, idx) => (
        <details 
          key={c.idRef + idx} 
          className={`group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all open:ring-2 open:ring-slate-900/5 ${c.estadoCalculado === 'CANCELADO' ? 'opacity-60' : ''}`}
        >
          {/* HEADER DE LA TARJETA */}
          <summary className="list-none cursor-pointer p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm flex-shrink-0 ${
                  c.estadoCalculado === 'ACTIVO' ? 'bg-green-500' : 
                  c.estadoCalculado === 'PROGRAMADO' ? 'bg-blue-500' : 
                  c.estadoCalculado === 'CANCELADO' ? 'bg-red-400' : 'bg-gray-400'
              }`}>
                  {c.tipo === "PORCENTAJE" ? "%" : "S/"}
              </div>

              <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center flex-wrap gap-2">
                      {c.nombre}
                      <span className="text-gray-400 font-normal text-sm bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          {c.productos.length} prods.
                      </span>
                  </h3>
                  
                  {c.descripcion && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{c.descripcion}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                      <span className="font-bold text-slate-700">
                         {c.tipo === "PORCENTAJE" ? `-${c.valor}%` : `-S/ ${c.valor}`}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          {new Date(c.inicio).toLocaleDateString()} ➜ {new Date(c.fin).toLocaleDateString()}
                      </span>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          c.estadoCalculado === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-100' :
                          c.estadoCalculado === 'PROGRAMADO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          c.estadoCalculado === 'CANCELADO' ? 'bg-red-50 text-red-700 border-red-100 line-through' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                          {c.estadoCalculado}
                      </span>
                  </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
               {/* BOTÓN CANCELAR DIRECTO */}
               {c.estadoCalculado !== 'CANCELADO' && c.estadoCalculado !== 'FINALIZADO' && (
                 <button
                    onClick={(e) => {
                      e.preventDefault(); // Evita que se abra/cierre el details
                      cancelarCampaña(c);
                    }}
                    disabled={loadingId === c.idRef}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-medium hover:bg-red-100 transition-colors z-10"
                 >
                    {loadingId === c.idRef ? "Cancelando..." : "Cancelar Campaña"}
                 </button>
               )}

               <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider group-open:text-slate-900 transition-colors">
                  <span>Detalles</span>
                  <span className="transform group-open:rotate-180 transition-transform text-lg leading-none">▾</span>
               </div>
            </div>
          </summary>

          {/* CONTENIDO DETALLADO */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                 {c.productos.map((prod) => (
                    <Link 
                        key={prod.id} 
                        href={`/admin/productos/${prod.productoId}`}
                        className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group/item"
                    >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-gray-100">
                            {prod.imagen ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={prod.imagen} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📷</div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate group-hover/item:text-slate-900">{prod.nombre}</p>
                            <p className="text-[10px] text-gray-400 group-hover/item:text-blue-500 transition-colors">Ver producto →</p>
                        </div>
                    </Link>
                 ))}
             </div>
          </div>

        </details>
      ))}
    </div>
  );
}