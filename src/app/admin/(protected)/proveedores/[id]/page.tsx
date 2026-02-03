export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import ProveedorForm from "../proveedor-form";

interface Props {
  params: Promise<{ id: string }>;
}

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
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-xl font-bold text-gray-900">Proveedor no encontrado</h2>
        <p>El proveedor que intentas editar no existe o fue eliminado.</p>
        <a href="/admin/proveedores" className="text-blue-600 hover:underline mt-4 inline-block">
          Volver a la lista
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6 md:p-8">
      <ProveedorForm initialData={proveedor} />
    </div>
  );
}