import { redirect } from "next/navigation";
import { sesionAdmin } from "@/lib/sesion";
import AdminTopbar from "../topbar";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await sesionAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <AdminTopbar />
      <main>{children}</main>
    </div>
  );
}