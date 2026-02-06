import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import ClienteForm from "../cliente-form";

export const runtime = "nodejs";

/**
 * ============================================================================
 * PÁGINA: CREAR NUEVO CLIENTE
 * ============================================================================
 * Wrapper para renderizar el formulario en modo creación.
 * Verifica la sesión de administrador antes de mostrar el contenido.
 */
export default async function NuevoClientePage() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gray-50/50">
      <ClienteForm />
    </div>
  );
}