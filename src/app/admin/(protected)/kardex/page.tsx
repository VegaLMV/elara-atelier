export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import FiltrosKardex from "./filtros-kardex";

type TipoKardex = "TODOS" | "COMPRA" | "VENTA" | "AJUSTE" | "DEVOLUCION";

type SP = {
  q?: string;
  tipo?: TipoKardex | string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: string; // "1", "2"...
};

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function buildQS(base: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v && v.trim() !== "") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function dateFromYYYYMMDD(d?: string) {
  const v = (d ?? "").trim();
  if (!v) return null;
  return new Date(`${v}T00:00:00`);
}

function dateToYYYYMMDD(d?: string) {
  const v = (d ?? "").trim();
  if (!v) return null;
  return new Date(`${v}T23:59:59.999`);
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};

  const q = (sp.q ?? "").trim();
  const tipo = ((sp.tipo ?? "TODOS") as string).trim() as TipoKardex;
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const take = 50;
  const skip = (page - 1) * take;

  const where: Prisma.MovimientoInventarioWhereInput = {};

  if (tipo && tipo !== "TODOS") {
    where.tipo = tipo as any;
  }

  const dFrom = dateFromYYYYMMDD(from);
  const dTo = dateToYYYYMMDD(to);

  if (dFrom || dTo) {
    where.creadoEn = {
      ...(dFrom ? { gte: dFrom } : {}),
      ...(dTo ? { lte: dTo } : {}),
    };
  }

  if (q) {
    where.OR = [
      { nota: { contains: q, mode: "insensitive" } },
      { variante: { is: { sku: { contains: q, mode: "insensitive" } } } },
      { variante: { is: { producto: { is: { nombre: { contains: q, mode: "insensitive" } } } } } },
      { variante: { is: { color: { is: { nombre: { contains: q, mode: "insensitive" } } } } } },
      { variante: { is: { talla: { is: { nombre: { contains: q, mode: "insensitive" } } } } } },
    ];
  }

  const list = await prisma.movimientoInventario.findMany({
    where,
    include: {
      variante: {
        include: {
          producto: true,
          talla: true,
          color: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
    skip,
    take: take + 1,
  });

  const hasNext = list.length > take;
  const rows = hasNext ? list.slice(0, take) : list;
  const hasPrev = page > 1;

  const baseQS = {
    q: q || undefined,
    tipo: tipo || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kardex de Movimientos</h1>
          <p className="text-sm text-gray-500 mt-1">Historial detallado de entradas, salidas y ajustes de inventario.</p>
        </div>
        <div className="flex items-center gap-3">
            <Link 
                href="/admin"
                className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors"
            >
                ← Volver al Panel
            </Link>
        </div>
      </div>

      {/* FILTROS */}
      <FiltrosKardex
        initial={{
          q,
          tipo,
          from,
          to,
        }}
      />

      {/* TABLA */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Variante</th>
                <th className="px-6 py-4 text-right">Cant.</th>
                <th className="px-6 py-4 text-right">Costo U.</th>
                <th className="px-6 py-4">Referencia / Nota</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {rows.map((m) => {
                const cambio = Number(m.cambioCantidad || 0);
                const cambioTxt = `${cambio > 0 ? "+" : ""}${cambio}`;
                
                // Estilos según tipo de movimiento
                let tipoBadge = <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{m.tipo}</span>;
                let rowBg = "hover:bg-gray-50";

                if (m.tipo === 'COMPRA') {
                    tipoBadge = <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">COMPRA</span>;
                } else if (m.tipo === 'VENTA') {
                    tipoBadge = <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">VENTA</span>;
                } else if (m.tipo === 'AJUSTE') {
                    tipoBadge = <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">AJUSTE</span>;
                } else if (m.tipo === 'DEVOLUCION') {
                    tipoBadge = <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200">DEVOLUCIÓN</span>;
                }

                const cambioClass = cambio < 0 ? "text-red-600 font-bold" : cambio > 0 ? "text-green-600 font-bold" : "text-gray-400";
                const cu = m.costoUnitario ? Number(m.costoUnitario.toString()) : null;

                return (
                    <tr key={m.id} className={`${rowBg} transition-colors`}>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                        {new Date(m.creadoEn).toLocaleString("es-PE", { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">{tipoBadge}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {m.variante.producto.nombre}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs border border-gray-200">{m.variante.talla.nombre}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full border border-gray-300" style={{ backgroundColor: m.variante.color.hex ?? '#fff' }}></span>
                                {m.variante.color.nombre}
                            </span>
                        </div>
                    </td>
                    <td className={`px-6 py-4 text-right ${cambioClass} font-mono text-base`}>
                        {cambioTxt}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                        {cu === null ? <span className="opacity-30">—</span> : soles(cu)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs italic max-w-xs truncate" title={m.nota ?? ""}>
                        {m.nota ?? <span className="opacity-30">Sin nota</span>}
                    </td>
                    </tr>
                );
                })}

                {rows.length === 0 && (
                <tr>
                    <td className="p-16 text-center text-gray-400" colSpan={7}>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl opacity-20">📊</span>
                            <p className="font-medium">No se encontraron movimientos.</p>
                        </div>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <div className="text-sm text-gray-500">
          Página <span className="font-bold text-gray-900">{page}</span>
        </div>

        <div className="flex gap-3">
          {hasPrev ? (
            <Link
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              href={`/admin/kardex${buildQS(baseQS, { page: String(page - 1) })}`}
            >
              ← Anterior
            </Link>
          ) : (
            <button disabled className="bg-gray-100 border border-transparent text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              ← Anterior
            </button>
          )}

          {hasNext ? (
            <Link
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              href={`/admin/kardex${buildQS(baseQS, { page: String(page + 1) })}`}
            >
              Siguiente →
            </Link>
          ) : (
            <button disabled className="bg-gray-100 border border-transparent text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}