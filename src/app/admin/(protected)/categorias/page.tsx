export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import CategoriasClient from "./categorias-client";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } }
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CATEGORÍAS</h1>
          <p className="text-sm text-gray-500 mt-1">Organiza tu catálogo (Polos, Vestidos, Accesorios...)</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600">
           Total: <span className="font-bold text-gray-900">{categorias.length}</span>
        </div>
      </div>
      <CategoriasClient initialRows={categorias} />
    </div>
  );
}