import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import {
    Plus,
    Search,
    MapPin,
    Phone,
    Edit,
    ShoppingCart,
    History,
    Users,
    CreditCard,
    ClipboardList
} from "lucide-react";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

/**
 * ============================================================================
 * PÁGINA PRINCIPAL: CARTERA DE CLIENTES
 * ============================================================================
 * Muestra un grid con los clientes registrados, permitiendo buscar y acceder
 * rápidamente a sus funciones clave (Historial, Edición, Nueva Venta).
 */

type Props = {
    searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function ClientesPage({ searchParams }: Props) {
    // 1. Verificación de Seguridad
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    const { q, page } = await searchParams;
    const busqueda = q || "";
    const currentPage = Number(page) || 1;
    const ITEMS_PER_PAGE = 25;
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    const where = {
        OR: [
            { nombre: { contains: busqueda, mode: "insensitive" as const } },
            { dni: { contains: busqueda, mode: "insensitive" as const } },
            { telefono: { contains: busqueda, mode: "insensitive" as const } },
        ],
    };

    // 2. Consulta a Base de Datos
    const [totalClientes, clientes] = await prisma.$transaction([
        prisma.cliente.count({ where }),
        prisma.cliente.findMany({
            where,
            include: {
                _count: { select: { ventas: true } },
                // Traemos las últimas ventas para calcular métricas rápidas
                ventas: {
                    orderBy: { fechaVenta: 'desc' },
                    select: { fechaVenta: true, total: true } // Solo lo necesario
                }
            },
            orderBy: { nombre: "asc" },
            take: ITEMS_PER_PAGE,
            skip,
        })
    ]);

    const totalPages = Math.ceil(totalClientes / ITEMS_PER_PAGE);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-slate-700" />
                        Cartera de Clientes
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 ml-11">
                        Gestiona tu base de datos de contactos y fidelización.
                    </p>
                </div>
                <Link
                    href="/admin/clientes/nuevo"
                    className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <span>Nuevo Cliente</span>
                </Link>
            </div>

            {/* --- BUSCADOR --- */}
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center max-w-2xl">
                <div className="p-3 text-gray-400">
                    <Search className="w-5 h-5" />
                </div>
                <form className="flex-1">
                    <input
                        name="q"
                        defaultValue={busqueda}
                        placeholder="Buscar por nombre, DNI, RUC o teléfono..."
                        className="w-full py-2 bg-transparent outline-none text-sm placeholder:text-gray-400 text-gray-900 font-medium"
                        autoComplete="off"
                    />
                </form>
                {busqueda && (
                    <Link href="/admin/clientes" className="px-4 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg mr-2 transition-colors">
                        Limpiar
                    </Link>
                )}
            </div>

            {/* --- GRID DE CLIENTES --- */}
            {clientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No se encontraron clientes</h3>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm">
                        Intenta con otro término de búsqueda o agrega un nuevo cliente a tu cartera.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {clientes.map(c => {
                        // Cálculos en tiempo de render (LTV)
                        const totalGastado = c.ventas.reduce((acc, v) => acc + Number(v.total), 0);
                        const ultimaVenta = c.ventas[0]; // Ya ordenado por fecha desc

                        return (
                            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">

                                {/* Body Tarjeta */}
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner">
                                            {c.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                <CreditCard className="w-3 h-3" /> S/ {totalGastado.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1" title={c.nombre}>
                                        {c.nombre}
                                    </h3>

                                    {/* Badges de ID */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {c.dni && (
                                            <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-mono tracking-wide">
                                                {c.dni.length === 11 ? 'RUC' : 'DNI'}: {c.dni}
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-blue-600 font-bold">
                                            {c._count.ventas} {c._count.ventas === 1 ? 'Compra' : 'Compras'}
                                        </span>
                                    </div>

                                    <div className="space-y-2.5">
                                        {c.telefono ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                                    <Phone className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="font-mono">{c.telefono}</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-300 italic pl-1">Sin teléfono</div>
                                        )}

                                        {(c.distrito || c.direccion) ? (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 mt-0.5">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="line-clamp-2 leading-snug text-xs">
                                                    {c.direccion ? c.direccion : 'Sin dirección específica'}, <br />
                                                    <span className="font-bold text-slate-500">{c.distrito || c.provincia}</span>
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Footer Última Venta */}
                                <div className="px-5 pb-4">
                                    {ultimaVenta ? (
                                        <div className="text-[10px] text-gray-400 flex justify-between items-center pt-3 border-t border-gray-50">
                                            <span>Última visita:</span>
                                            <span className="font-medium text-slate-600">{new Date(ultimaVenta.fechaVenta).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-300 pt-3 border-t border-gray-50 italic text-center">
                                            Cliente nuevo (Sin compras)
                                        </div>
                                    )}
                                </div>

                                {/* Actions Overlay / Botones */}
                                <div className="bg-gray-50 p-3 border-t border-gray-200 rounded-b-2xl flex items-center justify-between gap-2">
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/admin/clientes/${c.id}/historial`}
                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                            title="Ver Historial Completo"
                                        >
                                            <History className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/clientes/${c.id}`}
                                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                            title="Editar Datos"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    <Link
                                        href={`/admin/pedidos?new=true&clienteId=${c.id}`}
                                        className="flex-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
                                    >
                                        <ClipboardList className="w-3.5 h-3.5" />
                                        Nuevo Pedido
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-center pb-8">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}