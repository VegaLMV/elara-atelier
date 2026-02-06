import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import FormularioCampana from "../nuevo/formulario-campana";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCampanaPage({ params }: PageProps) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  // 1. Obtener la CAMPAÑA (Modelo Padre) e incluir sus detalles
  const campana = await prisma.campana.findUnique({
    where: { id },
    include: {
        detalles: {
            select: { productoId: true }
        }
    }
  });

  if (!campana) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaña no encontrada</h2>
        <p className="text-gray-500 mb-6">La campaña que intentas editar no existe o fue eliminada.</p>
        <Link href="/admin/descuentos" className="px-6 py-2 bg-slate-900 text-white rounded-lg">Volver</Link>
      </div>
    );
  }

  // 2. Validación de Estado
  if (campana.estado === 'FINALIZADO' || campana.estado === 'CANCELADO') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
             <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md text-center border border-gray-100">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                     <span className="text-3xl">🔒</span>
                 </div>
                 <h1 className="text-xl font-bold text-gray-900 mb-3">Edición Restringida</h1>
                 <p className="text-gray-500 text-sm leading-relaxed mb-8">
                     Esta campaña está marcada como <b>{campana.estado}</b>. Por motivos de integridad histórica, no se pueden modificar sus parámetros una vez concluida.
                 </p>
                 <Link href="/admin/descuentos" className="inline-block w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                     ← Volver al listado
                 </Link>
             </div>
          </div>
      );
  }

  // 3. Preparar datos maestros para el formulario
  const [productosDb, categorias] = await Promise.all([
    prisma.producto.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        precio: true,
        categoriaId: true,
        categoria: { select: { id: true, nombre: true } },
        imagenes: { where: { esPortada: true }, take: 1, select: { url: true } },
        variantes: { select: { stockActual: true } }
      },
      orderBy: { nombre: 'asc' }
    }),
    prisma.categoria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' }
    })
  ]);

  const productosInput = productosDb.map(p => ({
    id: p.id,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    imagen: p.imagenes[0]?.url || null,
    precio: Number(p.precio),
    stockTotal: p.variantes.reduce((acc, v) => acc + v.stockActual, 0),
    estado: "ACTIVO"
  }));

  // 4. Preparar InitialData (Mapeo Campana -> Formulario)
  const initialData = {
    id: campana.id,
    nombre: campana.nombre, // Ojo: campo 'nombre' del modelo Campana
    descripcion: campana.descripcion,
    tipo: campana.tipo,
    valor: Number(campana.valor),
    startsAt: campana.startsAt,
    endsAt: campana.endsAt,
    productoIds: campana.detalles.map(d => d.productoId), // Extraemos los IDs
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
      <div className="flex items-center gap-4 mb-8">
         <Link 
            href="/admin/descuentos" 
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
         >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
         </Link>
         <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Campaña</h1>
            <p className="text-sm text-gray-500">Modificando <span className="font-bold text-slate-800">"{campana.nombre}"</span></p>
         </div>
      </div>

      <FormularioCampana 
          initialData={initialData}
          categorias={categorias}
          productos={productosInput}
      />
    </div>
  );
}