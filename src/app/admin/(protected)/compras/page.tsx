export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import {
    Plus,
    Search,
    Calendar,
    ShoppingCart,
    Filter,
    DollarSign,
    Truck
} from "lucide-react";
import Pagination from "@/components/ui/pagination";

// Helper de formato moneda
function soles(v: any) {
    const n = Number(v?.toString?.() ?? v);
    if (Number.isNaN(n)) return `S/ ${String(v)}`;
    return `S/ ${n.toFixed(2)}`;
}

type SP = {
    q?: string;
    from?: string;
    to?: string;
    page?: string;
};

/**
 * ============================================================================
 * PÁGINA: LISTADO DE COMPRAS
 * ============================================================================
 * Muestra el historial de ingresos de mercadería (Ropa y Empaques).
 * Permite filtrar por proveedor, rango de fechas y notas.
 */
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
    // 1. Seguridad
    const sesion = await sesionAdmin();
    if (!sesion) redirect("/admin/login");

    // 2. Filtros
    const sp = (await searchParams) ?? {};
    const q = (sp.q ?? "").trim();
    const from = (sp.from ?? "").trim();
    const to = (sp.to ?? "").trim();

    const where: Prisma.CompraWhereInput = {};

    if (q) {
        where.OR = [
            { notas: { contains: q, mode: "insensitive" } },
            { proveedor: { is: { nombre: { contains: q, mode: "insensitive" } } } },
        ];
    }

    if (from || to) {
        where.fechaCompra = {};
        if (from) where.fechaCompra.gte = new Date(from);
        if (to) {
            const d = new Date(to);
            d.setHours(23, 59, 59, 999);
            where.fechaCompra.lte = d;
        }
    }

    // 3. Consulta
    // 3. Consulta
    const currentPage = Number(sp.page) || 1;
    const ITEMS_PER_PAGE = 25;
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    const [totalCompras, compras] = await prisma.$transaction([
        prisma.compra.count({ where }),
        prisma.compra.findMany({
            where,
            include: {
                proveedor: true,
                items: { select: { cantidad: true, costoUnitario: true } },
            },
            orderBy: { fechaCompra: "desc" },
            take: ITEMS_PER_PAGE,
            skip,
        })
    ]);

    const totalPages = Math.ceil(totalCompras / ITEMS_PER_PAGE);

    // 4. Procesamiento para vista (Cálculo de totales)
    const rows = compras.map((c) => {
        const totalItems = c.items.reduce((acc, it) => acc + it.cantidad, 0);
        const subtotal = c.items.reduce((acc, it) => acc + it.cantidad * Number(it.costoUnitario.toString()), 0);
        const envio = c.costoEnvio ? Number(c.costoEnvio.toString()) : 0;
        const otros = c.otrosCostos ? Number(c.otrosCostos.toString()) : 0;
        const total = subtotal + envio + otros;

        return {
            id: c.id,
            fecha: c.fechaCompra,
            proveedor: c.proveedor?.nombre ?? "Proveedor General",
            estado: c.estado,
            totalItems,
            total,
        };
    });

    const totalGastoVisible = rows.reduce((acc, r) => acc + r.total, 0);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Compras</h1>
                    </div>
                    <p className="text-sm text-gray-500 max-w-xl ml-1">
                        Registro de ingresos de stock. Gestiona proveedores y costos operativos.
                    </p>
                </div>
                <Link
                    href="/admin/compras/nueva"
                    className="bg-slate-900 text-white rounded-xl px-6 py-3 text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5 text-emerald-400" /> Nueva Compra
                </Link>
            </div>

            {/* --- STATS & SEARCH GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Stats Card */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Gasto Total (Vista)
                        </span>
                        <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{soles(totalGastoVisible)}</div>
                        <p className="text-xs text-emerald-600 font-medium mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg border border-emerald-100">
                            {rows.length} compras registradas
                        </p>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-5 text-slate-900">
                        <ShoppingCart className="w-32 h-32" />
                    </div>
                </div>

                {/* Filtros */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <form className="flex flex-col md:flex-row gap-4 items-end h-full">
                        <div className="flex-1 w-full space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Buscar</label>
                            <div className="relative group">
                                <input
                                    name="q"
                                    defaultValue={q}
                                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400 font-medium"
                                    placeholder="Proveedor, notas..."
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-slate-800 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Desde</label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                <input
                                    type="date"
                                    name="from"
                                    defaultValue={from}
                                    className="border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Hasta</label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                <input
                                    type="date"
                                    name="to"
                                    defaultValue={to}
                                    className="border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filtrar
                            </button>
                            {(q || from || to) && (
                                <Link href="/admin/compras" className="bg-white border border-gray-200 text-gray-500 px-3 py-2.5 rounded-xl hover:bg-gray-50 hover:text-red-500 transition-colors" title="Limpiar">
                                    ✕
                                </Link>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* --- TABLA --- */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider w-32">Fecha</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider">Proveedor</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider text-center">Estado</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider text-center">Ítems</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider text-right">Total</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((r) => (
                                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                                        {new Date(r.fecha).toLocaleDateString("es-PE", { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-900">{r.proveedor}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${r.estado === 'RECIBIDO'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : r.estado === 'BORRADOR'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">
                                            {r.totalItems}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm font-mono">
                                        {soles(r.total)}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/compras/${r.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors inline-block"
                                        >
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-24 text-center text-gray-400" colSpan={6}>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                                <ShoppingCart className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">No se encontraron compras</p>
                                                <p className="text-xs text-gray-500 mt-1">Prueba cambiando los filtros de fecha.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* PAGINACIÓN */}
            <div className="flex justify-center pb-8">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}