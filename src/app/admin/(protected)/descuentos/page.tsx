import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import FiltrosDescuentos from "./filtros-descuentos";
import ListaCampanas from "./lista-campanas"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campañas y Descuentos | Admin",
};

// --- NUEVO: Función de Sincronización Automática ---
// Esta función se ejecutará cada vez que cargues la página de administración
// para asegurar que la BD refleje el estado real de las fechas.
async function sincronizarEstados() {
  const now = new Date();
  
  try {
    // 1. ACTIVAR: Buscar campañas "PROGRAMADAS" que ya deberían haber empezado
    const porActivar = await prisma.descuentoProducto.findMany({
      where: { 
        estado: "PROGRAMADO", 
        startsAt: { lte: now }, 
        endsAt: { gte: now } 
      }
    });

    for (const d of porActivar) {
      // A. Cambiar estado a ACTIVO en la campaña
      await prisma.descuentoProducto.update({ 
        where: { id: d.id }, 
        data: { estado: "ACTIVO" } 
      });

      // B. Reflejar datos en el PRODUCTO (Esto hace que aparezca la etiqueta en la tienda)
      await prisma.producto.update({
        where: { id: d.productoId },
        data: {
          descuentoActivo: true,
          descuentoTipo: d.tipo,
          descuentoValor: Number(d.valor),
          descuentoInicio: d.startsAt,
          descuentoFin: d.endsAt,
          descuentoActualId: d.id
        }
      });
    }

    // 2. FINALIZAR: Buscar campañas "ACTIVAS" que ya vencieron
    const porFinalizar = await prisma.descuentoProducto.findMany({
      where: { 
        estado: "ACTIVO", 
        endsAt: { lt: now } 
      }
    });

    for (const d of porFinalizar) {
      // A. Cambiar estado a FINALIZADO
      await prisma.descuentoProducto.update({ 
        where: { id: d.id }, 
        data: { estado: "FINALIZADO" } 
      });
      
      // B. Limpiar el producto (solo si no tiene ya otra campaña más nueva superpuesta)
      const prod = await prisma.producto.findUnique({ 
          where: { id: d.productoId },
          select: { descuentoActualId: true }
      });
      
      // Si el producto sigue apuntando a esta campaña vieja, lo limpiamos
      if (prod?.descuentoActualId === d.id) {
          await prisma.producto.update({
            where: { id: d.productoId },
            data: {
                descuentoActivo: false,
                descuentoTipo: null,
                descuentoValor: null,
                descuentoInicio: null,
                descuentoFin: null,
                descuentoActualId: null
            }
          });
      }
    }
  } catch (error) {
    console.error("Error en sincronización automática:", error);
    // No lanzamos error para no bloquear la carga de la página, solo logueamos
  }
}

// Función auxiliar para calcular estado visual
function getEstadoCampaña(start: Date, end: Date, estadoDB: string) {
  if (estadoDB === "CANCELADO") return "CANCELADO";
  
  const ahora = new Date();
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

  // 🔥 EJECUTAR SINCRONIZACIÓN ANTES DE CARGAR DATOS 🔥
  // Esto arregla el problema: actualiza la BD justo antes de que veas la lista.
  await sincronizarEstados();

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
            <ListaCampanas campañas={campañas} />
         </div>
      </div>
    </div>
  );
}