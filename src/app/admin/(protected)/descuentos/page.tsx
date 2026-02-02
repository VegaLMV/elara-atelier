export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import FiltrosDescuentos from "./filtros-descuentos";

export const metadata = {
  title: "Campañas y Descuentos | Admin",
};

// Función para determinar el estado visual de una campaña
function getEstadoCampaña(start: Date, end: Date, estadoDB: string) {
  if (estadoDB === "CANCELADO") return "CANCELADO";
  
  const ahora = new Date();
  
  // Ajuste de fin de día para comparación precisa (UTC-5 safe)
  const finAjustado = new Date(end);
  finAjustado.setHours(23, 59, 59, 999);

  if (start > ahora) return "PROGRAMADO";
  if (finAjustado < ahora) return "FINALIZADO";
  
  return "ACTIVO";
}

type SP = { q?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  // 1. Construir filtro de Prisma (Búsqueda por nombre de campaña o producto)
  const where: any = {};
  if (q) {
    where.OR = [
      { nombreCampana: { contains: q, mode: "insensitive" } },
      { producto: { nombre: { contains: q, mode: "insensitive" } } }
    ];
  }

  // 2. Obtener descuentos (filtrados)
  const descuentosRaw = await prisma.descuentoProducto.findMany({
    where,
    take: 500, 
    orderBy: { creadoEn: "desc" },
    include: {
      producto: {
        select: { id: true, nombre: true, imagenes: { take: 1, orderBy: { esPortada: 'desc' } } }
      }
    }
  });

  // 3. Lógica de Agrupación (Simular Campañas)
  const campañasMap = new Map();

  for (const d of descuentosRaw) {
    // Clave de agrupación: Prioriza el NOMBRE DE CAMPAÑA si existe
    // Si es un descuento antiguo sin nombre, agrupa por características (tipo, valor, fechas)
    const identificadorUnico = d.nombreCampana 
        ? `CAMPAÑA::${d.nombreCampana}::${d.startsAt.toISOString()}` 
        : `AUTO::${d.tipo}-${d.valor}-${d.startsAt.toISOString()}-${d.endsAt.toISOString()}`;

    if (!campañasMap.has(identificadorUnico)) {
      campañasMap.set(identificadorUnico, {
        idRef: d.id, // ID de referencia
        // ✅ Usamos el nombre real o un fallback
        nombre: d.nombreCampana || "Campaña General (Sin nombre)",
        // ✅ Usamos la descripción real
        descripcion: d.descripcion,
        tipo: d.tipo,
        valor: Number(d.valor),
        inicio: d.startsAt,
        fin: d.endsAt,
        estadoDB: d.estado,
        estadoCalculado: getEstadoCampaña(d.startsAt, d.endsAt, d.estado),
        idsDescuentos: [], // IDs para acciones en lote
        productos: []
      });
    }

    const campaña = campañasMap.get(identificadorUnico);
    
    // Agregamos el ID para futuras acciones masivas
    campaña.idsDescuentos.push(d.id);

    // Agregamos el producto a la lista visual si no está cancelado individualmente
    // (Opcional: podrías mostrar los cancelados con otro estilo)
    if (d.estado !== 'CANCELADO') {
        campaña.productos.push({
          id: d.id, // ID del descuento específico
          productoId: d.producto.id,
          nombre: d.producto.nombre,
          imagen: d.producto.imagenes[0]?.url || null
        });
    }
  }

  // Convertimos el mapa a array para renderizar
  const campañas = Array.from(campañasMap.values());

  const stats = {
      activas: campañas.filter(c => c.estadoCalculado === 'ACTIVO').length,
      programadas: campañas.filter(c => c.estadoCalculado === 'PROGRAMADO').length,
      totalProds: descuentosRaw.filter(d => d.estado !== 'CANCELADO').length
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campañas y Descuentos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona ofertas masivas y promociones de temporada.</p>
        </div>
        <Link
          href="/admin/descuentos/nuevo"
          className="bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-bold hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span>✨</span> Nueva Campaña
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
         
         {/* Sidebar: Filtros y Stats */}
         <div className="lg:col-span-1 space-y-6 sticky top-6">
            <FiltrosDescuentos initialQ={q} />
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resumen</h3>
               
               <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Activas</span>
                  <span className="text-lg font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">{stats.activas}</span>
               </div>
               <div className="w-full h-px bg-gray-100"></div>
               <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Programadas</span>
                  <span className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{stats.programadas}</span>
               </div>
               <div className="w-full h-px bg-gray-100"></div>
               <div className="pt-1">
                   <p className="text-xs text-gray-400">Total productos en oferta</p>
                   <p className="text-2xl font-bold text-slate-900">{stats.totalProds}</p>
               </div>
            </div>
         </div>

         {/* Lista Principal */}
         <div className="lg:col-span-3 space-y-4">
            {campañas.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
                    <span className="text-5xl opacity-20 mb-4">🏷️</span>
                    <p className="text-lg text-gray-600 font-medium">No se encontraron campañas.</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {q ? "Intenta con otros términos de búsqueda." : "Crea tu primera oferta masiva para empezar."}
                    </p>
                </div>
            ) : (
                campañas.map((c, idx) => (
                    <details 
                        key={idx} 
                        className={`group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all open:ring-2 open:ring-slate-900/5 ${c.estadoCalculado === 'CANCELADO' ? 'opacity-60' : ''}`}
                    >
                    
                        {/* Resumen de la Campaña (Header) */}
                        <summary className="list-none cursor-pointer p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                            <div className="flex items-start gap-4">
                                {/* Icono Tipo */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-sm flex-shrink-0 ${
                                    c.estadoCalculado === 'ACTIVO' ? 'bg-green-500' : 
                                    c.estadoCalculado === 'PROGRAMADO' ? 'bg-blue-500' : 
                                    c.estadoCalculado === 'CANCELADO' ? 'bg-red-400' : 'bg-gray-400'
                                }`}>
                                    {c.tipo === "PORCENTAJE" ? "%" : "S/"}
                                </div>

                                <div>
                                    {/* ✅ Título de la Campaña */}
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center flex-wrap gap-2">
                                        {c.nombre}
                                        <span className="text-gray-400 font-normal text-sm bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                            {c.productos.length} prods.
                                        </span>
                                    </h3>
                                    
                                    {/* ✅ Descripción de la Campaña */}
                                    {c.descripcion && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-md">{c.descripcion}</p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                                        <span className="font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-xs">
                                           {c.tipo === "PORCENTAJE" ? `-${c.valor}%` : `-S/ ${c.valor}`}
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-xs bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <span>📅</span> {new Date(c.inicio).toLocaleDateString()} 
                                            <span className="text-gray-300">➜</span> 
                                            {new Date(c.fin).toLocaleDateString()}
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

                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider group-open:text-slate-900 transition-colors self-end sm:self-center">
                                <span>Ver Productos</span>
                                <span className="transform group-open:rotate-180 transition-transform text-lg leading-none">▾</span>
                            </div>
                        </summary>

                        {/* Lista Detallada de Productos */}
                        <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {c.productos.map((prod: any) => (
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
                                            <p className="text-[10px] text-gray-400 group-hover/item:text-blue-500 transition-colors">Editar producto →</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            
                            {/* Footer de la tarjeta con nota informativa */}
                            {c.estadoCalculado !== 'CANCELADO' && c.estadoCalculado !== 'FINALIZADO' && (
                                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                                    <p className="text-xs text-gray-400 italic flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                        💡 Tip: Para cancelar productos específicos, entra a su ficha individual.
                                    </p>
                                </div>
                            )}
                        </div>

                    </details>
                ))
            )}
         </div>
      </div>
    </div>
  );
}