export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import ProductoEditor from "./producto-editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // 1. Verify Admin Session
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  if (!id) return notFound();

  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        imagenes: true,
        imagenesColor: { include: { color: true } },
        variantes: { include: { talla: true, color: true } },
        // ✅ Include historical discounts for the editor
        descuentos: {
          orderBy: { startsAt: "desc" },
        },
      },
    });

    if (!producto) return notFound();

    // Fetch references for the editor select inputs
    const [categorias, tallas, colores] = await Promise.all([
      prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
      prisma.talla.findMany({ orderBy: { orden: "asc" } }),
      prisma.color.findMany({ orderBy: { nombre: "asc" } }),
    ]);

    // Prepare data object for the client component
    const data = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio: producto.precio.toString(),
        estado: producto.estado,
        destacado: producto.destacado,
        categoriaId: producto.categoriaId ?? "",
        
        // Manual/Legacy discount fields
        descuentoActivo: producto.descuentoActivo,
        descuentoTipo: (producto.descuentoTipo ?? "PORCENTAJE") as any,
        descuentoValor: producto.descuentoValor?.toString?.() ?? "",
        descuentoInicio: producto.descuentoInicio ? producto.descuentoInicio.toISOString().slice(0, 10) : "",
        descuentoFin: producto.descuentoFin ? producto.descuentoFin.toISOString().slice(0, 10) : "",
      },
      // Map discounts for the new manager
      descuentosHistorial: producto.descuentos.map((d) => ({
        id: d.id,
        tipo: d.tipo,
        valor: d.valor.toString(),
        startsAt: d.startsAt.toISOString(),
        endsAt: d.endsAt.toISOString(),
        estado: d.estado,
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
    console.error("Error loading product:", error);
    // In dev, sometimes connection fails. We can show a friendly error or throw to Next error boundary
    throw error;
  }
}