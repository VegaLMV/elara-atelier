export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Plus, ArrowLeft, MapPin, Search } from "lucide-react";
import BuscadorProveedores from "./buscador-proveedores"; // <--- IMPORTANTE

type SP = { q?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  // Filtro de base de datos
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Proveedores</h1>
             <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold border border-slate-200">
               {rows.length}
             </span>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Administra tu red de suministro. Aquí puedes gestionar contactos y datos fiscales.
          </p>
        </div>
        
        <div className="flex gap-3">
            <Link 
                href="/admin/compras"
                className="bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" /> Compras
            </Link>
            <Link 
                href="/admin/proveedores/nuevo"
                className="bg-slate-900 text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Nuevo Proveedor
            </Link>
        </div>
      </div>

      {/* AQUI ESTÁ EL BUSCADOR AUTOMÁTICO */}
      <BuscadorProveedores />

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-gray-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Ruc</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 align-top">
                        <div className="font-bold text-slate-800 text-sm">{p.nombre}</div>
                        {p.razonSocial && p.razonSocial !== p.nombre && (
                           <div className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">{p.razonSocial}</div>
                        )}
                    </td>
                    <td className="px-6 py-4 align-top">
                        {p.ruc ? (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs border border-slate-200 font-mono inline-block">
                                {p.ruc}
                            </span>
                        ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                            {p.telefono && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold w-12">Tel:</span>
                                    <span className="font-mono text-xs">{p.telefono}</span>
                                </div>
                            )}
                            {p.correo && (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold w-12">Email:</span>
                                    <span className="underline decoration-blue-200 text-xs">{p.correo}</span>
                                </div>
                            )}
                            {!p.telefono && !p.correo && <span className="text-slate-300 italic text-xs">Sin contacto</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                            {(p.departamento || p.provincia || p.distrito) ? (
                                <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {[p.departamento, p.provincia, p.distrito].filter(Boolean).join(" • ")}
                                </span>
                            ) : null}
                            
                            {p.direccion ? (
                                <span className="text-xs text-slate-500 pl-4 truncate max-w-[200px]" title={p.direccion}>
                                    {p.direccion}
                                </span>
                            ) : (
                                !p.departamento && !p.provincia && !p.distrito && <span className="text-slate-300 italic text-xs">Sin dirección</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                        <Link 
                            href={`/admin/proveedores/${p.id}`}
                            className="bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 font-medium transition-all p-2 rounded-lg inline-flex shadow-sm"
                            title="Editar Proveedor"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </Link>
                    </td>
                </tr>
                ))}

                {rows.length === 0 && (
                <tr>
                    <td className="p-20 text-center text-slate-400" colSpan={6}>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="font-medium text-slate-500">No se encontraron proveedores.</p>
                            <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                Intenta con otro término de búsqueda.
                            </p>
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