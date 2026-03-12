export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import FiltrosProductos from "./filtros-productos";
import ProductoImageClient from "./producto-image-client";
import { Plus, Tag, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import { AuditStockButton } from "./_components/audit-stock-button";

// --- HELPERS ---
import { calcularPrecioProducto, formatMoney } from "@/lib/precios";


type SP = {
  q?: string;
  categoria?: string;
  estado?: "ACTIVO" | "INACTIVO" | "";
  stock?: "todas" | "con" | "sin";
  descuento?: "todas" | "con" | "sin";
  orden?: "recientes" | "antiguos" | "nombre_asc" | "nombre_desc" | "precio_asc" | "precio_desc";
  vista?: "tabla" | "portada";
  page?: string;
};

/**
 * ============================================================================
 * PÁGINA: CATÁLOGO DE PRODUCTOS
 * ============================================================================
 * Muestra el inventario con opciones avanzadas de filtrado y visualización.
 */
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
  const currentPage = Number(sp.page) || 1;
  const ITEMS_PER_PAGE = 25;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // --- FILTROS PRISMA ---
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

  if (stock === "con") AND.push({ variantes: { some: { activa: true, stockActual: { gt: 0 } } } });
  if (stock === "sin") AND.push({ NOT: { variantes: { some: { activa: true, stockActual: { gt: 0 } } } } });

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
    orden === "antiguos" ? { creadoEn: "asc" } :
      orden === "nombre_asc" ? { nombre: "asc" } :
        orden === "nombre_desc" ? { nombre: "desc" } :
          orden === "precio_asc" ? { precio: "asc" } :
            orden === "precio_desc" ? { precio: "desc" } :
              { creadoEn: "desc" };

  // --- CONSULTA ---
  const [categorias, totalProductos, productosBase] = await prisma.$transaction([
    prisma.categoria.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      orderBy,
      select: {
        id: true, 
        nombre: true, 
        precio: true, 
        estado: true, 
        destacado: true, 
        nuevoHasta: true,
        categoria: { select: { nombre: true } },
        descuentoActivo: true, descuentoTipo: true, descuentoValor: true, descuentoInicio: true, descuentoFin: true,
        imagenes: { select: { url: true }, orderBy: [{ esPortada: "desc" }, { orden: "asc" }], take: 1 },
        variantes: { select: { stockActual: true, activa: true } },
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
  ]);

  const totalPages = Math.ceil(totalProductos / ITEMS_PER_PAGE);

  // --- PROCESAMIENTO DE DATOS ---
  const productos = productosBase.map((p) => {
    // Lógica Centralizada
    const calculo = calcularPrecioProducto(p);
    const stockTotal = p.variantes.reduce((acc, v) => acc + (v.activa ? v.stockActual : 0), 0);
    const precioDisplay = formatMoney(calculo.precioFinal);

    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      portadaUrl: p.imagenes?.[0]?.url ?? null,
      stock: stockTotal,
      estado: p.estado,
      destacado: p.destacado,
      estadoDescuento: calculo.estadoDescuento,
      descuentoTag: calculo.etiquetaDescuento,
      precioFinal: calculo.precioFinal,
      precioDisplay,
      esNuevo: p.nuevoHasta ? new Date(p.nuevoHasta) >= ahora : false,
    };
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 bg-gray-50/50 min-h-screen">

      {/* HEADER: Adaptado para móvil */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-start gap-3 w-full md:w-auto">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-1 shrink-0"
            title="Volver al Inicio"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-black" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 md:p-2 bg-slate-900 text-white rounded-lg shadow-sm">
                <Tag className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-none">Productos</h1>
              <span className="bg-white text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-200 shadow-sm hidden sm:inline-block">
                {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 max-w-2xl">
              Gestiona tu inventario y precios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 shrink-0">
          <div className="shrink-0">
             <AuditStockButton
                currentCategoryId={categoriaId}
                currentCategoryName={categorias.find(c => c.id === categoriaId)?.nombre}
             />
          </div>
          <Link
            href="/admin/productos/nuevo"
            className="bg-slate-900 text-white px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 flex-1 md:flex-auto"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Nuevo
          </Link>
        </div>
      </div>

      {/* FILTROS */}
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

      {/* === VISTA: PORTADA (GRID) === */}
      {vista === "portada" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
          {productos.map((p) => (
            <div
              key={p.id}
              className={`bg-white border rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group relative flex flex-col ${p.estadoDescuento === 'ACTIVO' ? "ring-2 ring-emerald-500/50 border-emerald-100" : "border-gray-200"
                }`}
            >
              {/* Badges Flotantes (Aquí está la corrección del badge NUEVO) */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                {p.esNuevo && (
                  <span className="inline-flex items-center bg-indigo-600 text-white text-[9px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-sm uppercase tracking-widest">
                    NUEVO
                  </span>
                )}
                {p.estadoDescuento === 'ACTIVO' && (
                  <span className="inline-flex items-center bg-emerald-500 text-white text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-sm animate-pulse">
                    🔥 {p.descuentoTag}
                  </span>
                )}
                {p.destacado && (
                  <span className="inline-flex items-center bg-amber-400 text-amber-900 text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-sm">
                    ★ Top
                  </span>
                )}
              </div>

              {/* Imagen Interactiva */}
              <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                <ProductoImageClient
                  id={p.id}
                  nombre={p.nombre}
                  src={p.portadaUrl}
                  precioDisplay={p.precioDisplay}
                  stock={p.stock}
                />
                {p.estado === 'INACTIVO' && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md tracking-wider">INACTIVO</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 md:p-4 flex-1 flex flex-col">
                <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 md:mb-1 truncate">{p.categoria?.nombre || "Sin categoría"}</div>
                <h3 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-2 mb-1 flex-1 group-hover:text-blue-600 transition-colors" title={p.nombre}>{p.nombre}</h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 pt-2 border-t border-gray-50 mt-auto">
                  <div className="flex flex-col">
                    {p.estadoDescuento === 'ACTIVO' ? (
                      <>
                        <span className="text-[9px] md:text-[10px] text-gray-400 line-through font-medium leading-none">{formatMoney(p.precio)}</span>
                        <span className="text-sm md:text-base font-black text-emerald-600 leading-tight">{formatMoney(p.precioFinal)}</span>
                      </>
                    ) : (
                      <span className="text-sm md:text-base font-bold text-slate-900 leading-tight">{formatMoney(p.precio)}</span>
                    )}
                  </div>
                  <div className={`text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md border shrink-0 ${p.stock > 0 ? 'bg-gray-50 text-gray-600 border-gray-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    Stock: {p.stock}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <div className="col-span-full py-16 md:py-20 text-center text-gray-400 italic text-sm">No hay productos que coincidan con los filtros.</div>
          )}
        </div>
      ) : (
        /* === VISTA: TABLA === */
        <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
            {/* Wrapper de scroll horizontal esencial para móviles */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="bg-gray-50/80 text-gray-500 font-bold text-[10px] uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  <tr>
                    <th className="px-4 md:px-6 py-4 w-16 md:w-20 text-center">Img</th>
                    <th className="px-4 md:px-6 py-4">Producto</th>
                    <th className="px-4 md:px-6 py-4">Categoría</th>
                    <th className="px-4 md:px-6 py-4 text-right">Precio</th>
                    <th className="px-4 md:px-6 py-4 text-center">Oferta</th>
                    <th className="px-4 md:px-6 py-4 text-right">Final</th>
                    <th className="px-4 md:px-6 py-4 text-center">Stock</th>
                    <th className="px-4 md:px-6 py-4 text-center">Estado</th>
                    <th className="px-4 md:px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {productos.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 md:px-6 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 relative mx-auto shadow-sm">
                          <ProductoImageClient
                            id={p.id}
                            nombre={p.nombre}
                            src={p.portadaUrl}
                            precioDisplay={p.precioDisplay}
                            stock={p.stock}
                          />
                        </div>
                      </td>

                      <td className="px-4 md:px-6 py-3">
                        <div className="font-bold text-gray-900 line-clamp-1 max-w-[200px] md:max-w-[250px]" title={p.nombre}>{p.nombre}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            {p.destacado && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-100 italic">★ Top</span>}
                            {p.esNuevo && <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 px-1 rounded border border-indigo-100 uppercase tracking-tighter">Nuevo</span>}
                        </div>
                      </td>

                      <td className="px-4 md:px-6 py-3 text-gray-500 text-xs font-medium whitespace-nowrap">{p.categoria?.nombre ?? "—"}</td>

                      <td className="px-4 md:px-6 py-3 text-right text-gray-500 font-mono text-xs whitespace-nowrap">
                        {p.estadoDescuento === 'ACTIVO' ? <span className="line-through decoration-red-400">{formatMoney(p.precio)}</span> : <span className="font-medium text-slate-700">{formatMoney(p.precio)}</span>}
                      </td>

                      <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                        {p.estadoDescuento === 'ACTIVO' && (
                          <span className="inline-flex items-center bg-emerald-100 text-emerald-700 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            {p.descuentoTag}
                          </span>
                        )}
                        {p.estadoDescuento === 'PROGRAMADO' && (
                          <span className="inline-flex items-center bg-blue-50 text-blue-700 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                            ⏳ Programado
                          </span>
                        )}
                        {!p.estadoDescuento && <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      <td className="px-4 md:px-6 py-3 text-right font-bold text-slate-900 font-mono text-sm whitespace-nowrap">
                        {p.estadoDescuento === 'ACTIVO' ? (
                          <span className="text-emerald-600">{formatMoney(p.precioFinal)}</span>
                        ) : (
                          <span className="text-gray-300 font-normal text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 md:px-6 py-3 text-center">
                        {p.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-100"><AlertCircle className="w-3 h-3" /> 0</span>
                        ) : (
                          <span className="text-slate-700 font-mono font-medium">{p.stock}</span>
                        )}
                      </td>

                      <td className="px-4 md:px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold border uppercase tracking-wider ${p.estado === 'ACTIVO' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {p.estado === 'ACTIVO' && <CheckCircle2 className="w-3 h-3" />}
                          <span className="hidden md:inline">{p.estado}</span>
                          <span className="md:hidden">{p.estado === 'ACTIVO' ? 'ON' : 'OFF'}</span>
                        </span>
                      </td>

                      <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                        <Link className="text-slate-600 hover:text-blue-600 font-bold text-[11px] md:text-xs bg-white border border-gray-200 hover:border-blue-300 px-2.5 md:px-3 py-1.5 rounded-lg transition-all shadow-sm" href={`/admin/productos/${p.id}`}>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {productos.length === 0 && (
                    <tr><td className="p-10 md:p-16 text-center text-gray-400 italic text-sm" colSpan={9}>Sin resultados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* PAGINACIÓN */}
      <div className="flex justify-center pb-8">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}