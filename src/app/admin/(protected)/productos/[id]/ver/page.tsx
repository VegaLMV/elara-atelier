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
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 bg-gray-50/50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b border-gray-200 pb-6">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-2 mb-2 text-xs md:text-sm text-gray-500">
            <Link href="/admin/productos" className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium bg-white px-2 py-1 rounded-md border border-gray-200 md:border-none md:bg-transparent md:px-0 md:py-0">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">Productos</span><span className="md:hidden">Volver</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-mono text-[10px] md:text-xs bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px] sm:max-w-none">{producto.slug}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {producto.nombre}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 md:mt-2">
            <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 md:py-0.5 rounded-full text-[10px] md:text-xs font-bold text-gray-600 shadow-sm">
              <Layers className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-500" /> {producto.categoria?.nombre || "Sin Categoría"}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 md:py-0.5 rounded-full text-[10px] md:text-xs font-bold border shadow-sm ${producto.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {producto.estado}
            </span>
          </div>
        </div>

        <Link
          href={`/admin/productos/${id}`}
          className="w-full md:w-auto justify-center bg-slate-900 text-white px-5 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Edit className="w-4 h-4" /> Editar Producto
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* COLUMNA IZQUIERDA: GALERÍA */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="aspect-[4/5] w-full max-w-sm mx-auto lg:max-w-none bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative group">
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
              <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-red-600 text-white text-[10px] md:text-xs font-black px-2.5 md:px-3 py-1.5 rounded-lg shadow-lg z-10 flex items-center gap-1 animate-pulse">
                <Tag className="w-3 h-3" /> OFERTA {etiquetaDescuento}
              </div>
            )}
          </div>

          {galeria.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 md:gap-3 max-w-sm mx-auto lg:max-w-none">
              {galeria.map((img) => (
                <div key={img.id} className="aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:ring-2 hover:ring-slate-900 transition-all cursor-zoom-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="Galería" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFO */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Tarjeta Precio & Stats */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Precio de Venta</p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl md:text-4xl font-black ${producto.descuentoActivo ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatMoney(precioFinal)}
                  </span>
                  {producto.descuentoActivo && (
                    <span className="text-base md:text-lg text-gray-400 line-through font-medium">
                      {formatMoney(precioOriginal)}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-auto text-left sm:text-right bg-blue-50/80 px-4 py-3 sm:py-2 rounded-xl border border-blue-100 flex sm:flex-col justify-between items-center sm:items-end">
                <p className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-wider">Stock Total</p>
                <p className="text-xl md:text-2xl font-black text-blue-700">{stockTotalGlobal}</p>
              </div>
            </div>

            {producto.descripcion && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-500" /> Descripción del Producto
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {producto.descripcion}
                </p>
              </div>
            )}
          </div>

          {/* 2. Variantes */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 pl-1">
              <Package className="w-5 h-5 text-gray-400" /> Inventario Detallado
            </h2>

            {tallasOrdenadas.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-gray-300 rounded-2xl text-center text-gray-400 text-sm italic shadow-sm">
                No hay variantes registradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tallasOrdenadas.map((grupo) => (
                  <div key={grupo.nombre} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    
                    {/* Header de la Talla */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                          {grupo.nombre}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-500 font-medium">
                          {grupo.items.length} {grupo.items.length === 1 ? 'color' : 'colores'}
                        </span>
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full shadow-sm">
                        {grupo.stockTotal} unid.
                      </span>
                    </div>

                    {/* Lista de Colores dentro de la Talla */}
                    <div className="divide-y divide-gray-100 flex-1">
                      {grupo.items.map((v: any) => {
                        const costoUnitario = Number(v.itemsCompra?.[0]?.costoUnitario || 0);
                        const margenMonto = precioFinal - costoUnitario;
                        const margenPorcentaje = precioFinal > 0 ? (margenMonto / precioFinal) * 100 : 0;

                        return (
                          <div key={v.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0">
                                <SwatchModal hex={v.color.hex} nombre={v.color.nombre} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs md:text-sm font-bold text-gray-700 truncate">{v.color.nombre}</span>
                                
                                {/* Info de Costos y Márgenes (Scroll horizontal si es muy largo en móvil) */}
                                <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-0.5 hide-scrollbar">
                                  {costoUnitario > 0 ? (
                                    <span className="text-[9px] md:text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100 whitespace-nowrap" title="Último Costo de Compra">
                                      Costo: {formatMoney(costoUnitario)}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] md:text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">{v.color.hex || "N/A"}</span>
                                  )}
                                  
                                  {costoUnitario > 0 && (
                                    <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${margenPorcentaje > 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`} title="Margen de Ganancia Bruta">
                                      {margenPorcentaje.toFixed(0)}% mg.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stock Visual Indicator */}
                            <div className="text-right flex flex-col items-end shrink-0 pl-2">
                              <span className={`block text-sm md:text-base font-black tracking-tight ${v.stockActual === 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                {v.stockActual} <span className="text-[9px] font-medium text-gray-400 uppercase">u.</span>
                              </span>
                              {!v.activa && <span className="text-[8px] md:text-[9px] text-red-600 font-bold uppercase block mt-0.5 px-1.5 py-0.5 bg-red-50 rounded border border-red-100 tracking-wider">Inactivo</span>}
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