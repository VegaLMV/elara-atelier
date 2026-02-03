export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

type SP = { q?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  // 1. Actualizamos el buscador para incluir Razón Social
  const where =
    q.length > 0
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { razonSocial: { contains: q, mode: "insensitive" as const } }, // Nuevo
            { ruc: { contains: q, mode: "insensitive" as const } },
            { telefono: { contains: q, mode: "insensitive" as const } },
            { correo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

  // 2. Seleccionamos los nuevos campos en la consulta
  const rows = await prisma.proveedor.findMany({
    where,
    orderBy: { nombre: "asc" },
    select: { 
      id: true, 
      nombre: true, 
      razonSocial: true, // Nuevo
      ruc: true, 
      telefono: true, 
      correo: true, 
      departamento: true, // Nuevo
      provincia: true,    // Nuevo
      distrito: true,     // Nuevo
      direccion: true 
    },
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Administra tu red de suministro y contactos.</p>
        </div>
        <div className="flex gap-3">
            <Link 
                href="/admin/compras"
                className="bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition shadow-sm"
            >
                ← Compras
            </Link>
            <Link 
                href="/admin/proveedores/nuevo"
                className="bg-slate-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition shadow-md hover:shadow-lg flex items-center gap-2"
            >
                <span>+</span> Nuevo Proveedor
            </Link>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <form className="flex gap-3">
            <div className="relative flex-1">
                <input
                    name="q"
                    defaultValue={q}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400"
                    placeholder="Buscar por nombre, razón social, RUC..."
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-200">
                Buscar
            </button>
         </form>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                <th className="px-6 py-4">Nombre / Razón Social</th>
                <th className="px-6 py-4">RUC</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-base">{p.nombre}</div>
                        {/* Mostramos Razón Social si es diferente al Nombre */}
                        {p.razonSocial && p.razonSocial !== p.nombre && (
                           <div className="text-xs text-gray-500 uppercase tracking-tight">{p.razonSocial}</div>
                        )}
                        {p.correo && <div className="text-xs text-blue-600 mt-1">{p.correo}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 w-32 align-top">
                        {p.ruc ? <span className="bg-gray-100 px-2 py-1 rounded text-xs border inline-block">{p.ruc}</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600 align-top">
                        {p.telefono ? (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">📞</span> {p.telefono}
                            </div>
                        ) : <span className="text-gray-400 opacity-50">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500 align-top">
                        {/* Nueva Lógica de Ubicación Combinada */}
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-gray-800 text-xs uppercase">
                                {[p.departamento, p.provincia, p.distrito].filter(Boolean).join(" • ") || "—"}
                            </span>
                            {p.direccion && (
                                <span className="text-xs opacity-75 truncate max-w-[200px]" title={p.direccion}>
                                    {p.direccion}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                    <Link 
                        href={`/admin/proveedores/${p.id}`}
                        className="text-gray-400 hover:text-blue-600 font-medium transition-colors p-2 hover:bg-blue-50 rounded-full inline-block"
                        title="Editar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </Link>
                    </td>
                </tr>
                ))}

                {rows.length === 0 && (
                <tr>
                    <td className="p-12 text-center text-gray-400 italic" colSpan={6}>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-4xl opacity-20">🏢</span>
                            <p>No se encontraron proveedores.</p>
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