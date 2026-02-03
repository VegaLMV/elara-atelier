export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import FiltrosDescuentos from "./filtros-descuentos";
import ListaCampanas from "./lista-campanas"; // <--- IMPORTAMOS EL COMPONENTE CLIENTE

export const metadata = {
  title: "Campañas y Descuentos | Admin",
};

// Función auxiliar para calcular estado
function getEstadoCampaña(start: Date, end: Date, estadoDB: string) {
  if (estadoDB === "CANCELADO") return "CANCELADO";
  
  const ahora = new Date();
  // Ajuste de fin de día para comparación precisa (UTC-5 safe logic)
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

  // 1. Filtros de Búsqueda
  const where: any = {};
  if (q) {
    where.OR = [
      { nombreCampana: { contains: q, mode: "insensitive" } },
      { producto: { nombre: { contains: q, mode: "insensitive" } } }
    ];
  }

  // 2. Obtener datos crudos
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

  // 3. Lógica de Agrupación (Server Side)
  const campañasMap = new Map();

  for (const d of descuentosRaw) {
    // Usamos el nombre de campaña o generamos uno único basado en fechas/tipo
    const identificadorUnico = d.nombreCampana 
        ? `CAMPAÑA::${d.nombreCampana}::${d.startsAt.toISOString()}` 
        : `AUTO::${d.tipo}-${d.valor}-${d.startsAt.toISOString()}-${d.endsAt.toISOString()}`;

    if (!campañasMap.has(identificadorUnico)) {
      campañasMap.set(identificadorUnico, {
        idRef: d.id,
        nombre: d.nombreCampana || "Campaña General (Sin nombre)",
        descripcion: d.descripcion,
        tipo: d.tipo,
        valor: Number(d.valor),
        inicio: d.startsAt,
        fin: d.endsAt,
        // Calculamos el estado visual aquí en el servidor
        estadoCalculado: getEstadoCampaña(d.startsAt, d.endsAt, d.estado),
        idsDescuentos: [],
        productos: []
      });
    }

    const campaña = campañasMap.get(identificadorUnico);
    campaña.idsDescuentos.push(d.id);

    if (d.estado !== 'CANCELADO') {
        campaña.productos.push({
          id: d.id,
          productoId: d.producto.id,
          nombre: d.producto.nombre,
          imagen: d.producto.imagenes[0]?.url || null
        });
    }
  }

  // Convertimos a array para pasarlo al componente cliente
  const campañas = Array.from(campañasMap.values());

  // Stats rápidos
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
            {/* Componente Cliente para búsqueda */}
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

         {/* Lista Principal: Delegamos al Client Component */}
         <div className="lg:col-span-3 space-y-4">
            {/* Aquí usamos el componente que tiene la lógica de "Cancelar" */}
            <ListaCampanas campañas={campañas} />
         </div>
      </div>
    </div>
  );
}