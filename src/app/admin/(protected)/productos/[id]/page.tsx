export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import ProductoEditor from "./producto-editor";

/**
 * ============================================================================
 * PÁGINA: WRAPPER DE EDICIÓN DE PRODUCTO
 * ============================================================================
 * Carga todos los datos del producto (Info, Variantes, Imágenes, Historial)
 * y referencias necesarias (Tallas, Colores, Categorías) para el editor.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  if (!id) return notFound();

  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        imagenes: { orderBy: { orden: 'asc' } },
        imagenesColor: { include: { color: true } },
        variantes: { include: { talla: true, color: true } },
        
        // ✅ CORRECCIÓN: Usamos la relación correcta 'participacionesCampana'
        // para obtener el historial de campañas donde participó este producto.
        participacionesCampana: {
          include: {
            campana: true // Traemos los datos de la campaña padre
          },
          orderBy: {
            campana: { startsAt: 'desc' }
          }
        },
      },
    });

    if (!producto) return notFound();

    // Referencias para selectores
    const [categorias, tallas, colores] = await Promise.all([
      prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
      prisma.talla.findMany({ orderBy: { orden: "asc" } }),
      prisma.color.findMany({ orderBy: { nombre: "asc" } }),
    ]);

    // Mapeo de datos para el cliente
    const data = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio: producto.precio.toString(),
        estado: producto.estado,
        destacado: producto.destacado,
        categoriaId: producto.categoriaId ?? "",
        
        // Campos de descuento manual (Legacy/Directo)
        descuentoActivo: producto.descuentoActivo,
        descuentoTipo: (producto.descuentoTipo ?? "PORCENTAJE") as any,
        descuentoValor: producto.descuentoValor?.toString?.() ?? "",
        descuentoInicio: producto.descuentoInicio ? producto.descuentoInicio.toISOString().slice(0, 10) : "",
        descuentoFin: producto.descuentoFin ? producto.descuentoFin.toISOString().slice(0, 10) : "",
      },
      
      // ✅ MAPEO CORREGIDO: Transformamos Campaña -> DescuentoItem
      descuentosHistorial: producto.participacionesCampana.map((p) => ({
        id: p.campana.id,
        tipo: p.campana.tipo,
        valor: p.campana.valor.toString(),
        startsAt: p.campana.startsAt.toISOString(),
        endsAt: p.campana.endsAt.toISOString(),
        estado: p.campana.estado,
      })),

      variantes: producto.variantes.map((v) => ({
        id: v.id,
        tallaId: v.tallaId,
        colorId: v.colorId,
        talla: v.talla.nombre,
        color: v.color.nombre,
        colorHex: v.color.hex ?? null,
        stockActual: v.stockActual,
        activa: v.activa,
      })),
      
      referencias: {
        categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
        tallas: tallas.map((t) => ({ id: t.id, nombre: t.nombre })),
        colores: colores.map((c) => ({ id: c.id, nombre: c.nombre, hex: c.hex })),
      },
      
      imagenes: producto.imagenes.map((img) => ({
        id: img.id,
        url: img.url,
        esPortada: img.esPortada,
        orden: img.orden,
      })),
      
      imagenesColor: producto.imagenesColor.map((x) => ({
        id: x.id,
        url: x.url,
        colorId: x.colorId,
        colorNombre: x.color.nombre,
        colorHex: x.color.hex,
      })),
    };

    return <ProductoEditor initialData={data} />;
  } catch (error) {
    console.error("Error cargando producto:", error);
    throw error;
  }
}