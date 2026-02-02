export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import EmpaquesClient from "./empaques-client";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  // Nota: Asegúrate de que tu modelo 'TipoEmpaque' tenga un campo 'imagenUrl' si quieres persistir la imagen.
  // Si no lo tiene, tendrás que agregarlo a tu schema.prisma:
  // model TipoEmpaque { ... imagenUrl String? ... }
  // Por ahora, asumiremos que existe o lo manejarás. Si no existe, el cliente lo ignorará o fallará al guardar.
  
  const empaques = await prisma.tipoEmpaque.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    // select: { id: true, nombre: true, costoUnitario: true, activo: true, imagenUrl: true }, // Descomentar si agregaste imagenUrl
    select: { id: true, nombre: true, costoUnitario: true, activo: true }, 
  });

  const rows = empaques.map((e) => ({
    ...e,
    costoUnitario: e.costoUnitario.toString(),
    // imagenUrl: e.imagenUrl, 
    imagenUrl: null as string | null, // Placeholder hasta que actualices schema
  }));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Empaques</h1>
          <p className="text-sm text-gray-500 mt-1">Configura bolsas, cajas y otros materiales de entrega.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600">
           Total: <span className="font-bold text-gray-900">{rows.length}</span>
        </div>
      </div>

      <EmpaquesClient initialRows={rows} />
    </div>
  );
}