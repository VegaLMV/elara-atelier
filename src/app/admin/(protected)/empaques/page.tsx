export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import EmpaquesClient from "./empaques-client";
import { Package } from "lucide-react"; // Icono decorativo

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const empaques = await prisma.tipoEmpaque.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: { 
      id: true, 
      nombre: true, 
      costoUnitario: true, 
      activo: true, 
      imagenUrl: true,
      stock: true
    }, 
  });

  const rows = empaques.map((e) => ({
    ...e,
    costoUnitario: e.costoUnitario.toString(),
    imagenUrl: e.imagenUrl 
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Empaques e Insumos</h1>
             <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200">
               Logística
             </span>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Gestiona el inventario de bolsas, cajas y materiales necesarios para la entrega de productos.
          </p>
        </div>

        {/* Card Resumen */}
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
           <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tipos Registrados</p>
              <p className="text-2xl font-bold text-slate-900 leading-none">{rows.length}</p>
           </div>
           <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-100">
              <Package className="w-5 h-5" />
           </div>
        </div>
      </div>

      <EmpaquesClient initialRows={rows} />
    </div>
  );
}