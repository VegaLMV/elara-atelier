export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import ProveedorForm from "../proveedor-form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const { id } = await params;

  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    select: { id: true, nombre: true, ruc: true, telefono: true, correo: true, direccion: true },
  });

  if (!proveedor) notFound();

  return <ProveedorForm initialData={proveedor} />;
}
