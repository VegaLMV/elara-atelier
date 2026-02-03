import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import CompraForm from "./compra-form";

// Definimos los props que recibe Page
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export const dynamic = "force-dynamic";

export default async function NuevaCompraPage({ searchParams }: Props) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // 1. Obtener datos maestros (Proveedores, Productos, Empaques)
  const [proveedoresDB, productosDB, empaquesDB] = await Promise.all([
    // Proveedores ordenados
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
    
    // Productos Activos con IMÁGENES y COLORES
    prisma.producto.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { nombre: "asc" },
      include: {
        imagenes: {
            select: { url: true, esPortada: true },
            orderBy: { esPortada: 'desc' },
            take: 1 
        },
        imagenesColor: {
            select: { url: true, colorId: true }
        },
        variantes: {
          include: { 
              talla: true, 
              color: true 
          },
          orderBy: [{ talla: { orden: 'asc' } }]
        },
      },
    }),

    // Empaques Activos
    prisma.tipoEmpaque.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true, stock: true, costoUnitario: true, imagenUrl: true } 
    })
  ]);

  // 2. Transformar datos de Productos (CORRECCIÓN CRÍTICA AQUÍ)
  const productosProcesados = productosDB.map(p => ({
    ...p,
    precio: Number(p.precio), // Convertir Decimal a Number
    descuentoValor: p.descuentoValor ? Number(p.descuentoValor) : 0,
    proveedorSugerido: null,
    variantes: p.variantes.map(v => ({
        ...v,
        color: { ...v.color, hex: v.color.hex } 
    }))
  }));

  // 3. Transformar datos de Empaques
  const empaquesProcesados = empaquesDB.map(e => ({
      ...e,
      costoUnitario: Number(e.costoUnitario) // Convertir Decimal a Number
  }));

  // 4. Leer parámetros de URL
  const sp = await searchParams;
  const prefillData = {
    productoId: typeof sp.prefillProducto === 'string' ? sp.prefillProducto : undefined,
    varianteId: typeof sp.prefillVariante === 'string' ? sp.prefillVariante : undefined,
    empaqueId: typeof sp.prefillEmpaque === 'string' ? sp.prefillEmpaque : undefined,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Registrar Compra</h1>
        <p className="text-gray-500 mt-2">Ingresa la mercadería recibida (Ropa o Empaques) para actualizar el stock.</p>
      </div>

      <CompraForm 
        proveedores={proveedoresDB} 
        productos={productosProcesados} 
        empaques={empaquesProcesados}
        prefill={prefillData}
      />
    </div>
  );
}