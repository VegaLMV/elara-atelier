export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

import FiltrosProductos from "./filtros-productos";

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function num(v: any) {
  const n = Number(v?.toString?.() ?? v);
  return Number.isFinite(n) ? n : 0;
}

function descuentoVigente(p: {
  descuentoActivo: boolean;
  descuentoTipo: any;
  descuentoValor: any;
  descuentoInicio: Date | null;
  descuentoFin: Date | null;
}) {
  if (!p.descuentoActivo) return false;
  if (!p.descuentoTipo) return false;
  if (p.descuentoValor === null || p.descuentoValor === undefined) return false;

  const ahora = new Date();
  if (p.descuentoInicio && p.descuentoInicio > ahora) return false;
  if (p.descuentoFin && p.descuentoFin < ahora) return false;
  return true;
}

function etiquetaDescuento(tipo: any, valor: any) {
  const n = Number(valor?.toString?.() ?? valor);
  if (!Number.isFinite(n)) return null;

  if (tipo === "PORCENTAJE") return `-${Number.isInteger(n) ? n : n.toFixed(2)}%`;
  return `-S/ ${n.toFixed(2)}`; // MONTO
}

function calcularPrecioFinal(precio: any, tipo: any, valor: any) {
  const p = num(precio);
  const v = num(valor);

  if (!tipo || v <= 0) return { final: p, ahorro: 0 };

  let final = p;

  if (tipo === "PORCENTAJE") {
    // asume 10 => 10%
    final = p * (1 - v / 100);
  } else {
    // MONTO
    final = p - v;
  }

  if (final < 0) final = 0;

  const ahorro = p - final;
  return { final, ahorro };
}

