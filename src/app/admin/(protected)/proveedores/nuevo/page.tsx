export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import ProveedorForm from "../proveedor-form";

/**
 * ============================================================================
 * PÁGINA: NUEVO PROVEEDOR
 * ============================================================================
 * Wrapper para el formulario de creación.
 */
export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  return (
    <div className="bg-gray-50/50 min-h-screen">
       <ProveedorForm initialData={null} />
    </div>
  );
}