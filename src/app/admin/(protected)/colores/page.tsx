export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import ColoresClient from "./colores-client";
import { Palette } from "lucide-react";

type SP = {
  q?: string;
  estado?: "todos" | "activos" | "inactivos";
  page?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await sesionAdmin();
  if (!sesion) redirect("/admin/login");

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const estado = sp.estado ?? "todos";
  const currentPage = Number(sp.page) || 1;
  const ITEMS_PER_PAGE = 25;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Filtros
  const where: any = {};

  if (q) {
    where.nombre = { contains: q, mode: "insensitive" };
  }

  if (estado === "activos") where.activo = true;
  if (estado === "inactivos") where.activo = false;

  // Consulta optimizada
  const [totalColores, colores] = await prisma.$transaction([
    prisma.color.count({ where }),
    prisma.color.findMany({
      where,
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        hex: true,
        activo: true,
        _count: { select: { variantes: true } },
      },
      take: ITEMS_PER_PAGE,
      skip,
    })
  ]);

  const rows = colores.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    hex: c.hex,
    activo: c.activo,
    usos: c._count.variantes,
  }));

  const totalPages = Math.ceil(totalColores / ITEMS_PER_PAGE);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">

      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paleta de Colores</h1>
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold border border-indigo-100">
              Visual
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Gestiona los tonos disponibles para tus productos. Los colores archivados no aparecerán en nuevas creaciones.
          </p>
        </div>

        {/* Card Resumen */}
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Colores</p>
            <p className="text-2xl font-bold text-slate-900 leading-none">{totalColores}</p>
          </div>
          <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Palette className="w-5 h-5" />
          </div>
        </div>
      </div>

      <ColoresClient
        initialRows={rows}
        totalPages={totalPages}
        initialFilters={{ q, estado }}
      />
    </div>
  );
}
