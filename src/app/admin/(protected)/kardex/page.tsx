export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import FiltrosKardex from "./filtros-kardex";

type TipoKardex = "TODOS" | "COMPRA" | "AJUSTE" | "DEVOLUCION";

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
  // Evita corrimiento raro de TZ usando hora fija
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
    where.tipo = tipo;
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
    take: take + 1, // para saber si hay siguiente
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
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kardex</h1>
          <p className="text-sm opacity-80">Movimientos por variante (COMPRA / AJUSTE / DEVOLUCIÓN).</p>
        </div>

        <Link className="underline" href="/admin">
          ← Admin
        </Link>
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
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Producto</th>
              <th className="text-left p-3">Talla</th>
              <th className="text-left p-3">Color</th>
              <th className="text-right p-3">Cambio</th>
              <th className="text-right p-3">Costo unit.</th>
              <th className="text-left p-3">Nota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const cambio = Number(m.cambioCantidad || 0);
              const cambioTxt = `${cambio > 0 ? "+" : ""}${cambio}`;
              const cambioClass = cambio < 0 ? "text-red-500" : cambio > 0 ? "text-green-500" : "";

              const cu = m.costoUnitario ? Number(m.costoUnitario.toString()) : null;

              return (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{new Date(m.creadoEn).toLocaleString("es-PE")}</td>
                  <td className="p-3">{m.tipo}</td>
                  <td className="p-3">{m.variante.producto.nombre}</td>
                  <td className="p-3">{m.variante.talla.nombre}</td>
                  <td className="p-3">{m.variante.color.nombre}</td>
                  <td className={`p-3 text-right font-semibold ${cambioClass}`}>{cambioTxt}</td>
                  <td className="p-3 text-right">{cu === null ? "—" : soles(cu)}</td>
                  <td className="p-3">{m.nota ?? "—"}</td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={8}>
                  No hay movimientos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">
          Página <b>{page}</b>
        </div>

        <div className="flex gap-3">
          {hasPrev ? (
            <Link
              className="underline"
              href={`/admin/kardex${buildQS(baseQS, { page: String(page - 1) })}`}
            >
              ← Anterior
            </Link>
          ) : (
            <span className="opacity-50">← Anterior</span>
          )}

          {hasNext ? (
            <Link
              className="underline"
              href={`/admin/kardex${buildQS(baseQS, { page: String(page + 1) })}`}
            >
              Siguiente →
            </Link>
          ) : (
            <span className="opacity-50">Siguiente →</span>
          )}
        </div>
      </div>
    </div>
  );
}
