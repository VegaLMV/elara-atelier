import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import { Plus, Search, MapPin, Phone, Edit, ShoppingCart, History } from "lucide-react";
import ClientesClient from "./clientes-client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ClientesPage({ searchParams }: Props) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { q } = await searchParams;
  const busqueda = q || "";

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { nombre: { contains: busqueda, mode: "insensitive" } },
        { dni: { contains: busqueda, mode: "insensitive" } },
        { telefono: { contains: busqueda, mode: "insensitive" } },
      ],
    },
    include: {
        _count: { select: { ventas: true } },
        // Calculamos la última compra para mostrar "Activo hace..."
        ventas: {
            take: 1,
            orderBy: { fechaVenta: 'desc' },
            select: { fechaVenta: true, total: true }
        }
    },
    orderBy: { nombre: "asc" },
    take: 50,
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header y Buscador (Igual que antes) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cartera de Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona contactos y ventas rápidas.</p>
        </div>
        <Link href="/admin/clientes/nuevo" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-md flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
                name="q"
                defaultValue={busqueda}
                placeholder="Buscar por nombre, DNI o teléfono..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-slate-900 transition-colors"
            />
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map(c => {
              const ultimaVenta = c.ventas[0];
              return (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{c.nombre}</h3>
                                {c.dni && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">DNI: {c.dni}</span>}
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap">
                                    {c._count.ventas} Compras
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                            {c.telefono && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{c.telefono}</span>
                                </div>
                            )}
                            {(c.distrito || c.direccion) ? (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                    <span className="line-clamp-2 leading-tight">
                                        {c.direccion}, {c.distrito}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-gray-300 italic text-xs pl-6">Sin dirección</div>
                            )}
                            
                            {/* Última actividad */}
                            {ultimaVenta && (
                                <div className="mt-2 pt-2 border-t border-dashed border-gray-100 text-xs text-gray-500 flex justify-between">
                                    <span>Última: {new Date(ultimaVenta.fechaVenta).toLocaleDateString()}</span>
                                    <span className="font-medium text-slate-700">S/ {Number(ultimaVenta.total).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- BOTONES DE ACCIÓN --- */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex gap-2">
                            {/* 1. Botón Historial */}
                            <Link 
                                href={`/admin/clientes/${c.id}/historial`} 
                                className="text-xs font-bold text-slate-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                title="Ver Historial"
                            >
                                <History className="w-4 h-4" /> Detalle
                            </Link>
                            
                            {/* Botón Editar (Icono solo) */}
                            <Link 
                                href={`/admin/clientes/${c.id}`} 
                                className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar Datos"
                            >
                                <Edit className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* 2. Botón Venta Rápida (+ Venta) */}
                        <Link 
                            href={`/admin/ventas/nueva?clienteId=${c.id}`} 
                            className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-green-100"
                        >
                            <ShoppingCart className="w-4 h-4" /> Vender
                        </Link>
                    </div>
                </div>
              );
          })}
      </div>
    </div>
  );
}