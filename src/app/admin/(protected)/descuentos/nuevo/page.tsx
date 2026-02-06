export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { obtenerSesion } from "@/lib/sesion";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormularioCampana from "./formulario-campana";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  // Traemos datos maestros para el selector
  const [productosDb, categorias] = await Promise.all([
    prisma.producto.findMany({
      where: { estado: "ACTIVO" },
      select: { 
        id: true, 
        nombre: true, 
        precio: true,
        categoriaId: true, 
        imagenes: { where: { esPortada: true }, take: 1, select: { url: true } },
        variantes: { select: { stockActual: true } }
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  // Mapear al formato simple que usa el cliente
  const productos = productosDb.map(p => ({
    id: p.id,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    imagen: p.imagenes[0]?.url || null,
    precio: Number(p.precio),
    stockTotal: p.variantes.reduce((sum, v) => sum + v.stockActual, 0),
    estado: "ACTIVO"
  }));

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
         <Link 
            href="/admin/descuentos" 
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
         >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
         </Link>
         <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva Campaña</h1>
            <p className="text-sm text-gray-500">Configura una promoción masiva para tu tienda.</p>
         </div>
      </div>

      <FormularioCampana productos={productos} categorias={categorias} />
    </div>
  );
}