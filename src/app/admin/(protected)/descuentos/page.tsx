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

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const estado = sp.estado ?? "";
  const tipo = sp.tipo ?? "";
  const desde = sp.desde ?? "";
  const hasta = sp.hasta ?? "";
  const currentPage = Number(sp.page) || 1;
  const ITEMS_PER_PAGE = 25;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

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

  const campañas = campanasDB.map(c => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    tipo: c.tipo as "PORCENTAJE" | "MONTO",
    valor: Number(c.valor),
    inicio: c.startsAt,
    fin: c.endsAt,
    estadoCalculado: c.estado,
    productos: c.detalles.map(d => ({
      id: d.producto.id,
      nombre: d.producto.nombre,
      imagen: d.producto.imagenes[0]?.url || null
    }))
  }));

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 bg-gray-50 min-h-screen">

      {/* Header adaptable */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Descuentos</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Gestiona ofertas masivas y promociones.</p>
        </div>
        <Link
          href="/admin/descuentos/nuevo"
          className="w-full md:w-auto bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-bold hover:bg-slate-800 transition shadow-md active:scale-95 flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-yellow-300" /> Nueva Campaña
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 items-start">

        {/* Sidebar apilable */}
        <div className="lg:col-span-1 space-y-6">
          <FiltrosDescuentos
            initialQ={q}
            initialEstado={estado}
            initialTipo={tipo}
            initialDesde={desde}
            initialHasta={hasta}
          />

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-2 lg:grid-cols-1 gap-4 lg:space-y-4">
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resumen</h3>
            </div>
            
            <div className="flex justify-between items-center p-2 lg:p-0 rounded-lg bg-green-50 lg:bg-transparent border border-green-100 lg:border-0">
              <span className="text-xs lg:text-sm text-gray-600 font-medium">Activas</span>
              <span className="text-base lg:text-lg font-bold text-green-600">{stats.activas}</span>
            </div>

            <div className="flex justify-between items-center p-2 lg:p-0 rounded-lg bg-blue-50 lg:bg-transparent border border-blue-100 lg:border-0">
              <span className="text-xs lg:text-sm text-gray-600 font-medium">Prog.</span>
              <span className="text-base lg:text-lg font-bold text-blue-600">{stats.programadas}</span>
            </div>

            <div className="col-span-2 lg:col-span-1 lg:pt-2 lg:border-t lg:border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Total General</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalCampanas}</p>
            </div>
          </div>
        </div>

        {/* Lista Principal */}
        <div className="lg:col-span-3 space-y-4">
          <ListaCampanas campañas={campañas} />

          <div className="flex justify-center pt-6">
            <Pagination totalPages={totalPages} />
          </div>
        </div>
      </div>
    </div>
  );
}