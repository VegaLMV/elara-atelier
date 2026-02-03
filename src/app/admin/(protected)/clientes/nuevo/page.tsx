import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import ClienteForm from "../cliente-form";

export default async function NuevoClientePage() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="p-6 md:p-8">
      <ClienteForm />
    </div>
  );
}