import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import ProductoForm from "./producto-form";

export default async function NuevoProductoPage() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // Obtenemos las categorías para el select
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true }
  });

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nuevo Producto</h1>
        <p className="text-slate-500">Ingresa la información básica para registrar el ítem en inventario.</p>
      </div>

      <ProductoForm categorias={categorias} />
    </div>
  );
}