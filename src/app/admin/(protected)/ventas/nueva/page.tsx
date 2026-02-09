import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import PosClient from "./pos-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Siempre datos frescos para evitar vender sin stock

/**
 * ============================================================================
 * PÁGINA: PUNTO DE VENTA (POS)
 * ============================================================================
 * Carga inicial de datos maestros para la interfaz de venta rápida.
 * Optimizado para traer solo productos con stock > 0.
 */
export default async function NuevaVentaPage() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // Carga paralela de datos maestros
  const [productosDb, clientesDb, empaquesDb, categoriasDb] = await Promise.all([
    // 1. Productos (Solo activos y con stock en alguna variante)
    prisma.producto.findMany({
      where: {
        estado: "ACTIVO",
        variantes: { some: { stockActual: { gt: 0 }, activa: true } }
      },
      select: {
        id: true,
        nombre: true,
        precio: true,
        categoriaId: true,
        // Datos de descuento vigentes
        descuentoActivo: true,
        descuentoTipo: true,
        descuentoValor: true,
        descuentoInicio: true,
        descuentoFin: true,
        imagenes: {
          where: { esPortada: true },
          take: 1,
          select: { url: true }
        },
        variantes: {
          where: { stockActual: { gt: 0 }, activa: true },
          select: {
            id: true,
            talla: { select: { nombre: true } },
            color: { select: { nombre: true, hex: true } },
            stockActual: true,
          },
          orderBy: { talla: { orden: 'asc' } }
        }
      },
      orderBy: { nombre: "asc" }
    }),

    // 2. Clientes (Para buscador rápido)
    prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, dni: true, email: true }
    }),

    // 3. Empaques (Insumos)
    prisma.tipoEmpaque.findMany({
      where: { activo: true, stock: { gt: 0 } },
      select: { id: true, nombre: true, stock: true, costoUnitario: true, imagenUrl: true }
    }),

    // 4. Categorías (Para filtros)
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true }
    })
  ]);

  // Transformación ligera para el cliente
  const productos = productosDb.map(p => ({
    id: p.id,
    nombre: p.nombre,
    precioBase: Number(p.precio),
    categoriaId: p.categoriaId,
    imagen: p.imagenes[0]?.url || null,
    descuento: p.descuentoActivo ? {
      tipo: p.descuentoTipo,
      valor: Number(p.descuentoValor),
      inicio: p.descuentoInicio?.toISOString() || null,
      fin: p.descuentoFin?.toISOString() || null
    } : null,
    variantes: p.variantes.map(v => ({
      id: v.id,
      talla: v.talla.nombre,
      color: v.color.nombre,
      hex: v.color.hex,
      stock: v.stockActual
    }))
  }));

  const empaques = empaquesDb.map(e => ({
    id: e.id,
    nombre: e.nombre,
    stock: e.stock,
    imagenUrl: e.imagenUrl,
    costo: Number(e.costoUnitario)
  }));

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <PosClient
        productosIniciales={productos}
        clientesIniciales={clientesDb}
        empaquesIniciales={empaques}
        categorias={categoriasDb}
      />
    </div>
  );
}