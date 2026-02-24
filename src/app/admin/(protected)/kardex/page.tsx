export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import FiltrosKardex from "./filtros-kardex";
import {
  ArrowLeft,
  ClipboardList,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertCircle
} from "lucide-react";

// Tipos permitidos para el filtro
type TipoKardex = "TODOS" | "COMPRA" | "VENTA" | "AJUSTE" | "DEVOLUCION";

type SP = {
  q?: string;
  tipo?: TipoKardex | string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  page?: string; // "1", "2"...
};

// Helper para formatear moneda
function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function getColorStyle(hex: string | null) {
  if (!hex) return { backgroundColor: '#fff' };
  const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
  if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };

  const percentage = 100 / codes.length;
  const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
  return { background: `linear-gradient(135deg, ${stops})` };
}

// Helper para construir Query Strings de paginación
function buildQS(base: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v && v.trim() !== "") sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// Helpers de fecha
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

/**
 * ============================================================================
 * PÁGINA: KARDEX DE INVENTARIO
 * ============================================================================
 * Muestra el historial completo de movimientos de stock.
 * Permite auditar entradas, salidas y ajustes manuales.
 */
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  // 1. Seguridad
  const sesion = await sesionAdmin();
  if (!sesion) redirect("/admin/login");

  // 2. Parámetros de URL
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const tipo = ((sp.tipo ?? "TODOS") as string).trim() as TipoKardex;
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();

  // 3. Paginación
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const take = 50;
  const skip = (page - 1) * take;

  // 4. Construcción del Filtro
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
    ];
  }

  // 5. Consulta a BD
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
    take: take + 1, // Traemos 1 extra para saber si hay "Siguiente"
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
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Kardex</h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl ml-1">
            Auditoría detallada de movimientos de inventario. Controla entradas, salidas y ajustes.
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <FiltrosKardex
        initial={{ q, tipo, from, to }}
      />

      {/* TABLA DE MOVIMIENTOS */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Tipo Movimiento</th>
                <th className="px-6 py-4">Producto / Variante</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">Cantidad</th>
                <th className="px-6 py-4 text-right">Costo Unit.</th>
                <th className="px-6 py-4">Nota / Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((m) => {
                const cambio = Number(m.cambioCantidad || 0);
                const cambioTxt = `${cambio > 0 ? "+" : ""}${cambio}`;

                // Configuración visual según tipo
                let Badge = <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">{m.tipo}</span>;
                let Icon = <AlertCircle className="w-3.5 h-3.5" />;

                if (m.tipo === 'COMPRA') {
                  Badge = <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100"><ArrowDownLeft className="w-3.5 h-3.5" /> COMPRA</span>;
                } else if (m.tipo === 'VENTA') {
                  Badge = <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-100"><ArrowUpRight className="w-3.5 h-3.5" /> VENTA</span>;
                } else if (m.tipo === 'AJUSTE') {
                  Badge = <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-100"><RefreshCw className="w-3.5 h-3.5" /> AJUSTE</span>;
                } else if (m.tipo === 'DEVOLUCION') {
                  Badge = <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-100"><RefreshCw className="w-3.5 h-3.5" /> DEVOLUCIÓN</span>;
                }

                const cambioClass = cambio < 0 ? "text-red-600 font-bold" : cambio > 0 ? "text-emerald-600 font-bold" : "text-gray-400 font-medium";
                const cu = m.costoUnitario ? Number(m.costoUnitario.toString()) : null;

                return (
                  <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 align-middle text-gray-500 whitespace-nowrap font-mono text-xs">
                      {new Date(m.creadoEn).toLocaleString("es-PE", {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 align-middle">{Badge}</td>
                    <td className="px-6 py-4 align-middle">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{m.variante.producto.nombre}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] border border-gray-200 font-medium">
                            {m.variante.talla.nombre}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            <span className="w-2 h-2 rounded-full border border-gray-300 shadow-sm" style={getColorStyle(m.variante.color.hex)}></span>
                            {m.variante.color.nombre}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle font-mono text-[10px] text-slate-500 font-bold">
                      {m.variante.sku || "—"}
                    </td>
                    <td className={`px-6 py-4 align-middle text-right font-mono text-sm ${cambioClass}`}>
                      {cambioTxt}
                    </td>
                    <td className="px-6 py-4 align-middle text-right text-gray-600 text-xs">
                      {cu === null ? <span className="opacity-30">—</span> : soles(cu)}
                    </td>
                    <td className="px-6 py-4 align-middle text-gray-500 text-xs max-w-xs truncate" title={m.nota ?? ""}>
                      {m.nota ? (
                        <span className="text-slate-700">{m.nota}</span>
                      ) : (
                        <span className="text-gray-300 italic">Sin nota</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td className="p-24 text-center text-gray-400" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                        <ClipboardList className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="font-medium text-slate-600">No se encontraron movimientos</p>
                      <p className="text-xs text-gray-400">Intenta cambiar los filtros de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER PAGINACIÓN */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <div className="text-sm text-gray-500 font-medium">
          Página <span className="font-bold text-slate-900">{page}</span>
        </div>

        <div className="flex gap-2">
          <Link
            href={hasPrev ? `/admin/kardex${buildQS(baseQS, { page: String(page - 1) })}` : '#'}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${hasPrev
              ? 'bg-white border-gray-300 text-slate-700 hover:bg-gray-50 shadow-sm'
              : 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'
              }`}
            aria-disabled={!hasPrev}
          >
            ← Anterior
          </Link>

          <Link
            href={hasNext ? `/admin/kardex${buildQS(baseQS, { page: String(page + 1) })}` : '#'}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${hasNext
              ? 'bg-white border-gray-300 text-slate-700 hover:bg-gray-50 shadow-sm'
              : 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'
              }`}
            aria-disabled={!hasNext}
          >
            Siguiente →
          </Link>
        </div>
      </div >
    </div >
  );
}