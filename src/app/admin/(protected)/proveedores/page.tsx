export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import {
    Plus,
    ArrowLeft,
    MapPin,
    Search,
    Truck,
    Building2,
    Phone,
    Mail,
    FileText
} from "lucide-react";
import BuscadorProveedores from "./buscador-proveedores";

type SP = { q?: string };

/**
 * ============================================================================
 * PÁGINA: LISTADO DE PROVEEDORES
 * ============================================================================
 * Muestra la red de suministros en una tabla detallada.
 * Permite filtrar por múltiples campos (Nombre, RUC, Correo, etc.)
 */
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
    // 1. Verificación de Seguridad
    const sesion = await sesionAdmin();
    if (!sesion) redirect("/admin/login");

    const sp = (await searchParams) ?? {};
    const q = (sp.q ?? "").trim();

    // 2. Filtro Avanzado (Búsqueda en múltiples columnas)
    const where =
        q.length > 0
            ? {
                OR: [
                    { nombre: { contains: q, mode: "insensitive" as const } },
                    { razonSocial: { contains: q, mode: "insensitive" as const } },
                    { ruc: { contains: q, mode: "insensitive" as const } },
                    { telefono: { contains: q, mode: "insensitive" as const } },
                    { correo: { contains: q, mode: "insensitive" as const } },
                ],
            }
            : {};

    const rows = await prisma.proveedor.findMany({
        where,
        orderBy: { nombre: "asc" },
        select: {
            id: true,
            nombre: true,
            razonSocial: true,
            ruc: true,
            telefono: true,
            correo: true,
            departamento: true,
            provincia: true,
            distrito: true,
            direccion: true
        },
    });

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Proveedores</h1>
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200 shadow-sm">
                            {rows.length}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 max-w-2xl ml-1">
                        Gestiona tu cadena de suministro, información fiscal y contactos estratégicos.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/admin/compras"
                        className="bg-white text-slate-700 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Ir a Compras
                    </Link>
                    <Link
                        href="/admin/proveedores/nuevo"
                        className="bg-slate-900 text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" /> Nuevo Proveedor
                    </Link>
                </div>
            </div>

            {/* --- BUSCADOR --- */}
            <div className="max-w-2xl">
                <BuscadorProveedores />
            </div>

            {/* --- TABLA DE DATOS --- */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider w-1/3">Empresa / Razón Social</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider">Identificación</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider">Contacto</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider">Ubicación</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase text-[11px] tracking-wider text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                    {/* Columna Empresa */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-sm">{p.nombre}</div>
                                                {p.razonSocial && p.razonSocial !== p.nombre && (
                                                    <div className="text-xs text-gray-400 font-medium mt-0.5 max-w-[200px] truncate" title={p.razonSocial}>
                                                        {p.razonSocial}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Columna RUC */}
                                    <td className="px-6 py-4 align-top">
                                        {p.ruc ? (
                                            <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-xs border border-slate-200 font-mono font-medium">
                                                <FileText className="w-3 h-3 text-slate-400" />
                                                {p.ruc}
                                            </span>
                                        ) : <span className="text-gray-300 italic text-xs">—</span>}
                                    </td>

                                    {/* Columna Contacto */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-1.5">
                                            {p.telefono && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-mono text-xs">{p.telefono}</span>
                                                </div>
                                            )}
                                            {p.correo && (
                                                <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 transition-colors">
                                                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="text-xs truncate max-w-[180px]" title={p.correo}>{p.correo}</span>
                                                </div>
                                            )}
                                            {!p.telefono && !p.correo && <span className="text-gray-300 italic text-xs">Sin contacto registrado</span>}
                                        </div>
                                    </td>

                                    {/* Columna Ubicación */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-1">
                                            {(p.departamento || p.provincia || p.distrito) ? (
                                                <span className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                                    {[p.departamento, p.provincia, p.distrito].filter(Boolean).join(" / ")}
                                                </span>
                                            ) : null}

                                            {p.direccion ? (
                                                <span className="text-xs text-gray-500 pl-5 truncate max-w-[200px] block" title={p.direccion}>
                                                    {p.direccion}
                                                </span>
                                            ) : (
                                                !p.departamento && <span className="text-gray-300 italic text-xs pl-5">Sin ubicación</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Columna Acciones */}
                                    <td className="px-6 py-4 text-right align-middle">
                                        <Link
                                            href={`/admin/proveedores/${p.id}`}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                            {/* Empty State */}
                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-24 text-center text-gray-400" colSpan={6}>
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                                                <Search className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">No se encontraron proveedores</p>
                                                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                                                    Intenta ajustar tu búsqueda o registra un nuevo proveedor para comenzar.
                                                </p>
                                            </div>
                                        </div>
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