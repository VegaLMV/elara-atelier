export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import Link from "next/link";
import { SwatchModal } from "./swatch-modal";
import {
  ArrowLeft,
  Edit,
  Tag,
  Layers,
  Package,
  Info
} from "lucide-react";
import { calcularPrecioProducto, formatMoney } from "@/lib/precios";

/**
 * ============================================================================
 * PÁGINA: VER DETALLE DE PRODUCTO
 * ============================================================================
 * Vista de solo lectura optimizada para inspeccionar el estado del producto,
 * su galería de imágenes y la distribución de stock por variantes.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await sesionAdmin();
  if (!sesion) redirect("/admin/login");

  const { id } = await params;

  // 1. Obtener datos completos
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      imagenes: { orderBy: { orden: "asc" } },
      variantes: {
        include: {
          talla: true,
          color: true,
          itemsCompra: {
            orderBy: { compra: { fechaCompra: 'desc' } },
            take: 1,
            select: { costoUnitario: true }
          }
        },
        orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }]
      }
    }
  });

  if (!producto) return notFound();

  // 2. Lógica de Precios Centralizada
  const { precioOriginal, precioFinal, etiquetaDescuento, tieneDescuento } = calcularPrecioProducto({
    precio: producto.precio,
    descuentoActivo: producto.descuentoActivo,
    descuentoTipo: producto.descuentoTipo,
    descuentoValor: producto.descuentoValor,
    descuentoInicio: producto.descuentoInicio,
    descuentoFin: producto.descuentoFin
  });

  // 3. Organizar Imágenes
  const portada = producto.imagenes.find((img) => img.esPortada) || producto.imagenes[0];
  const galeria = producto.imagenes.filter((img) => img.id !== portada?.id);

  // 4. Agrupar Variantes por Talla
  const grupos = new Map();

  for (const v of producto.variantes) {
    const key = v.talla.nombre;
    if (!grupos.has(key)) {
      grupos.set(key, {
        nombre: v.talla.nombre,
        orden: v.talla.orden,
        stockTotal: 0,
        items: []
      });
    }
    const g = grupos.get(key);
    g.stockTotal += v.stockActual;
    g.items.push(v);
  }

  const tallasOrdenadas = [...grupos.values()].sort((a, b) => a.orden - b.orden);
  const stockTotalGlobal = producto.variantes.reduce((acc, v) => acc + v.stockActual, 0);

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
            <Link href="/admin/productos" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Productos
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{producto.slug}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {producto.nombre}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full text-xs font-bold text-gray-600">
              <Layers className="w-3 h-3" /> {producto.categoria?.nombre || "Sin Categoría"}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${producto.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {producto.estado}
            </span>
          </div>
        </div>

        <Link
          href={`/admin/productos/${id}`}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" /> Editar Producto
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* COLUMNA IZQUIERDA: GALERÍA (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="aspect-[4/5] w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative group">
            {portada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portada.url}
                alt={producto.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                <span className="text-xs font-bold">Sin portada</span>
              </div>
            )}

            {tieneDescuento && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-lg z-10 flex items-center gap-1">
                <Tag className="w-3 h-3" /> OFERTA {etiquetaDescuento}
              </div>
            )}
          </div>

          {galeria.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {galeria.map((img) => (
                <div key={img.id} className="aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:ring-2 hover:ring-slate-900 transition-all cursor-zoom-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="Galería" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFO (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Tarjeta Precio & Stats */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Precio de Venta</p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-4xl font-black ${producto.descuentoActivo ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatMoney(precioFinal)}
                  </span>
                  {producto.descuentoActivo && (
                    <span className="text-lg text-gray-400 line-through font-medium">
                      {formatMoney(precioOriginal)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Stock Total</p>
                <p className="text-2xl font-black text-blue-700">{stockTotalGlobal}</p>
              </div>
            </div>

            {producto.descripcion && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" /> Notas Internas / Descripción
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {producto.descripcion}
                </p>
              </div>
            )}
          </div>

          {/* 2. Variantes */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> Inventario Detallado
            </h2>

            {tallasOrdenadas.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-gray-300 rounded-2xl text-center text-gray-400 text-sm italic">
                No hay variantes registradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tallasOrdenadas.map((grupo) => (
                  <div key={grupo.nombre} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
                          {grupo.nombre}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {grupo.items.length} colores
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                        {grupo.stockTotal} unid.
                      </span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {grupo.items.map((v: any) => {
                        const costoUnitario = Number(v.itemsCompra?.[0]?.costoUnitario || 0);
                        const margenMonto = precioFinal - costoUnitario;
                        const margenPorcentaje = precioFinal > 0 ? (margenMonto / precioFinal) * 100 : 0;

                        return (
                          <div key={v.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <SwatchModal hex={v.color.hex} nombre={v.color.nombre} />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-gray-700 truncate">{v.color.nombre}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {costoUnitario > 0 ? (
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100/50" title="Último Costo de Compra">
                                      Costo: {formatMoney(costoUnitario)}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 font-mono">{v.color.hex || "N/A"}</span>
                                  )}
                                  {costoUnitario > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${margenPorcentaje > 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`} title="Margen de Ganancia Bruta">
                                      {margenPorcentaje.toFixed(0)}% mg.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className={`block text-sm font-bold ${v.stockActual === 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                {v.stockActual} <span className="text-[10px] font-medium text-gray-400">unid.</span>
                              </span>
                              {!v.activa && <span className="text-[9px] text-red-500 font-bold uppercase block mt-0.5 px-1 bg-red-50 rounded">Inactivo</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}