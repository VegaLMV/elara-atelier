export const runtime = "nodejs";
export const revalidate = 60;

import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

type SP = {
  q?: string;
  categoria?: string;
  stock?: "todas" | "con";
  page?: string;
};

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}
function n(v: any) {
  const x = Number(v?.toString?.() ?? v);
  return Number.isFinite(x) ? x : 0;
}

function descuentoVigente(p: {
  descuentoActivo: boolean;
  descuentoTipo: "PORCENTAJE" | "MONTO" | null;
  descuentoValor: any | null;
  descuentoInicio: Date | null;
  descuentoFin: Date | null;
}, now: Date) {
  if (!p.descuentoActivo) return false;
  if (!p.descuentoTipo) return false;
  if (p.descuentoValor == null) return false;

  if (p.descuentoInicio && now < p.descuentoInicio) return false;
  if (p.descuentoFin && now > p.descuentoFin) return false;
  return true;
}

function calcPrecioFinal(precio: number, tipo: "PORCENTAJE" | "MONTO", valor: number) {
  let fin = precio;
  if (tipo === "PORCENTAJE") fin = precio * (1 - valor / 100);
  if (tipo === "MONTO") fin = precio - valor;
  return Math.max(0, fin);
}

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora el catálogo de Elara Atelier.",
  openGraph: {
    title: "Catálogo | Elara Atelier",
    description: "Explora el catálogo de Elara Atelier.",
    url: "/catalogo",
  },
};

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const categoriaId = (sp.categoria ?? "").trim();
  const stock = (sp.stock ?? "todas") as SP["stock"];
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const take = 24;
  const skip = (page - 1) * take;

  const where: Prisma.ProductoWhereInput = { estado: "ACTIVO" };

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoriaId) where.categoriaId = categoriaId;

  if (stock === "con") {
    where.variantes = { some: { activa: true, stockActual: { gt: 0 } } };
  }

  const [categorias, productosBase, total] = await prisma.$transaction([
    prisma.categoria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      select: {
        id: true,
        nombre: true,
        slug: true,
        precio: true,
        creadoEn: true,
        categoria: { select: { nombre: true } },

        // ✅ descuentos
        descuentoActivo: true,
        descuentoTipo: true,
        descuentoValor: true,
        descuentoInicio: true,
        descuentoFin: true,

        // ✅ portada en 1 query (más rápido)
        imagenes: {
          select: { url: true },
          orderBy: [{ esPortada: "desc" }, { orden: "asc" }],
          take: 1,
        },
      },
      take,
      skip,
    }),
    prisma.producto.count({ where }),
  ]);

  const ids = productosBase.map((p) => p.id);

  const stockSum = ids.length
    ? await prisma.variante.groupBy({
        by: ["productoId"],
        where: { productoId: { in: ids }, activa: true },
        _sum: { stockActual: true },
      })
    : [];

  const mapStock = new Map<string, number>();
  for (const r of stockSum) mapStock.set(r.productoId, r._sum.stockActual ?? 0);

  const now = new Date();

  const productos = productosBase
    .map((p) => {
      const stockTotal = mapStock.get(p.id) ?? 0;
      const disponible = stockTotal > 0;

      const portada = p.imagenes?.[0]?.url ?? "";

      const tieneDesc = descuentoVigente(
        {
          descuentoActivo: p.descuentoActivo,
          descuentoTipo: (p.descuentoTipo as any) ?? null,
          descuentoValor: p.descuentoValor,
          descuentoInicio: p.descuentoInicio,
          descuentoFin: p.descuentoFin,
        },
        now
      );

      const precioNum = n(p.precio);
      const valorNum = n(p.descuentoValor);

      const precioFinal =
        tieneDesc && p.descuentoTipo
          ? calcPrecioFinal(precioNum, p.descuentoTipo as any, valorNum)
          : null;

      const badge =
        tieneDesc && p.descuentoTipo
          ? p.descuentoTipo === "PORCENTAJE"
            ? `-${valorNum}%`
            : `-S/ ${valorNum.toFixed(2)}`
          : "";

      return {
        id: p.id,
        nombre: p.nombre,
        slug: p.slug,
        precio: p.precio,
        categoria: p.categoria,
        creadoEn: p.creadoEn,
        stockTotal,
        disponible,
        portada,
        tieneDesc,
        precioFinal,
        badge,
      };
    })
    .sort((a, b) => Number(b.disponible) - Number(a.disponible) || +b.creadoEn - +a.creadoEn);

  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Elara Atelier</h1>
        <p className="text-sm opacity-80">Catálogo</p>
      </div>

      <form method="GET" className="border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm">Buscar</label>
          <input name="q" defaultValue={q} placeholder="Nombre..." className="w-full border rounded-md px-3 py-2" />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Categoría</label>
          <select name="categoria" defaultValue={categoriaId} className="w-full border rounded-md px-3 py-2">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Ver</label>
          <select name="stock" defaultValue={stock} className="w-full border rounded-md px-3 py-2">
            <option value="todas">Todos (mixto)</option>
            <option value="con">Solo disponibles</option>
          </select>
        </div>

        <div className="md:col-span-4 flex gap-3">
          <button className="bg-black text-white rounded-md px-4 py-2">Buscar</button>
          <Link className="underline self-center" href="/catalogo">
            Limpiar
          </Link>
        </div>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {productos.map((p) => (
          <Link
            key={p.id}
            href={`/catalogo/${p.slug}`}
            className="border rounded-xl overflow-hidden hover:opacity-90 transition"
          >
            <div className="relative aspect-square bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.portada ? <img src={p.portada} alt={p.nombre} className="w-full h-full object-cover" /> : null}

              {!p.disponible && (
                <div className="absolute top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded-full">
                  Agotado
                </div>
              )}

              {p.tieneDesc && (
                <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-none shadow">
                  {p.badge ?? "OFERTA"}
                </div>
              )}
            </div>

            <div className="p-3 space-y-1">
              <div className="font-medium">{p.nombre}</div>
              <div className="text-sm opacity-80">{p.categoria?.nombre ?? "-"}</div>

              {p.tieneDesc && p.precioFinal != null ? (
                <div className="text-sm">
                  <span className="line-through opacity-60 mr-2">{soles(p.precio)}</span>
                  <span className="font-semibold">{soles(p.precioFinal)}</span>
                </div>
              ) : (
                <div className="text-sm">{soles(p.precio)}</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {productos.length === 0 && <p className="text-sm opacity-80">No hay resultados.</p>}

      <div className="flex gap-3 items-center">
        {page > 1 && (
          <Link
            className="underline"
            href={`/catalogo?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(categoriaId ? { categoria: categoriaId } : {}),
              ...(stock ? { stock } : {}),
              page: String(page - 1),
            }).toString()}`}
          >
            ← Anterior
          </Link>
        )}

        <span className="text-sm opacity-80">
          Página <b>{page}</b> / {totalPages}
        </span>

        {page < totalPages && (
          <Link
            className="underline"
            href={`/catalogo?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(categoriaId ? { categoria: categoriaId } : {}),
              ...(stock ? { stock } : {}),
              page: String(page + 1),
            }).toString()}`}
          >
            Siguiente →
          </Link>
        )}
      </div>
    </div>
  );
}
