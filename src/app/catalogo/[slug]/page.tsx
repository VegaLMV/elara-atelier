export const runtime = "nodejs";
export const revalidate = 60;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoDetalle from "./producto-detalle";
import { absolutizeUrl, baseUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const p = await prisma.producto.findUnique({
    where: { slug },
    select: {
      nombre: true,
      descripcion: true,
      estado: true,
      slug: true,
      imagenes: { select: { url: true, esPortada: true, orden: true } },
    },
  });

  if (!p || p.estado !== "ACTIVO") {
    return { title: "Producto no encontrado | Elara Atelier", robots: { index: false, follow: false } };
  }

  const portada =
    p.imagenes
      .slice()
      .sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden)[0]?.url ?? "/og-default.jpg";

  const url = new URL(`/catalogo/${p.slug}`, baseUrl()).toString();
  const title = p.nombre;
  const desc =
    (p.descripcion ?? "").trim().slice(0, 160) ||
    `Descubre ${p.nombre} en el catálogo de Elara Atelier.`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description: desc,
      images: [{ url: absolutizeUrl(portada), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [absolutizeUrl(portada)],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const producto = await prisma.producto.findUnique({
    where: { slug },
    include: {
      categoria: true,
      imagenes: true,
      variantes: { include: { talla: true, color: true } },
    },
  });

  if (!producto || producto.estado !== "ACTIVO") return notFound();

  const variantesConStock = producto.variantes
    .filter((v) => v.activa && v.stockActual > 0)
    .sort((a, b) => a.talla.orden - b.talla.orden || a.color.nombre.localeCompare(b.color.nombre));

  const hayStock = variantesConStock.length > 0;

  const imagenes = producto.imagenes
    .slice()
    .sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden)
    .map((i) => ({ id: i.id, url: i.url, esPortada: i.esPortada, orden: i.orden }));

  const wa = process.env.WHATSAPP_NUMERO ?? "";

  return (
    <ProductoDetalle
      producto={{
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio: producto.precio.toString(),
        categoria: producto.categoria?.nombre ?? "",
      }}
      imagenes={imagenes}
      variantes={
        hayStock
          ? variantesConStock.map((v) => ({
              id: v.id,
              talla: v.talla.nombre,
              tallaOrden: v.talla.orden,
              color: v.color.nombre,
              stock: v.stockActual,
            }))
          : []
      }
      whatsappNumero={wa}
      agotado={!hayStock}
    />
  );
}
