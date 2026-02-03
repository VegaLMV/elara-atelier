import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { notFound, redirect } from "next/navigation";
import ClienteForm from "../cliente-form";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) notFound();

  return (
    <div className="p-6 md:p-8">
      <ClienteForm initialData={cliente} />
    </div>
  );
}