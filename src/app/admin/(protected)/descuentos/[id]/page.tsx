import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import FormularioCampana from "../nuevo/formulario-campana";

// Forzar renderizado dinámico para que siempre traiga datos frescos
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarCampanaPage({ params }: PageProps) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  // 1. Obtener la campaña de referencia (un registro de descuento)
  // Usamos findUnique porque el ID viene de la URL (que es el ID de un DescuentoProducto)
  const descuentoRef = await prisma.descuentoProducto.findUnique({
    where: { id },
  });

  if (!descuentoRef) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-gray-500">
        <h2 className="text-xl font-bold mb-2">Campaña no encontrada</h2>
        <p>El descuento que intentas editar no existe o fue eliminado.</p>
      </div>
    );
  }

  // 2. VALIDACIÓN DE REGLA DE NEGOCIO
  // "Que no permita editar las FINALIZADOS"
  if (descuentoRef.estado === 'FINALIZADO') {
      return (
          <div className="p-10 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Edición Restringida</h1>
              <p className="text-gray-500">
                  Esta campaña ha finalizado y no puede ser modificada por motivos de integridad histórica.
              </p>
              <a href="/admin/descuentos" className="mt-6 text-sm font-bold text-slate-900 hover:underline">
                  ← Volver al listado
              </a>
          </div>
      );
  }

  // 3. Obtener todos los IDs de productos que pertenecen a esta misma campaña
  // Agrupamos por 'nombreCampana' para traer todos los productos involucrados
  const descuentosRelacionados = await prisma.descuentoProducto.findMany({
    where: { 
        nombreCampana: descuentoRef.nombreCampana,
        // Excluimos cancelados si quisiéramos, pero para editar es mejor ver todo lo que estaba vinculado
    },
    select: { productoId: true }
  });

  const productoIdsEnCampana = descuentosRelacionados.map(d => d.productoId);

  // 4. Cargar datos para los selectores (Igual que en la página de "Nuevo")
  const categorias = await prisma.categoria.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' }
  });

  // Obtenemos productos activos para que el usuario pueda agregar más si desea
  const productosDb = await prisma.producto.findMany({
    where: { estado: 'ACTIVO' },
    select: {
      id: true,
      nombre: true,
      precio: true,
      categoriaId: true,
      categoria: { select: { id: true, nombre: true } },
      imagenes: { where: { esPortada: true }, take: 1, select: { url: true } },
      variantes: { select: { stockActual: true } } // Necesario para calcular stock total
    },
    orderBy: { nombre: 'asc' }
  });

  // Mapear al formato que espera el componente FormularioCampana
  const productosInput = productosDb.map(p => ({
    id: p.id,
    nombre: p.nombre,
    categoriaId: p.categoriaId,
    imagen: p.imagenes[0]?.url || null,
    precio: Number(p.precio),
    stockTotal: p.variantes.reduce((acc, v) => acc + v.stockActual, 0),
    estado: "ACTIVO", 
    categoria: p.categoria
  }));

  // 5. Preparar InitialData
  const initialData = {
    id: descuentoRef.id, // ID de referencia para el PUT/PATCH
    nombreCampana: descuentoRef.nombreCampana,
    descripcion: descuentoRef.descripcion,
    tipo: descuentoRef.tipo,
    valor: Number(descuentoRef.valor),
    startsAt: descuentoRef.startsAt,
    endsAt: descuentoRef.endsAt,
    productoIds: productoIdsEnCampana,
    // El formulario deducirá el modo de visualización basado en los IDs
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Editar Campaña</h1>
        <p className="text-sm text-gray-500 mt-1">
            Modifica los detalles, fechas o productos de la campaña <span className="font-medium text-slate-900">"{descuentoRef.nombreCampana}"</span>.
        </p>
      </div>

      <FormularioCampana 
         initialData={initialData}
         categorias={categorias}
         productos={productosInput}
      />
    </div>
  );
}