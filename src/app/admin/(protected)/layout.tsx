import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/sesion";
import AdminTopbar from "../topbar";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();

  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <AdminTopbar />
      <div className="p-6">{children}</div>
    </div>
  );
}
