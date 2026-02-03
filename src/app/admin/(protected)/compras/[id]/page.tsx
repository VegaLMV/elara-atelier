export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function badgeTipo(tipo: string) {
  const base = "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider";
  if (tipo === "COMPRA") return `${base} bg-green-50 text-green-700 border-green-200`;
  if (tipo === "AJUSTE") return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
  if (tipo === "DEVOLUCION") return `${base} bg-purple-50 text-purple-700 border-purple-200`;
  return `${base} bg-gray-50 text-gray-600 border-gray-200`;
}

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

  // 1. Consulta Mejorada: Incluye imágenes y empaques
  const compra = await prisma.compra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      items: {
        include: {
          // Opción A: Es Producto (Variante)
          variante: {
            include: {
              producto: {
                include: {
                  imagenes: true,
                  imagenesColor: true,
                }
              },
              talla: true,
              color: true,
            },
          },
          // Opción B: Es Empaque
          tipoEmpaque: true,
        },
        orderBy: { id: 'asc' }, // Orden simple por ingreso
      },
    },
  });

  if (!compra) return notFound();

  const totalItems = compra.items.reduce((acc, it) => acc + it.cantidad, 0);

  const subtotal = compra.items.reduce((acc, it) => {
    const cu = Number(it.costoUnitario.toString());
    return acc + cu * it.cantidad;
  }, 0);

  const envio = Number(compra.costoEnvio?.toString?.() ?? 0);
  const otros = Number(compra.otrosCostos?.toString?.() ?? 0);
  const total = subtotal + envio + otros;

  // -----------------------------
  // KARDEX: Solo aplica para Variantes (Ropa)
  // -----------------------------
  // Filtramos solo los IDs de variantes válidos (excluyendo nulls de empaques)
  const varianteIds = Array.from(new Set(compra.items.map((it) => it.varianteId).filter((id): id is string => id !== null)));

  const movimientos = await prisma.movimientoInventario.findMany({
    where: {
      OR: [
        { compraId: compra.id },
        {
          varianteId: { in: varianteIds },
          tipo: { in: ["AJUSTE", "DEVOLUCION"] },
          creadoEn: { gte: compra.fechaCompra },
        },
      ],
    },
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
    take: 300, 
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Detalle de Compra</h1>
             <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${compra.estado === 'RECIBIDO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {compra.estado}
             </span>
           </div>
           <p className="text-sm text-gray-500 font-mono">ID: {compra.id}</p>
        </div>

        <Link 
            href="/admin/compras"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          ← Volver al listado
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Info General */}
         <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-3">Información General</h2>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha de Compra</label>
                    <p className="text-gray-900 font-medium">{new Date(compra.fechaCompra).toLocaleDateString("es-PE", { dateStyle: 'long' })}</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Proveedor</label>
                    <p className="text-gray-900 font-medium text-lg">{compra.proveedor?.nombre ?? "—"}</p>
                </div>
            </div>
            {compra.notas && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notas</label>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{compra.notas}</p>
                </div>
            )}
         </div>

         {/* Resumen Financiero */}
         <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-700 pb-2">Resumen Financiero</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-300">
                        <span>Subtotal ({totalItems} ítems)</span>
                        <span>{soles(subtotal)}</span>
                    </div>
                    {(envio > 0 || otros > 0) && (
                        <>
                            <div className="flex justify-between text-slate-300">
                                <span>Envío</span>
                                <span>{soles(envio)}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Otros costos</span>
                                <span>{soles(otros)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-end">
                    <span className="text-slate-400 font-medium">Total Pagado</span>
                    <span className="text-3xl font-bold tracking-tight">{soles(total)}</span>
                </div>
            </div>
         </div>
      </div>

      {/* ITEMS (HÍBRIDO: PRODUCTOS Y EMPAQUES) */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Detalle de Ítems</h2>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-400 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                <th className="px-6 py-3 w-16">Img</th>
                <th className="px-6 py-3">Ítem</th>
                <th className="px-6 py-3">Detalle</th>
                <th className="px-6 py-3 text-center">Color</th>
                <th className="px-6 py-3 text-right">Cant.</th>
                <th className="px-6 py-3 text-right">Costo U.</th>
                <th className="px-6 py-3 text-right">Importe</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {compra.items.map((it) => {
                const cu = Number(it.costoUnitario.toString());
                const imp = cu * it.cantidad;

                // --- LÓGICA DE VISUALIZACIÓN HÍBRIDA ---
                let nombre = "";
                let detalle = "";
                let imagenUrl: string | null = null;
                let hexColor: string | null = null;
                let esProducto = false;

                if (it.variante) {
                    // CASO: PRODUCTO (ROPA)
                    esProducto = true;
                    nombre = it.variante.producto.nombre;
                    detalle = it.variante.talla.nombre; // Talla
                    hexColor = it.variante.color.hex;
                    
                    // Buscar imagen específica del color
                    const imgColor = it.variante.producto.imagenesColor.find(
                        ic => ic.colorId === it.variante!.colorId
                    );
                    // Si no hay foto color, usar la primera general (portada)
                    imagenUrl = imgColor ? imgColor.url : it.variante.producto.imagenes[0]?.url || null;

                } else if (it.tipoEmpaque) {
                    // CASO: EMPAQUE
                    nombre = it.tipoEmpaque.nombre;
                    detalle = "Insumo / Empaque";
                    imagenUrl = it.tipoEmpaque.imagenUrl;
                }

                return (
                    <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                    
                    {/* IMAGEN */}
                    <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                            {imagenUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imagenUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-gray-300">N/A</span>
                            )}
                        </div>
                    </td>

                    {/* NOMBRE */}
                    <td className="px-6 py-4 font-medium text-gray-900">
                        {nombre}
                        {!esProducto && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">EMPAQUE</span>}
                    </td>

                    {/* TALLA / DETALLE */}
                    <td className="px-6 py-4 text-gray-500 text-xs uppercase font-medium">
                        {detalle}
                    </td>

                    {/* COLOR (Solo si es producto y tiene hex) */}
                    <td className="px-6 py-4 text-center">
                        {hexColor ? (
                            <div className="flex justify-center">
                                <span 
                                    className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" 
                                    style={{ backgroundColor: hexColor }} 
                                    title={it.variante?.color.nombre}
                                ></span>
                            </div>
                        ) : (
                            <span className="text-gray-300 text-xs">-</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-right font-mono text-gray-700">{it.cantidad}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{soles(cu)}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{soles(imp)}</td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>

      {/* KARDEX RELACIONADO (Solo muestra movimientos de PRODUCTOS) */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Trazabilidad (Kardex Productos)</h2>
          <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-200">
             Historial posterior
          </span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-400 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Producto / Variante</th>
                <th className="px-6 py-3 text-right">Cambio</th>
                <th className="px-6 py-3">Nota</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {movimientos.map((m) => {
                const v = m.variante;
                return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(m.creadoEn).toLocaleString("es-PE")}
                    </td>
                    <td className="px-6 py-4">
                        <span className={badgeTipo(m.tipo)}>{m.tipo}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{v.producto.nombre}</span>
                            <span className="text-xs text-gray-500">{v.talla.nombre} · {v.color.nombre}</span>
                        </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${m.cambioCantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.cambioCantidad > 0 ? `+${m.cambioCantidad}` : m.cambioCantidad}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs italic">
                        {m.nota ?? "—"}
                    </td>
                    </tr>
                );
                })}

                {movimientos.length === 0 && (
                <tr>
                    <td className="p-8 text-center text-gray-400 italic" colSpan={5}>
                    No hay movimientos posteriores relacionados para los productos de esta compra.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}