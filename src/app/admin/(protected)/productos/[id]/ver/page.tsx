export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import Link from "next/link";
import { SwatchModal } from "./swatch-modal"; // <--- Importamos el componente cliente

// Formateador de moneda
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
};

type VarianteRow = {
  id: string;
  activa: boolean;
  stockActual: number;
  talla: { nombre: string; orden: number };
  color: { nombre: string; hex: string | null };
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const { id } = await params;
  if (!id) return notFound();

  // --- CONSULTA DB ---
  const producto = await prisma.producto.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      precio: true,
      slug: true,
      // Campos de descuento
      descuentoActivo: true,
      descuentoTipo: true,
      descuentoValor: true,
      imagenes: {
        orderBy: { orden: "asc" },
        select: {
          id: true,
          url: true,
          esPortada: true,
        },
      },
    },
  });

  if (!producto) return notFound();

  // --- LÓGICA DE PRECIOS Y DESCUENTOS ---
  const precioOriginal = Number(producto.precio);
  let precioFinal = precioOriginal;
  let tieneDescuento = producto.descuentoActivo;
  let etiquetaDescuento = "";

  if (tieneDescuento && producto.descuentoValor) {
    const valor = Number(producto.descuentoValor);
    if (producto.descuentoTipo === "PORCENTAJE") {
      precioFinal = precioOriginal * (1 - valor / 100);
      etiquetaDescuento = `-${valor}%`;
    } else if (producto.descuentoTipo === "MONTO") {
      precioFinal = precioOriginal - valor;
      etiquetaDescuento = `-${formatMoney(valor)}`;
    }
    // Seguridad: Precio no negativo
    if (precioFinal < 0) precioFinal = 0;
  }

  // Separar imagen de portada del resto
  const portada = producto.imagenes.find((img) => img.esPortada) || producto.imagenes[0];
  const galeria = producto.imagenes.filter((img) => img.id !== portada?.id);

  // --- LÓGICA DE VARIANTES ---
  const variantes = (await prisma.variante.findMany({
    where: { productoId: id },
    select: {
      id: true,
      activa: true,
      stockActual: true,
      talla: { select: { nombre: true, orden: true } },
      color: { select: { nombre: true, hex: true } },
    },
    orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }],
  })) as VarianteRow[];

  // Agrupar por talla
  const grupos = new Map<
    string,
    {
      tallaNombre: string;
      tallaOrden: number;
      totalStock: number;
      totalStockActivo: number;
      totalVariantes: number;
      colores: Array<{
        id: string;
        color: string;
        hex: string | null;
        stock: number;
        activa: boolean;
      }>;
    }
  >();

  for (const v of variantes) {
    const key = v.talla.nombre;

    if (!grupos.has(key)) {
      grupos.set(key, {
        tallaNombre: v.talla.nombre,
        tallaOrden: v.talla.orden,
        totalStock: 0,
        totalStockActivo: 0,
        totalVariantes: 0,
        colores: [],
      });
    }

    const g = grupos.get(key)!;
    g.totalVariantes += 1;
    g.totalStock += v.stockActual;
    if (v.activa) g.totalStockActivo += v.stockActual;

    g.colores.push({
      id: v.id,
      color: v.color.nombre,
      hex: v.color.hex ?? null,
      stock: v.stockActual,
      activa: v.activa,
    });
  }

  const tallasOrdenadas = [...grupos.values()].sort(
    (a, b) => a.tallaOrden - b.tallaOrden
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/productos"
              className="text-xs font-semibold tracking-wider text-gray-500 uppercase hover:text-blue-600 transition-colors"
            >
              Productos
            </Link>
            <span className="text-gray-300">/</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-100">
              {producto.slug}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {producto.nombre}
          </h1>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/admin/productos`}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            Volver
          </Link>
          <Link
            href={`/admin/productos/${id}`}
            className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            Editar Producto
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: IMÁGENES */}
        <div className="lg:col-span-4 space-y-4">
          <div className="aspect-square w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative group">
            {portada ? (
              <img
                src={portada.url}
                alt={producto.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <span className="text-xs mt-2 font-medium">Sin imagen</span>
              </div>
            )}
            {tieneDescuento && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                OFERTA {etiquetaDescuento}
              </div>
            )}
          </div>

          {galeria.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {galeria.map((img) => (
                <div key={img.id} className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <img src={img.url} alt="Galería" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN Y VARIANTES */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Tarjeta de Precio y Stats */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Precio Actual
                </h3>
                <div className="flex items-baseline gap-3">
                  <p className={`text-3xl font-bold ${tieneDescuento ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatMoney(precioFinal)}
                  </p>
                  {tieneDescuento && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-gray-400 line-through decoration-gray-400 font-medium">
                         {formatMoney(precioOriginal)}
                      </span>
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">
                         AHORRAS {formatMoney(precioOriginal - precioFinal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4">
                 <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase">Variantes</p>
                    <p className="text-xl font-bold text-gray-700">{variantes.length}</p>
                 </div>
                 <div className="text-right pl-4 border-l border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase">Total Stock</p>
                    <p className="text-xl font-bold text-blue-600">
                       {variantes.reduce((acc, v) => acc + v.stockActual, 0)}
                    </p>
                 </div>
              </div>
            </div>

            {producto.descripcion && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  Descripción
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {producto.descripcion}
                </p>
              </div>
            )}
          </div>

          {/* Variantes Grid */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               Inventario por Talla
            </h2>

            {tallasOrdenadas.length === 0 ? (
              <div className="p-12 bg-white border-2 border-dashed rounded-xl text-center">
                <p className="text-gray-500 text-sm">No hay variantes registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tallasOrdenadas.map((t) => (
                  <div
                    key={t.tallaNombre}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-800 text-white min-w-[3rem] h-8 flex items-center justify-center rounded-md text-sm font-bold shadow-sm px-2">
                          {t.tallaNombre}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {t.totalVariantes} colores
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          Stock Talla
                        </span>
                        <span className="font-bold text-gray-900 text-lg leading-none">
                          {t.totalStock}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {t.colores.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* AQUÍ ESTÁ EL MODAL INTERACTIVO */}
                            <SwatchModal hex={c.hex} nombre={c.color} />
                            
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700">
                                {c.color}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {c.hex || "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.activa ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                              {c.activa ? "ACTIVO" : "INACTIVO"}
                            </div>
                            <div className="w-12 text-right">
                              <span className={`text-sm font-bold ${c.stock === 0 ? "text-red-500" : "text-gray-900"}`}>
                                {c.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
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