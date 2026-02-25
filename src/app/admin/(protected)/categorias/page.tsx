export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import CategoriasClient from "./categorias-client";
import { FolderTree } from "lucide-react"; // Opcional: Icono decorativo si deseas usarlo en el header

export const metadata = {
    title: "Categorías | Admin",
    description: "Gestión de categorías de productos."
};

export default async function Page() {
  const sesion = await sesionAdmin();
  if (!sesion) redirect("/admin/login");

  // Obtener categorías con el conteo de productos
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: { productos: true }
      },
      imagenes: {
        orderBy: { orden: "asc" }
      }
    }
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">

      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Categorías</h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Organiza tu inventario en secciones lógicas (Polos, Vestidos, etc.) para mejorar la navegación de tu catálogo.
          </p>
        </div>

        {/* Card de Resumen Rápido */}
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Registros</p>
            <p className="text-2xl font-bold text-slate-900 leading-none">{categorias.length}</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
            <FolderTree className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cliente Interactivo */}
      <CategoriasClient initialRows={categorias} />
    </div>
  );
}