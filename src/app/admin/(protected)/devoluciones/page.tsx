export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import {
    RotateCcw,
    Plus,
    Users,
    Truck,
    CheckCircle2,
    History,
    ArrowRight,
    TrendingUp,
    Package,
    Wallet
} from "lucide-react";

/**
 * ============================================================================
 * PÁGINA: PANEL CENTRAL DE DEVOLUCIONES Y CAMBIOS
 * ============================================================================
 * Proporciona una visión 360° de los retornos de mercadería.
 * Incluye:
 * 1. KPIs de impacto (Unidades devueltas y Saldos pendientes).
 * 2. Filtros por Tipo (Cliente vs Proveedor).
 * 3. Listado cronológico de operaciones.
 */
export default async function DevolucionesPage({
    searchParams
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const sesion = await sesionAdmin();
    if (!sesion) redirect("/admin/login");

    const sp = await searchParams;
    const modo = sp.tab === "proveedor" ? "PROVEEDOR" : "CLIENTE";

    // 1. Consulta de Devoluciones (Filtrada por la pestaña activa)
    const devoluciones = await prisma.devolucion.findMany({
        where: { tipo: modo as any },
        include: {
            venta: { include: { cliente: { select: { nombre: true } } } },
            compra: { include: { proveedor: { select: { nombre: true } } } },
            items: true
        },
        orderBy: { creadoEn: "desc" },
        take: 40
    });

    // 2. Cálculo de Stats (Para los cuadros superiores)
    const statsGlobales = await prisma.$transaction([
        prisma.devolucionItem.aggregate({ _sum: { cantidad: true } }),
        prisma.cliente.aggregate({ _sum: { saldoAFavor: true } })
    ]);

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 bg-gray-50/50 min-h-screen">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                            Post-Venta & RMA
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <RotateCcw className="w-9 h-9 text-indigo-600" />
                        Devoluciones
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm max-w-lg">
                        Gestiona el flujo inverso de tu mercadería, cambios de talla por WhatsApp y créditos de clientes.
                    </p>
                </div>
                <Link
                    href="/admin/devoluciones/nueva"
                    className="group bg-slate-900 text-white px-7 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3 active:scale-95"
                >
                    <Plus className="w-5 h-5 text-indigo-400 group-hover:rotate-90 transition-transform" />
                    Nuevo Registro
                </Link>
            </div>

            {/* --- KPIs RÁPIDOS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <Package className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidades Retornadas</p>
                        <p className="text-3xl font-black text-gray-900">{statsGlobales[0]._sum.cantidad || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                        <Wallet className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldos a Favor (Clientes)</p>
                        <p className="text-3xl font-black text-gray-900">S/ {statsGlobales[1]._sum.saldoAFavor?.toString() || "0.00"}</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl flex items-center gap-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-20 h-20 text-white" />
                    </div>
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white relative z-10">
                        <History className="w-7 h-7" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimos 30 días</p>
                        <p className="text-3xl font-black text-white">{devoluciones.length} Ops.</p>
                    </div>
                </div>
            </div>

            {/* --- TABLA Y LISTADO --- */}
            <div className="space-y-6">
                {/* Selector de Pestañas Estilo Apple */}
                <div className="bg-gray-200/50 p-1.5 rounded-2xl inline-flex gap-1 border border-gray-200">
                    <Link
                        href="/admin/devoluciones?tab=cliente"
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${modo === 'CLIENTE' ? 'bg-white text-slate-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" /> De Clientes
                    </Link>
                    <Link
                        href="/admin/devoluciones?tab=proveedor"
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${modo === 'PROVEEDOR' ? 'bg-white text-slate-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Truck className="w-4 h-4" /> A Proveedores
                    </Link>
                </div>

                {/* Grid de Cards o Tabla */}
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                            <tr>
                                <th className="px-8 py-5">Fecha / Op.</th>
                                <th className="px-8 py-5">Sujeto</th>
                                <th className="px-8 py-5">Resolución</th>
                                <th className="px-8 py-5">Motivo</th>
                                <th className="px-8 py-5 text-right">Monto</th>
                                <th className="px-8 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {devoluciones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic">
                                        No hay devoluciones registradas en esta categoría.
                                    </td>
                                </tr>
                            ) : (
                                devoluciones.map((dev) => (
                                    <tr key={dev.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 font-mono text-xs uppercase">#{dev.id.slice(-6)}</span>
                                                <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                                                    {new Date(dev.creadoEn).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${modo === 'CLIENTE' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {(dev.venta?.cliente?.nombre || dev.compra?.proveedor?.nombre || "P").charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 line-clamp-1">
                                                        {modo === 'CLIENTE' ? (dev.venta?.cliente?.nombre || "Público General") : (dev.compra?.proveedor?.nombre)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                        Ref: {modo === 'CLIENTE' ? `#${dev.venta?.codigo}` : `Compra ID`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${dev.accion === 'CAMBIO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    dev.accion === 'SALDO_A_FAVOR' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                <CheckCircle2 className="w-3 h-3" />
                                                {dev.accion.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-gray-500 text-xs line-clamp-1 max-w-[200px]" title={dev.motivo}>
                                                {dev.motivo}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="font-black text-gray-900 font-mono">S/ {dev.montoTotal.toString()}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/admin/devoluciones/${dev.id}`}
                                                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-400 hover:text-slate-900 hover:border-slate-300 p-2 rounded-xl transition-all shadow-sm"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}