import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import FormularioCampana from "./formulario-campana"; 

export default async function Page() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const [categorias, productos] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({ 
        select: { 
          id: true, 
          nombre: true, 
          categoriaId: true,
          precio: true, // <--- AGREGADO
          estado: true, // <--- AGREGADO
          variantes: {  // <--- AGREGADO (Para calcular stock total)
            select: { stockActual: true }
          },
          imagenes: { 
            take: 1,
            select: { url: true },
            orderBy: { esPortada: 'desc' }
          }
        },
        orderBy: { nombre: "asc" }
    }),
  ]);

  // Transformar productos y calcular stock total
  const productosProcesados = productos.map(p => ({
    id: p.id,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    precio: Number(p.precio),
    stockTotal: p.variantes.reduce((acc, v) => acc + v.stockActual, 0),
    imagen: p.imagenes[0]?.url || null,
    estado: p.estado
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crear Nueva Campaña</h1>
        <p className="text-sm text-gray-500 mt-2">Configura un descuento masivo para tus productos.</p>
      </div>

      <FormularioCampana categorias={categorias} productos={productosProcesados} />
    </div>
  );
}