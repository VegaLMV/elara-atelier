export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { obtenerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";


function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

type SP = {
  q?: string;
  from?: string;
  to?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();

  const where: Prisma.CompraWhereInput = {};

  // Filtro de Texto
  if (q) {
    where.OR = [
      { notas: { contains: q, mode: "insensitive" } },
      { proveedor: { is: { nombre: { contains: q, mode: "insensitive" } } } },
    ];
  }

  // Filtro de Fechas
  if (from || to) {
      where.fechaCompra = {};
      if (from) {
          // Inicio del día seleccionado
          where.fechaCompra.gte = new Date(from);
      }
      if (to) {
          // Final del día seleccionado (23:59:59)
          const d = new Date(to);
          d.setHours(23, 59, 59, 999);
          where.fechaCompra.lte = d;
      }
  }

  const compras = await prisma.compra.findMany({
    where,
    include: {
      proveedor: true,
      items: { select: { cantidad: true, costoUnitario: true } },
    },
    orderBy: { fechaCompra: "desc" },
    take: 100,
  });

  const rows = compras.map((c) => {
    const totalItems = c.items.reduce((acc, it) => acc + it.cantidad, 0);
    const subtotal = c.items.reduce((acc, it) => acc + it.cantidad * Number(it.costoUnitario.toString()), 0);
    const envio = c.costoEnvio ? Number(c.costoEnvio.toString()) : 0;
    const otros = c.otrosCostos ? Number(c.otrosCostos.toString()) : 0;
    const total = subtotal + envio + otros;

    return {
      id: c.id,
      fecha: c.fechaCompra,
      proveedor: c.proveedor?.nombre ?? "—",
      estado: c.estado,
      totalItems,
      total,
    };
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Compras de Mercadería</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona ingresos de stock y costos asociados.</p>
        </div>
        <Link 
            href="/admin/compras/nueva"
            className="bg-slate-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center gap-2"
        >
            <span>+</span> Nueva Compra
        </Link>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Simple Stats */}
         <div className="md:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Registros</span>
            <div className="text-3xl font-bold text-gray-900 mt-2">{rows.length}</div>
            <p className="text-xs text-gray-400 mt-1">Mostrando últimos 100</p>
         </div>
         
         {/* Search Bar & Filters */}
         <div className="md:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <form className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buscar</label>
                    <div className="relative">
                        <input
                            name="q"
                            defaultValue={q}
                            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400"
                            placeholder="Proveedor, notas..."
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 px-2 uppercase tracking-wider">Desde</label>
                    <input
                        type="date"
                        name="from"
                        defaultValue={from}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 px-2 uppercase tracking-wider">Hasta</label>
                    <input
                        type="date"
                        name="to"
                        defaultValue={to}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2">
                    <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
                        Filtrar
                    </button>
                    {(q || from || to) && (
                        <Link href="/admin/compras" className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors" title="Limpiar filtros">
                            ✕
                        </Link>
                    )}
                </div>
            </form>
         </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Proveedor</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Ítems</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Acción</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap font-mono text-xs">
                        {new Date(r.fecha).toLocaleDateString("es-PE", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {r.proveedor}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.estado === 'RECIBIDO' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : r.estado === 'BORRADOR' 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {r.estado}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                        {r.totalItems}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                        {soles(r.total)}
                    </td>

                    <td className="px-6 py-4 text-right">
                        <Link 
                            href={`/admin/compras/${r.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                        >
                        Ver Detalle
                        </Link>
                    </td>
                    </tr>
                ))}

                {rows.length === 0 && (
                    <tr>
                    <td className="p-16 text-center text-gray-400 italic" colSpan={6}>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl opacity-20">📅</span>
                            <p className="font-medium">No se encontraron compras en este rango.</p>
                        </div>
                    </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}