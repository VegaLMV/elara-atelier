import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import ProductoForm from "./producto-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const runtime = "nodejs";

export default async function NuevoProductoPage() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true }
  });

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 min-h-screen bg-gray-50/50 flex flex-col justify-center">
      <Link href="/admin/productos" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors">
         <ArrowLeft className="w-4 h-4" /> Volver
      </Link>
      
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Nuevo Producto</h1>
        <p className="text-slate-500 text-lg">Comienza registrando la información básica.</p>
      </div>

      <ProductoForm categorias={categorias} />
    </div>
  );
}