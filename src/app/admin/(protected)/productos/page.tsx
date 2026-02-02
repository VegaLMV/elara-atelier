export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

import FiltrosProductos from "./filtros-productos";
import ProductoImageClient from "./producto-image-client"; 

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function num(v: any) {
  const n = Number(v?.toString?.() ?? v);
  return Number.isFinite(n) ? n : 0;
}

// ✅ Lógica mejorada: Considera "ACTIVO" si empieza hoy mismo, sin importar la hora UTC
function getEstadoDescuento(p: {
  descuentoActivo: boolean;
  descuentoInicio: Date | null;
  descuentoFin: Date | null;
}): "ACTIVO" | "PROGRAMADO" | null {
  if (!p.descuentoActivo) return null;

  const ahora = new Date();

  // Validación de Inicio
  if (p.descuentoInicio) {
    if (p.descuentoInicio > ahora) {
      const inicioStr = p.descuentoInicio.toISOString().split('T')[0];
      const ahoraStr = ahora.toISOString().split('T')[0];
      
      if (inicioStr !== ahoraStr) {
        return "PROGRAMADO";
      }
    }
  }

  // Validación de Fin
  if (p.descuentoFin) {
    const fin = new Date(p.descuentoFin);
    fin.setHours(23, 59, 59, 999);
    
    if (fin < ahora) {
      return null; // Expirado
    }
  }

  return "ACTIVO";
}

function etiquetaDescuento(tipo: any, valor: any) {
  const n = Number(valor?.toString?.() ?? valor);
  if (!Number.isFinite(n)) return null;

  if (tipo === "PORCENTAJE") return `-${Number.isInteger(n) ? n : n.toFixed(2)}%`;
  return `-S/ ${n.toFixed(2)}`;
}

