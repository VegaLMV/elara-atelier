export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import ProveedorForm from "../proveedor-form";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  return <ProveedorForm initialData={null} />;
}
