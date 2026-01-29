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

type SP = {
  q?: string;
  categoria?: string;
  estado?: "ACTIVO" | "INACTIVO" | "";
  stock?: "todas" | "con" | "sin";
  orden?:
    | "recientes"
    | "antiguos"
    | "nombre_asc"
    | "nombre_desc"
    | "precio_asc"
    | "precio_desc";
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};

  const q = (sp.q ?? "").trim();
  const categoriaId = (sp.categoria ?? "").trim();
  const estado = (sp.estado ?? "") as SP["estado"];
  const stock = (sp.stock ?? "todas") as SP["stock"];
  const orden = (sp.orden ?? "recientes") as SP["orden"];

  const where: Prisma.ProductoWhereInput = {};

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
    where.variantes = { some: { activa: true, stockActual: { gt: 0 } } };
  }
  if (stock === "sin") {
    where.NOT = { variantes: { some: { activa: true, stockActual: { gt: 0 } } } };
  }

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

  // 1) Traer categorías y lista base de productos (sin variantes)
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
      },
      take: 200, // seguridad: no traigas infinito
    }),
  ]);

  const ids = productosBase.map((p) => p.id);

  // 2) Variantes totales por producto
  const variantesCount = ids.length
    ? await prisma.variante.groupBy({
        by: ["productoId"],
        where: { productoId: { in: ids } },
        _count: { _all: true },
      })
    : [];

  // 3) Stock total activo por producto (solo variantes activas)
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

  const productos = productosBase.map((p) => ({
    ...p,
    variantes: mapVar.get(p.id) ?? 0,
    stock: mapStock.get(p.id) ?? 0,
  }));

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

      {/* FILTROS INSTANTÁNEOS */}
      <FiltrosProductos
        categorias={categorias}
        initial={{
          q,
          categoria: categoriaId,
          estado: estado ?? "",
          stock: stock ?? "todas",
          orden: orden ?? "recientes",
        }}
      />

      {/* TABLA */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Categoría</th>
              <th className="text-left p-3">Precio</th>
              <th className="text-left p-3">Variantes</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.nombre}</td>
                <td className="p-3">{p.categoria?.nombre ?? "-"}</td>
                <td className="p-3">{soles(p.precio)}</td>
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
                <td className="p-3" colSpan={6}>
                  No hay resultados con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