type SP = {
  q?: string;
  categoria?: string;
  estado?: "ACTIVO" | "INACTIVO" | "";
  stock?: "todas" | "con" | "sin";
  descuento?: "todas" | "con" | "sin";
  orden?: "recientes" | "antiguos" | "nombre_asc" | "nombre_desc" | "precio_asc" | "precio_desc";
  vista?: "tabla" | "portada";
};

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};

  const q = (sp.q ?? "").trim();
  const categoriaId = (sp.categoria ?? "").trim();
  const estado = (sp.estado ?? "") as SP["estado"];
  const stock = (sp.stock ?? "todas") as SP["stock"];
  const descuento = (sp.descuento ?? "todas") as SP["descuento"];
  const orden = (sp.orden ?? "recientes") as SP["orden"];
  const vista = (sp.vista ?? "tabla") as SP["vista"];

  const where: Prisma.ProductoWhereInput = {};
  const AND: Prisma.ProductoWhereInput[] = [];

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoriaId) where.categoriaId = categoriaId;
  if (estado === "ACTIVO" || estado === "INACTIVO") where.estado = estado;

  // stock: con / sin (solo cuenta variantes activas con stock > 0)
  if (stock === "con") {
    AND.push({ variantes: { some: { activa: true, stockActual: { gt: 0 } } } });
  }
  if (stock === "sin") {
    AND.push({ NOT: { variantes: { some: { activa: true, stockActual: { gt: 0 } } } } });
  }

  // filtro descuento: vigente
  const ahora = new Date();
  const filtroDescuentoVigente: Prisma.ProductoWhereInput = {
    descuentoActivo: true,
    descuentoTipo: { not: null },
    descuentoValor: { not: null },
    AND: [
      { OR: [{ descuentoInicio: null }, { descuentoInicio: { lte: ahora } }] },
      { OR: [{ descuentoFin: null }, { descuentoFin: { gte: ahora } }] },
    ],
  };

  if (descuento === "con") AND.push(filtroDescuentoVigente);
  if (descuento === "sin") AND.push({ NOT: filtroDescuentoVigente });

  if (AND.length) where.AND = AND;

  const orderBy: Prisma.ProductoOrderByWithRelationInput =
    orden === "antiguos"
      ? { creadoEn: "asc" }
      : orden === "nombre_asc"
      ? { nombre: "asc" }
      : orden === "nombre_desc"
      ? { nombre: "desc" }
      : orden === "precio_asc"
      ? { precio: "asc" }
      : orden === "precio_desc"
      ? { precio: "desc" }
      : { creadoEn: "desc" };

  const [categorias, productosBase] = await prisma.$transaction([
    prisma.categoria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.producto.findMany({
      where,
      orderBy,
      select: {
        id: true,
        nombre: true,
        precio: true,
        categoria: { select: { nombre: true } },

        descuentoActivo: true,
        descuentoTipo: true,
        descuentoValor: true,
        descuentoInicio: true,
        descuentoFin: true,

        imagenes: {
          select: { url: true },
          orderBy: [{ esPortada: "desc" }, { orden: "asc" }],
          take: 1,
        },
      },
      take: 200,
    }),
  ]);

  const ids = productosBase.map((p) => p.id);

  const variantesCount = ids.length
    ? await prisma.variante.groupBy({
        by: ["productoId"],
        where: { productoId: { in: ids } },
        _count: { _all: true },
      })
    : [];

  const stockSum = ids.length
    ? await prisma.variante.groupBy({
        by: ["productoId"],
        where: { productoId: { in: ids }, activa: true },
        _sum: { stockActual: true },
      })
    : [];

  const mapVar = new Map<string, number>();
  for (const r of variantesCount) mapVar.set(r.productoId, r._count._all);

  const mapStock = new Map<string, number>();
  for (const r of stockSum) mapStock.set(r.productoId, r._sum.stockActual ?? 0);

  const productos = productosBase.map((p) => {
    const vigente = descuentoVigente(p);
    const tag = vigente ? etiquetaDescuento(p.descuentoTipo, p.descuentoValor) : null;

    const { final } = vigente
      ? calcularPrecioFinal(p.precio, p.descuentoTipo, p.descuentoValor)
      : { final: num(p.precio) };

    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      portadaUrl: p.imagenes?.[0]?.url ?? "",
      variantes: mapVar.get(p.id) ?? 0,
      stock: mapStock.get(p.id) ?? 0,

      descuentoVigente: vigente,
      descuentoTag: tag,
      precioFinal: final,
    };
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm opacity-80">
            Mostrando <b>{productos.length}</b>
          </p>
        </div>

        <Link className="underline" href="/admin/productos/nuevo">
          Nuevo producto
        </Link>
      </div>

      <FiltrosProductos
        categorias={categorias}
        initial={{
          q,
          categoria: categoriaId,
          estado: estado ?? "",
          stock: stock ?? "todas",
          descuento: descuento ?? "todas",
          orden: orden ?? "recientes",
          vista: vista ?? "tabla",
        }}
      />

      {/* VISTA PORTADA */}
      {vista === "portada" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {productos.map((p) => (
            <div
              key={p.id}
              className={`border rounded-xl overflow-hidden ${
                p.descuentoVigente ? "ring-2 ring-green-600" : ""
              }`}
            >
              <div className="relative aspect-square bg-black">
                {p.descuentoVigente && p.descuentoTag ? (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center rounded-full bg-green-600 text-white px-2 py-0.5 text-[11px] font-semibold">
                      {p.descuentoTag}
                    </span>
                  </div>
                ) : null}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.portadaUrl ? (
                  <img src={p.portadaUrl} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/80">
                    Sin portada
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1">
                <div className="text-sm font-medium line-clamp-2">{p.nombre}</div>

                {/* ✅ Precio + precio final */}
                {p.descuentoVigente && p.descuentoTag ? (
                  <div className="text-xs">
                    <span className="line-through opacity-70 mr-2">{soles(p.precio)}</span>
                    <span className="font-semibold">{soles(p.precioFinal)}</span>
                  </div>
                ) : (
                  <div className="text-xs opacity-90">{soles(p.precio)}</div>
                )}

                <div className="pt-1 flex gap-3 text-xs">
                  <Link className="underline" href={`/admin/productos/${p.id}/ver`}>
                    Ver
                  </Link>
                  <Link className="underline" href={`/admin/productos/${p.id}`}>
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {productos.length === 0 && (
            <div className="border rounded-xl p-4 text-sm opacity-80 col-span-full">
              No hay resultados con esos filtros.
            </div>
          )}
        </div>
      ) : (
        /* VISTA TABLA */
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left p-3">Portada</th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">Categoría</th>
                <th className="text-left p-3">Precio</th>
                <th className="text-left p-3">Precio final</th>
                <th className="text-left p-3">Descuento</th>
                <th className="text-left p-3">Variantes</th>
                <th className="text-left p-3">Stock</th>
                <th className="text-left p-3">Acción</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((p) => (
                <tr
                  key={p.id}
                  className={`border-t ${
                    p.descuentoVigente ? "bg-green-50/40 border-l-4 border-l-green-600" : ""
                  }`}
                >
                  <td className="p-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.portadaUrl ? (
                        <img src={p.portadaUrl} alt={p.nombre} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{p.nombre}</span>
                      {p.descuentoVigente && p.descuentoTag ? (
                        <span className="inline-flex items-center rounded-full bg-green-600 text-white px-2 py-0.5 text-[11px] font-semibold">
                          {p.descuentoTag}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="p-3">{p.categoria?.nombre ?? "-"}</td>

                  {/* precio original */}
                  <td className="p-3">
                    {p.descuentoVigente ? (
                      <span className="line-through opacity-70">{soles(p.precio)}</span>
                    ) : (
                      soles(p.precio)
                    )}
                  </td>

                  {/* precio final */}
                  <td className="p-3">
                    {p.descuentoVigente ? (
                      <span className="font-semibold">{soles(p.precioFinal)}</span>
                    ) : (
                      <span className="opacity-60">—</span>
                    )}
                  </td>

                  <td className="p-3">
                    {p.descuentoVigente && p.descuentoTag ? (
                      <span className="inline-flex items-center rounded-full bg-green-600 text-white px-2 py-0.5 text-[11px] font-semibold">
                        {p.descuentoTag}
                      </span>
                    ) : (
                      <span className="opacity-60">—</span>
                    )}
                  </td>

                  <td className="p-3">{p.variantes}</td>
                  <td className="p-3">{p.stock}</td>

                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link className="underline" href={`/admin/productos/${p.id}/ver`}>
                        Ver
                      </Link>
                      <Link className="underline" href={`/admin/productos/${p.id}`}>
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {productos.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={9}>
                    No hay resultados con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
