import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect, notFound } from "next/navigation";
import {
    ArrowLeft,
    ShoppingBag,
    Calendar,
    CreditCard,
    Tag,
    User,
    MapPin,
    TrendingUp
} from "lucide-react";

function getColorStyle(hex: string | null) {
    if (!hex) return { backgroundColor: '#fff' };
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };

    const percentage = 100 / codes.length;
    const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
    return { background: `linear-gradient(135deg, ${stops})` };
}

export const dynamic = "force-dynamic";

/**
 * ============================================================================
 * PÁGINA: HISTORIAL DE COMPRAS DEL CLIENTE
 * ============================================================================
 * Muestra un timeline detallado de todas las transacciones realizadas por el cliente.
 * Calcula el LTV (Lifetime Value) y muestra detalles de cada item comprado.
 */
export default async function HistorialClientePage({ params }: { params: Promise<{ id: string }> }) {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    const { id } = await params;

    // 1. Obtener cliente con historial profundo
    const cliente = await prisma.cliente.findUnique({
        where: { id },
        include: {
            ventas: {
                orderBy: { fechaVenta: 'desc' },
                include: {
                    items: {
                        include: {
                            variante: {
                                include: {
                                    producto: { select: { nombre: true, imagenes: { take: 1, orderBy: { esPortada: 'desc' } } } },
                                    talla: true,
                                    color: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!cliente) notFound();

    // 2. Cálculo de Métricas (LTV)
    const totalGastado = cliente.ventas.reduce((acc, v) => acc + Number(v.total), 0);
    const ticketPromedio = cliente.ventas.length > 0 ? totalGastado / cliente.ventas.length : 0;

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">

            {/* --- HEADER & RESUMEN --- */}
            <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-gray-200">
                <div className="flex-1">
                    <Link
                        href="/admin/clientes"
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-slate-900 mb-3 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </Link>

                    <div className="flex items-start gap-4 mt-4">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-slate-900/20">
                            {cliente.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{cliente.nombre}</h1>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                {cliente.dni && <span className="bg-white border border-gray-200 px-2 py-0.5 rounded font-mono text-xs shadow-sm">ID: {cliente.dni}</span>}
                                {cliente.telefono && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {cliente.telefono}</span>}
                                {cliente.distrito && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" /> {cliente.distrito}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta Métricas (LTV) */}
                <div className="flex gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm min-w-[160px]">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Ticket Prom.</p>
                        <p className="text-2xl font-bold text-slate-700">S/ {ticketPromedio.toFixed(0)}</p>
                    </div>

                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl shadow-slate-900/20 flex flex-col justify-between min-w-[200px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <TrendingUp className="w-16 h-16" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Tag className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Gastado</span>
                            </div>
                            <p className="text-3xl font-bold">S/ {totalGastado.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{cliente.ventas.length} compras registradas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LISTA DE VENTAS --- */}
            <div className="space-y-6">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Historial de Transacciones
                </h2>

                {cliente.ventas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-bold">Sin actividad reciente</p>
                        <p className="text-gray-500 text-sm mt-1">Este cliente aún no ha realizado compras.</p>
                        <Link href={`/admin/ventas/nueva?clienteId=${cliente.id}`} className="mt-4 text-blue-600 font-bold hover:underline text-sm">
                            Crear primera venta →
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {cliente.ventas.map(venta => (
                            <div key={venta.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">

                                {/* Cabecera Venta */}
                                <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 text-base">Venta #{venta.codigo.slice(-6).toUpperCase()}</p>
                                                {venta.estado === 'ANULADO' && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">ANULADO</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(venta.fechaVenta).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-black text-slate-900 text-xl">S/ {Number(venta.total).toFixed(2)}</span>
                                        <span className="text-[10px] px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 inline-flex items-center gap-1 mt-1 shadow-sm font-medium">
                                            <CreditCard className="w-3 h-3" /> {venta.metodoPago}
                                        </span>
                                    </div>
                                </div>

                                {/* Items Detallados */}
                                <div className="p-2">
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-gray-50">
                                            {venta.items.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 pl-4 w-16">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative">
                                                            {item.variante.producto.imagenes?.[0]?.url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={item.variante.producto.imagenes[0].url} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full text-gray-300 text-[8px]">IMG</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <p className="font-bold text-gray-800 text-sm">{item.variante.producto.nombre}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-600 border border-gray-200">{item.variante.talla.nombre}</span>
                                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                <span className="w-2 h-2 rounded-full border border-gray-300 shadow-sm" style={getColorStyle(item.variante.color.hex)}></span>
                                                                {item.variante.color.nombre}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-center text-gray-600 font-medium text-xs">x{item.cantidad}</td>
                                                    <td className="py-3 pr-6 text-right font-bold text-gray-900 text-sm">S/ {Number(item.precioFinal).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}