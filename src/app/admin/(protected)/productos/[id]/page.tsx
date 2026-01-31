export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoEditor from "./producto-editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return notFound();

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      imagenes: true,
      imagenesColor: { include: { color: true } },
      variantes: { include: { talla: true, color: true } },
    },
  });

  if (!producto) return notFound();

  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: "asc" } });
  const tallas = await prisma.talla.findMany({ orderBy: { orden: "asc" } });
  const colores = await prisma.color.findMany({ orderBy: { nombre: "asc" } });

  const data = {
    producto: {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      precio: producto.precio.toString(),
      estado: producto.estado,
      destacado: producto.destacado,
      categoriaId: producto.categoriaId ?? "",
      descuentoActivo: producto.descuentoActivo,
      descuentoTipo: (producto.descuentoTipo ?? "PORCENTAJE") as any,
      descuentoValor: producto.descuentoValor?.toString?.() ?? "",
      descuentoInicio: producto.descuentoInicio ? producto.descuentoInicio.toISOString().slice(0, 10) : "",
      descuentoFin: producto.descuentoFin ? producto.descuentoFin.toISOString().slice(0, 10) : "",
    },
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
}
