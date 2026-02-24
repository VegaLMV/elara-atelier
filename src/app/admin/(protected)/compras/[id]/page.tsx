export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { ArrowLeft, Printer, FileText, Calendar, Box, Truck, MapPin, Phone, CreditCard, RotateCcw } from "lucide-react";
import { PurchaseActions } from "./purchase-actions";

// Helpers
function soles(v: any) {
    const n = Number(v?.toString?.() ?? v);
    if (Number.isNaN(n)) return `S/ ${String(v)}`;
    return `S/ ${n.toFixed(2)}`;
}

function getColorStyle(hex: string | null) {
    if (!hex) return { backgroundColor: '#fff' };
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };

    const percentage = 100 / codes.length;
    const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
    return { background: `linear-gradient(135deg, ${stops})` };
}

/**
 * ============================================================================
 * PÁGINA: DETALLE DE COMPRA
 * ============================================================================
 * Muestra el desglose completo de una compra: proveedor, ítems, costos y 
 * movimientos de inventario posteriores (trazabilidad).
 */
export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const sesion = await sesionAdmin();
    if (!sesion) redirect("/admin/login");

    const { id } = await params;
    if (!id) return notFound();

    // 1. Consulta Maestra
    const compra = await prisma.compra.findUnique({
        where: { id },
        include: {
            proveedor: true,
            items: {
                include: {
                    variante: {
                        include: {
                            producto: { include: { imagenes: true, imagenesColor: true } },
                            talla: true,
                            color: true,
                        },
                    },
                    tipoEmpaque: true,
                },
                orderBy: { id: 'asc' },
            },
        },
    });

    if (!compra) return notFound();

    // 2. Cálculos
    const totalItems = compra.items.reduce((acc, it) => acc + it.cantidad, 0);
    const subtotal = compra.items.reduce((acc, it) => acc + Number(it.costoUnitario) * it.cantidad, 0);
    const envio = Number(compra.costoEnvio ?? 0);
    const otros = Number(compra.otrosCostos ?? 0);
    const total = subtotal + envio + otros;

    // 3. Trazabilidad (Movimientos posteriores de los productos comprados)
    const varianteIds = Array.from(new Set(compra.items.map((it) => it.varianteId).filter((id): id is string => id !== null)));

    const movimientos = await prisma.movimientoInventario.findMany({
        where: {
            OR: [
                { compraId: compra.id }, // Movimiento original de entrada
                {
                    varianteId: { in: varianteIds },
                    tipo: { in: ["AJUSTE", "DEVOLUCION"] },
                    creadoEn: { gte: compra.fechaCompra },
                },
            ],
        },
        include: {
            variante: { include: { producto: true, talla: true, color: true } },
        },
        orderBy: { creadoEn: "desc" },
        take: 50,
    });

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/compras"
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Orden de Compra</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${compra.estado === 'RECIBIDO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {compra.estado}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono mt-1 opacity-70">ID: {compra.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/devoluciones/nueva?refId=${compra.id}&tipo=PROVEEDOR`}
                        className="flex items-center text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-4 py-2 rounded-xl border border-orange-200 shadow-sm"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Registrar Devolución
                    </Link>
                    <PurchaseActions compraId={compra.id} />
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info General */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Información General
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha de Emisión</label>
                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date(compra.fechaCompra).toLocaleDateString("es-PE", { dateStyle: 'long' })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Proveedor</label>
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                    {compra.proveedor?.nombre ?? "Proveedor General"}
                                </div>
                                {compra.proveedor?.razonSocial && (
                                    <p className="text-xs text-gray-500 mt-1 ml-7">{compra.proveedor.razonSocial}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 border-l border-gray-100 pl-8">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Datos de Contacto</h3>
                            {compra.proveedor?.ruc && (
                                <div className="flex items-center gap-3 text-sm">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 font-medium">RUC:</span>
                                    <span className="text-slate-900 font-bold">{compra.proveedor.ruc}</span>
                                </div>
                            )}
                            {compra.proveedor?.telefono && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600 font-medium">Tel:</span>
                                    <span className="text-slate-900">{compra.proveedor.telefono}</span>
                                </div>
                            )}
                            {compra.proveedor?.direccion && (
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <span className="text-gray-600 font-medium block">Dirección:</span>
                                        <span className="text-slate-900 text-xs">{compra.proveedor.direccion}</span>
                                        {compra.proveedor.distrito && (
                                            <span className="text-gray-400 text-[10px] block">
                                                {compra.proveedor.distrito}, {compra.proveedor.provincia}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {compra.notas && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notas Adicionales</label>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{compra.notas}</p>
                        </div>
                    )}
                </div>

                {/* Resumen Financiero */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl shadow-slate-900/10 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 border-b border-slate-800 pb-3">Resumen Financiero</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-300">
                                <span>Subtotal ({totalItems} items)</span>
                                <span className="font-mono">{soles(subtotal)}</span>
                            </div>
                            {(envio > 0 || otros > 0) && (
                                <>
                                    <div className="flex justify-between text-slate-300">
                                        <span>Envío</span>
                                        <span className="font-mono">{soles(envio)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                        <span>Otros costos</span>
                                        <span className="font-mono">{soles(otros)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700">
                        <div className="flex justify-between items-end">
                            <span className="text-slate-400 font-bold text-xs uppercase">Total Pagado</span>
                            <span className="text-3xl font-bold tracking-tight">{soles(total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ITEMS */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Box className="w-4 h-4" /> Detalle de Ítems
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-400 font-bold text-[10px] uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 w-16 text-center">Img</th>
                                <th className="px-6 py-3">Producto / Ítem</th>
                                <th className="px-6 py-3 text-center">Color</th>
                                <th className="px-6 py-3 text-right">Cant.</th>
                                <th className="px-6 py-3 text-right">Costo U.</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {compra.items.map((it) => {
                                const cu = Number(it.costoUnitario);
                                const imp = cu * it.cantidad;

                                // Lógica visual híbrida
                                let nombre = "", detalle = "", imgUrl: string | null = null, hexColor: string | null = null;
                                const esProducto = !!it.variante;

                                if (it.variante) {
                                    nombre = it.variante.producto.nombre;
                                    detalle = it.variante.talla.nombre;
                                    hexColor = it.variante.color.hex;
                                    const imgColor = it.variante.producto.imagenesColor.find(ic => ic.colorId === it.variante!.colorId);
                                    imgUrl = imgColor?.url || it.variante.producto.imagenes[0]?.url || null;
                                } else if (it.tipoEmpaque) {
                                    nombre = it.tipoEmpaque.nombre;
                                    detalle = "Insumo";
                                    imgUrl = it.tipoEmpaque.imagenUrl;
                                }

                                return (
                                    <tr key={it.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-white mx-auto relative">
                                                {imgUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">IMG</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 text-sm">{nombre}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 uppercase font-bold">{detalle}</span>
                                                {!esProducto && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 uppercase font-bold">Empaque</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {hexColor ? (
                                                <span className="w-4 h-4 rounded-full border border-gray-300 shadow-sm inline-block" style={getColorStyle(hexColor)} title={it.variante?.color.nombre}></span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-700 font-medium">{it.cantidad}</td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">{soles(cu)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">{soles(imp)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* HISTORIAL RELACIONADO */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trazabilidad (Movimientos Posteriores)</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-400 font-bold text-[10px] uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Producto Afectado</th>
                                <th className="px-6 py-3 text-right">Cambio</th>
                                <th className="px-6 py-3">Nota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {movimientos.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap text-xs">
                                        {new Date(m.creadoEn).toLocaleString("es-PE", { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">{m.tipo}</span>
                                    </td>
                                    <td className="px-6 py-3 text-xs">
                                        <span className="font-bold text-gray-700">{m.variante.producto.nombre}</span>
                                        <span className="text-gray-400 mx-1">•</span>
                                        <span>{m.variante.talla.nombre} / {m.variante.color.nombre}</span>
                                    </td>
                                    <td className={`px-6 py-3 text-right font-mono font-bold text-xs ${m.cambioCantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.cambioCantidad > 0 ? `+${m.cambioCantidad}` : m.cambioCantidad}
                                    </td>
                                    <td className="px-6 py-3 text-gray-400 text-xs italic truncate max-w-xs">{m.nota || "—"}</td>
                                </tr>
                            ))}
                            {movimientos.length === 0 && (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-400 italic text-xs">No hay movimientos posteriores registrados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}