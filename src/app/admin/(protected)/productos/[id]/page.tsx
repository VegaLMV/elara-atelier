export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoEditor from "./producto-editor";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ IMPORTANTÍSIMO en Next 16

  if (!id) return notFound();

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      imagenes: true, 
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
    },
    variantes: producto.variantes.map((v) => ({
      id: v.id,
      tallaId: v.tallaId,
      colorId: v.colorId,
      talla: v.talla.nombre,
      color: v.color.nombre,
      stockActual: v.stockActual,
      activa: v.activa,
    })),
    referencias: {
      categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
      tallas: tallas.map((t) => ({ id: t.id, nombre: t.nombre })),
      colores: colores.map((c) => ({ id: c.id, nombre: c.nombre })),
    },
    imagenes: producto.imagenes.map((img) => ({
      id: img.id,
      url: img.url,
      esPortada: img.esPortada,
      orden: img.orden,
    })),
  };

  return <ProductoEditor initialData={data} />;
}
