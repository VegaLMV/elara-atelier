import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import CompraForm from "./compra-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

/**
 * ============================================================================
 * PÁGINA: REGISTRAR NUEVA COMPRA
 * ============================================================================
 * Carga datos maestros (Productos, Proveedores, Empaques) y renderiza el formulario.
 * Soporta parámetros 'prefill' para cargas rápidas desde inventario bajo.
 */
export default async function NuevaCompraPage({ searchParams }: Props) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // 1. Obtener datos maestros en paralelo
  const [proveedoresDB, productosDB, empaquesDB] = await Promise.all([
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),

    // Productos Activos (Optimizados)
    prisma.producto.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        precio: true,
        estado: true,
        descuentoValor: true,
        imagenes: { select: { url: true, esPortada: true }, orderBy: { esPortada: 'desc' }, take: 1 },
        imagenesColor: { select: { url: true, colorId: true } },
        variantes: {
          include: { talla: true, color: true },
          orderBy: [{ talla: { orden: 'asc' } }]
        },
      }
    }),

    // Empaques Activos
    prisma.tipoEmpaque.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, stock: true, costoUnitario: true, imagenUrl: true }
    })
  ]);

  // 2. Normalizar Datos (Decimal -> Number)
  const productosProcesados = productosDB.map(p => ({
    ...p,
    precio: Number(p.precio),
    descuentoValor: p.descuentoValor ? Number(p.descuentoValor) : 0,
    proveedorSugerido: null,
    variantes: p.variantes.map(v => ({
      ...v,
      color: { ...v.color, hex: v.color.hex }
    }))
  }));

  const empaquesProcesados = empaquesDB.map(e => ({
    ...e,
    costoUnitario: Number(e.costoUnitario)
  }));

  // 3. Prefill desde URL
  const sp = await searchParams;
  const prefillData = {
    productoId: typeof sp.prefillProducto === 'string' ? sp.prefillProducto : undefined,
    varianteId: typeof sp.prefillVariante === 'string' ? sp.prefillVariante : undefined,
    empaqueId: typeof sp.prefillEmpaque === 'string' ? sp.prefillEmpaque : undefined,
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8 bg-gray-50/50 min-h-screen">

      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex items-center gap-4">
        <Link
          href="/admin/compras"
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Registrar Ingreso</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Actualiza tu inventario ingresando productos o empaques.
          </p>
        </div>
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