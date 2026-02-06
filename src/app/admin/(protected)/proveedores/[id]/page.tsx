export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import ProveedorForm from "../proveedor-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * ============================================================================
 * PÁGINA: EDITAR PROVEEDOR
 * ============================================================================
 * Busca y carga los datos del proveedor para su edición.
 */
export default async function Page({ params }: Props) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const { id } = await params;

  // Obtenemos el proveedor con TODOS sus campos
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
  });

  if (!proveedor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">🤷‍♂️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Proveedor no encontrado</h2>
        <p className="text-gray-500 mb-6">El proveedor que intentas editar no existe o fue eliminado.</p>
        <Link 
            href="/admin/proveedores" 
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <ProveedorForm initialData={proveedor} />
    </div>
  );
}