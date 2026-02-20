import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import FiltrosDescuentos from "./filtros-descuentos";
import ListaCampanas from "./lista-campanas";
import { Zap } from "lucide-react";
import Pagination from "@/components/ui/pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campañas y Descuentos | Admin",
};

// --- FUNCIÓN CRÍTICA: Sincronización Automática (Versión Campana) ---
async function sincronizarEstados() {
  const now = new Date();

  try {
    // 1. ACTIVAR: Campañas "PROGRAMADAS" que ya llegaron a su fecha de inicio
    const porActivar = await prisma.campana.findMany({
      where: {
        estado: "PROGRAMADO",
        startsAt: { lte: now },
        endsAt: { gte: now }
      },
      include: { detalles: true }
    });

    for (const c of porActivar) {
      // A. Activar Campaña Padre
      await prisma.campana.update({ where: { id: c.id }, data: { estado: "ACTIVO" } });

      // B. Reflejar en Productos
      const pids = c.detalles.map(d => d.productoId);
      if (pids.length > 0) {
        await prisma.producto.updateMany({
          where: { id: { in: pids } },
          data: {
            descuentoActivo: true,
            descuentoTipo: c.tipo,
            descuentoValor: Number(c.valor),
            descuentoInicio: c.startsAt,
            descuentoFin: c.endsAt
          }
        });
      }
    }

    // 2. FINALIZAR: Campañas "ACTIVAS" que ya vencieron
    const porFinalizar = await prisma.campana.findMany({
      where: {
        estado: "ACTIVO",
        endsAt: { lt: now }
      },
      include: { detalles: true }
    });

    for (const c of porFinalizar) {
      // A. Finalizar Campaña Padre
      await prisma.campana.update({ where: { id: c.id }, data: { estado: "FINALIZADO" } });

      // B. Limpiar Productos (Solo si siguen activos para evitar pisar campañas nuevas)
      const pids = c.detalles.map(d => d.productoId);
      if (pids.length > 0) {
        await prisma.producto.updateMany({
          where: { id: { in: pids }, descuentoActivo: true },
          data: {
            descuentoActivo: false,
            descuentoTipo: null,
            descuentoValor: null,
            descuentoInicio: null,
            descuentoFin: null
          }
        });
      }
    }
  } catch (error) {
    console.error("Error en sincronización automática:", error);
  }
}

type SearchParams = {
  q?: string;
  estado?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams & { page?: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // 🔥 EJECUTAR SINCRONIZACIÓN 🔥
  await sincronizarEstados();

  // Leer parámetros
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const estado = sp.estado ?? "";
  const tipo = sp.tipo ?? "";
  const desde = sp.desde ?? "";
  const hasta = sp.hasta ?? "";
  const currentPage = Number(sp.page) || 1;
  const ITEMS_PER_PAGE = 25;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // 1. Construcción del WHERE sobre CAMPANA
  const where: any = {};

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } }
    ];
  }

  if (estado) where.estado = estado;
  if (tipo) where.tipo = tipo;

  if (desde || hasta) {
    where.startsAt = {};
    if (desde) where.startsAt.gte = new Date(desde);
    if (hasta) {
      const fechaHasta = new Date(hasta);
      fechaHasta.setHours(23, 59, 59, 999);
      where.startsAt.lte = fechaHasta;
    }
  }

  // 2. Consulta Paginada
  const [totalCampanas, campanasDB] = await prisma.$transaction([
    prisma.campana.count({ where }),
    prisma.campana.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      include: {
        detalles: {
          include: {
            producto: {
              select: { id: true, nombre: true, imagenes: { take: 1, orderBy: { esPortada: 'desc' } } }
            }
          }
        }
      },
      take: ITEMS_PER_PAGE,
      skip
    })
  ]);

  const totalPages = Math.ceil(totalCampanas / ITEMS_PER_PAGE);

  // 3. Mapeo para la vista
  const campañas = campanasDB.map(c => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    tipo: c.tipo,
    valor: Number(c.valor),
    inicio: c.startsAt,
    fin: c.endsAt,
    estadoCalculado: c.estado,
    // Mapeamos los productos desde los detalles
    productos: c.detalles.map(d => ({
      id: d.producto.id,
      nombre: d.producto.nombre,
      imagen: d.producto.imagenes[0]?.url || null
    }))
  }));

  // Stats Reales (Nota: Estos stats son sobre la página actual o totales? 
  // Idealmente deberían ser totales, pero count con filtros es costoso si se hace múltiple.
  // Mantendremos los stats visuales simples o los haremos globales si es necesario.
  // Por ahora, mostraré stats de lo que se ve o haré un count separado si es crítico. 
  // El diseño original filtraba en memoria. Haremos queries separadas para los stats si se requiere precisión total)

  // Para mantener eficiencia, vamos a mostrar el total general en el sidebar.
  // Y si se quiere stats de 'activas/programadas', hacemos un count rápido.
  const [countActivas, countProgramadas] = await prisma.$transaction([
    prisma.campana.count({ where: { ...where, estado: 'ACTIVO' } }),
    prisma.campana.count({ where: { ...where, estado: 'PROGRAMADO' } })
  ]);

  const stats = {
    activas: countActivas,
    programadas: countProgramadas,
    totalCampanas: totalCampanas
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
          <Zap className="w-4 h-4 text-yellow-300" /> Nueva Campaña
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6 sticky top-6">
          <FiltrosDescuentos
            initialQ={q}
            initialEstado={estado}
            initialTipo={tipo}
            initialDesde={desde}
            initialHasta={hasta}
          />

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
              <p className="text-xs text-gray-400">Total Campañas</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalCampanas}</p>
            </div>
          </div>
        </div>

        {/* Lista Principal */}
        <div className="lg:col-span-3 space-y-4">
          <ListaCampanas campañas={campañas} />

          <div className="flex justify-center pt-4">
            <Pagination totalPages={totalPages} />
          </div>
        </div>
      </div>
    </div>
  );
}
