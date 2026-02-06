export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import FiltrosProductos from "./filtros-productos";
import ProductoImageClient from "./producto-image-client"; 
import { Plus, Tag, AlertCircle, CheckCircle2 } from "lucide-react";

// --- HELPERS ---
function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function num(v: any) {
  const n = Number(v?.toString?.() ?? v);
  return Number.isFinite(n) ? n : 0;
}

// Determina el estado real del descuento basado en fechas
function getEstadoDescuento(p: {
  descuentoActivo: boolean;
  descuentoInicio: Date | null;
  descuentoFin: Date | null;
}): "ACTIVO" | "PROGRAMADO" | null {
  if (!p.descuentoActivo) return null;
  const ahora = new Date();

  // Validación Inicio
  if (p.descuentoInicio) {
    if (p.descuentoInicio > ahora) {
      const inicioStr = p.descuentoInicio.toISOString().split('T')[0];
      const ahoraStr = ahora.toISOString().split('T')[0];
      if (inicioStr !== ahoraStr) return "PROGRAMADO";
    }
  }

  // Validación Fin
  if (p.descuentoFin) {
    const fin = new Date(p.descuentoFin);
    fin.setHours(23, 59, 59, 999);
    if (fin < ahora) return null; // Expirado
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
  if (tipo === "PORCENTAJE") final = p * (1 - v / 100);
  else final = p - v;
  
  if (final < 0) final = 0;
  return { final, ahorro: p - final };
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
  const [categorias, productosBase] = await prisma.$transaction([
    prisma.categoria.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({
      where,
      orderBy,
      select: {
        id: true, nombre: true, precio: true, estado: true, destacado: true,
        categoria: { select: { nombre: true } },
        descuentoActivo: true, descuentoTipo: true, descuentoValor: true, descuentoInicio: true, descuentoFin: true,
        imagenes: { select: { url: true }, orderBy: [{ esPortada: "desc" }, { orden: "asc" }], take: 1 },
        variantes: { select: { stockActual: true, activa: true } },
      },
      take: 200,
    }),
  ]);

  // --- PROCESAMIENTO DE DATOS ---
  const productos = productosBase.map((p) => {
    const estadoDescuento = getEstadoDescuento({
      descuentoActivo: p.descuentoActivo,
      descuentoInicio: p.descuentoInicio,
      descuentoFin: p.descuentoFin,
    });

    const esVigente = estadoDescuento === "ACTIVO";
    const tag = (esVigente || estadoDescuento === "PROGRAMADO") ? etiquetaDescuento(p.descuentoTipo, p.descuentoValor) : null;
    const { final } = esVigente ? calcularPrecioFinal(p.precio, p.descuentoTipo, p.descuentoValor) : { final: num(p.precio) };
    const stockTotal = p.variantes.reduce((acc, v) => acc + (v.activa ? v.stockActual : 0), 0);
    const precioDisplay = esVigente ? soles(final) : soles(p.precio);

    return {
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      categoria: p.categoria,
      portadaUrl: p.imagenes?.[0]?.url ?? null,
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
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
                <Tag className="w-6 h-6" />
             </div>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Catálogo de Productos</h1>
             <span className="bg-white text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-200 shadow-sm">
               {productos.length}
             </span>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl ml-1">
            Gestiona tu inventario, precios, ofertas y visibilidad en la tienda.
          </p>
        </div>
        
        <Link
          href="/admin/productos/nuevo"
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-emerald-400" /> Nuevo Producto
        </Link>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-6">
          {productos.map((p) => (
            <div
              key={p.id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group relative flex flex-col ${
                p.estadoDescuento === 'ACTIVO' ? "ring-2 ring-emerald-500/50 border-emerald-100" : "border-gray-200"
              }`}
            >
              {/* Badges Flotantes */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                 {p.estadoDescuento === 'ACTIVO' && (
                    <span className="inline-flex items-center bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm animate-pulse">
                       🔥 {p.descuentoTag}
                    </span>
                 )}
                 {p.destacado && (
                    <span className="inline-flex items-center bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
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
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">INACTIVO</span>
                    </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{p.categoria?.nombre || "Sin categoría"}</div>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 flex-1 group-hover:text-blue-600 transition-colors" title={p.nombre}>{p.nombre}</h3>

                <div className="flex items-end justify-between pt-3 border-t border-gray-50">
                   <div className="flex flex-col">
                      {p.estadoDescuento === 'ACTIVO' ? (
                         <>
                           <span className="text-[10px] text-gray-400 line-through font-medium">{soles(p.precio)}</span>
                           <span className="text-base font-black text-emerald-600">{soles(p.precioFinal)}</span>
                         </>
                      ) : (
                         <span className="text-base font-bold text-slate-900">{soles(p.precio)}</span>
                      )}
                   </div>
                   <div className={`text-[10px] font-bold px-2 py-1 rounded-md border ${p.stock > 0 ? 'bg-gray-50 text-gray-600 border-gray-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                      Stock: {p.stock}
                   </div>
                </div>
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 italic">No hay productos que coincidan con los filtros.</div>
          )}
        </div>
      ) : (
        /* === VISTA: TABLA === */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-gray-500 font-bold text-[10px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-20 text-center">Img</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Oferta</th>
                <th className="px-6 py-4 text-right">Final</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-3">
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

                  <td className="px-6 py-3">
                    <div className="font-bold text-gray-900 line-clamp-1 max-w-[220px]" title={p.nombre}>{p.nombre}</div>
                    {p.destacado && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mt-1">★ Destacado</span>}
                  </td>

                  <td className="px-6 py-3 text-gray-500 text-xs font-medium">{p.categoria?.nombre ?? "—"}</td>

                  <td className="px-6 py-3 text-right text-gray-500 font-mono text-xs">
                     {p.estadoDescuento === 'ACTIVO' ? <span className="line-through decoration-red-400">{soles(p.precio)}</span> : <span className="font-medium text-slate-700">{soles(p.precio)}</span>}
                  </td>

                  <td className="px-6 py-3 text-center">
                    {p.estadoDescuento === 'ACTIVO' && (
                       <span className="inline-flex items-center bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          {p.descuentoTag}
                       </span>
                    )}
                    {p.estadoDescuento === 'PROGRAMADO' && (
                       <span className="inline-flex items-center bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          ⏳ Programado
                       </span>
                    )}
                    {!p.estadoDescuento && <span className="text-gray-300 text-xs">—</span>}
                  </td>

                  <td className="px-6 py-3 text-right font-bold text-slate-900 font-mono text-sm">
                     {p.estadoDescuento === 'ACTIVO' ? (
                        <span className="text-emerald-600">{soles(p.precioFinal)}</span>
                     ) : (
                        <span className="text-gray-300 font-normal text-xs">—</span>
                     )}
                  </td>

                  <td className="px-6 py-3 text-center">
                     {p.stock === 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100"><AlertCircle className="w-3 h-3"/> 0</span>
                     ) : (
                        <span className="text-slate-700 font-mono font-medium">{p.stock}</span>
                     )}
                  </td>

                  <td className="px-6 py-3 text-center">
                     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${p.estado === 'ACTIVO' ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {p.estado === 'ACTIVO' && <CheckCircle2 className="w-3 h-3" />}
                        {p.estado}
                     </span>
                  </td>

                  <td className="px-6 py-3 text-right">
                    <Link className="text-slate-600 hover:text-blue-600 font-bold text-xs bg-white border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all shadow-sm" href={`/admin/productos/${p.id}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr><td className="p-16 text-center text-gray-400 italic" colSpan={9}>Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}