function calcularPrecioFinal(precio: any, tipo: any, valor: any) {
  const p = num(precio);
  const v = num(valor);

  if (!tipo || v <= 0) return { final: p, ahorro: 0 };

  let final = p;
  if (tipo === "PORCENTAJE") {
    final = p * (1 - v / 100);
  } else {
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
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

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

  if (stock === "con") {
    AND.push({ variantes: { some: { activa: true, stockActual: { gt: 0 } } } });
  }
  if (stock === "sin") {
    AND.push({ NOT: { variantes: { some: { activa: true, stockActual: { gt: 0 } } } } });
  }

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
        estado: true,
        destacado: true,
        categoria: { select: { nombre: true } },

        descuentoActivo: true,
        descuentoTipo: true,
        descuentoValor: true,
        descuentoInicio: true,
        descuentoFin: true,

        imagenes: {
          select: { url: true },
          orderBy: [{ esPortada: "desc" }, { orden: "asc" }],
          take: 200, // Increased just in case, logic was fine
        },
        variantes: {
          select: { stockActual: true, activa: true },
        },
      },
      take: 200,
    }),
  ]);

  const productos = productosBase.map((p) => {
    const estadoDescuento = getEstadoDescuento({
      descuentoActivo: p.descuentoActivo,
      descuentoInicio: p.descuentoInicio,
      descuentoFin: p.descuentoFin,
    });

    const esVigente = estadoDescuento === "ACTIVO";
    const tag = (esVigente || estadoDescuento === "PROGRAMADO") 
      ? etiquetaDescuento(p.descuentoTipo, p.descuentoValor) 
      : null;

    const { final } = esVigente
      ? calcularPrecioFinal(p.precio, p.descuentoTipo, p.descuentoValor)
      : { final: num(p.precio) };

    const stockTotal = p.variantes.reduce((acc, v) => acc + (v.activa ? v.stockActual : 0), 0);
    const variantesCount = p.variantes.length;

    const precioDisplay = esVigente ? soles(final) : soles(p.precio);

    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      portadaUrl: p.imagenes?.[0]?.url ?? null,
      variantes: variantesCount,
      stock: stockTotal,
      estado: p.estado,
      destacado: p.destacado,

      estadoDescuento,
      descuentoTag: tag,
      precioFinal: final,
      precioDisplay,
    };
  });

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de catálogo ({productos.length})
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm"
        >
          + Nuevo Producto
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {productos.map((p) => (
            <div
              key={p.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative flex flex-col ${
                p.estadoDescuento === 'ACTIVO' ? "ring-1 ring-green-500/50" : ""
              }`}
            >
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                 {p.estadoDescuento === 'ACTIVO' && (
                    <span className="inline-flex items-center bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                       🔥 {p.descuentoTag} OFF
                    </span>
                 )}
                 {p.estadoDescuento === 'PROGRAMADO' && (
                    <span className="inline-flex items-center bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                       ⏳ Programado
                    </span>
                 )}
                 {p.destacado && (
                    <span className="inline-flex items-center bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm w-fit">
                       ★
                    </span>
                 )}
              </div>

              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <ProductoImageClient 
                  id={p.id}
                  nombre={p.nombre}
                  src={p.portadaUrl}
                  precioDisplay={p.precioDisplay}
                  stock={p.stock}
                />
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <div className="text-xs text-gray-500 mb-1">{p.categoria?.nombre || "Sin categoría"}</div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 flex-1" title={p.nombre}>{p.nombre}</h3>

                <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-50">
                   <div className="flex flex-col">
                      {p.estadoDescuento === 'ACTIVO' ? (
                         <>
                           <span className="text-[10px] text-gray-400 line-through">{soles(p.precio)}</span>
                           <span className="text-sm font-bold text-green-700">{soles(p.precioFinal)}</span>
                         </>
                      ) : (
                         <span className="text-sm font-bold text-gray-900">{soles(p.precio)}</span>
                      )}
                   </div>
                   <div className={`text-[10px] px-1.5 py-0.5 rounded border ${p.stock > 0 ? 'bg-gray-50 text-gray-600 border-gray-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      Stock: {p.stock}
                   </div>
                </div>
              </div>
            </div>
          ))}

          {productos.length === 0 && (
            <div className="border rounded-xl p-4 text-sm opacity-80 col-span-full text-center">
              No hay resultados con esos filtros.
            </div>
          )}
        </div>
      ) : (
        /* VISTA TABLA */
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-16">Img</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Precio Base</th>
                <th className="px-4 py-3 text-center">Descuento</th>
                <th className="px-4 py-3 text-right">Precio Final</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 border relative">
                       <ProductoImageClient 
                          id={p.id}
                          nombre={p.nombre}
                          src={p.portadaUrl}
                          precioDisplay={p.precioDisplay}
                          stock={p.stock}
                       />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1 max-w-[200px]" title={p.nombre}>{p.nombre}</div>
                    {p.destacado && <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded border border-yellow-100 inline-block mt-0.5">Destacado</span>}
                  </td>

                  <td className="px-4 py-3 text-gray-500">{p.categoria?.nombre ?? "—"}</td>

                  <td className="px-4 py-3 text-right text-gray-600 font-mono">
                     {p.estadoDescuento === 'ACTIVO' ? <span className="line-through opacity-60 text-xs">{soles(p.precio)}</span> : soles(p.precio)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {p.estadoDescuento === 'ACTIVO' && (
                       <span className="inline-flex items-center bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                          {p.descuentoTag}
                       </span>
                    )}
                    {p.estadoDescuento === 'PROGRAMADO' && (
                       <span className="inline-flex items-center bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-100" title="Próximamente">
                          ⏳ {p.descuentoTag}
                       </span>
                    )}
                    {!p.estadoDescuento && <span className="text-gray-300 text-xs">—</span>}
                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-gray-900 font-mono">
                     {p.estadoDescuento === 'ACTIVO' ? (
                        <span className="text-green-700">{soles(p.precioFinal)}</span>
                     ) : (
                        <span className="text-gray-400 opacity-50">—</span>
                     )}
                  </td>

                  <td className="px-4 py-3 text-center">
                     <span className={`font-medium ${p.stock === 0 ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-xs' : 'text-gray-700'}`}>
                        {p.stock}
                     </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                     <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {p.estado}
                     </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline" href={`/admin/productos/${p.id}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}

              {productos.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-gray-500 italic" colSpan={9}>
                    No se encontraron productos con los filtros seleccionados.
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