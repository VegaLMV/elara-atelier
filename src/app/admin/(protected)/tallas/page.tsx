export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import TallasClient from "./tallas-client";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const tallas = await prisma.talla.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, orden: true },
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">TALLAS</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las dimensiones de tus productos (XS, S, M, L...)</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600">
           Total: <span className="font-bold text-gray-900">{tallas.length}</span>
        </div>
      </div>

      <TallasClient initialRows={tallas} />
    </div>
  );
}