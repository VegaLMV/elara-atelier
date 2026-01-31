export const runtime = "nodejs";
export const revalidate = 60;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoDetalle from "./producto-detalle";
import { absolutizeUrl, baseUrl } from "@/lib/site";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function calcDescuento(p: {
  precio: any; // Decimal
  descuentoActivo: boolean;
  descuentoTipo: "PORCENTAJE" | "MONTO" | null;
  descuentoValor: any | null; // Decimal
  descuentoInicio: Date | null;
  descuentoFin: Date | null;
}) {
  const precio = Number(p.precio?.toString?.() ?? p.precio);
  const valor = Number(p.descuentoValor?.toString?.() ?? p.descuentoValor ?? 0);

  if (!p.descuentoActivo) return { activo: false, precioFinal: null as number | null, label: "" };
  if (!Number.isFinite(precio) || precio <= 0) return { activo: false, precioFinal: null, label: "" };
  if (!Number.isFinite(valor) || valor <= 0) return { activo: false, precioFinal: null, label: "" };

  // validar vigencia por fecha (comparación YYYY-MM-DD)
  const hoy = ymd(new Date());
  const ini = p.descuentoInicio ? ymd(p.descuentoInicio) : "";
  const fin = p.descuentoFin ? ymd(p.descuentoFin) : "";

  if (ini && hoy < ini) return { activo: false, precioFinal: null, label: "" };
  if (fin && hoy > fin) return { activo: false, precioFinal: null, label: "" };

  let final = precio;
  let label = "";

  if (p.descuentoTipo === "PORCENTAJE") {
    final = precio * (1 - valor / 100);
    label = `-${valor}%`;
  } else if (p.descuentoTipo === "MONTO") {
    final = precio - valor;
    label = `-S/ ${valor.toFixed(2)}`;
  } else {
    return { activo: false, precioFinal: null, label: "" };
  }

  final = Math.max(0, final);
  return { activo: true, precioFinal: final, label };
}

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
      imagenesColor: { include: { color: true } },
      variantes: { include: { talla: true, color: true } },
    },
  });

  if (!producto || producto.estado !== "ACTIVO") return notFound();

  // variantes vendibles (solo activas y stock > 0)
  const variantesConStock = producto.variantes
    .filter((v) => v.activa && v.stockActual > 0)
    .sort((a, b) => a.talla.orden - b.talla.orden || a.color.nombre.localeCompare(b.color.nombre));

  const hayStock = variantesConStock.length > 0;

  const imagenes = producto.imagenes
    .slice()
    .sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden)
    .map((i) => ({ id: i.id, url: i.url, esPortada: i.esPortada, orden: i.orden }));

  const imagenesColor = producto.imagenesColor
    .slice()
    .sort((a, b) => a.color.nombre.localeCompare(b.color.nombre))
    .map((x) => ({
      id: x.id,
      colorId: x.colorId,
      color: x.color.nombre,
      hex: x.color.hex,
      url: x.url,
    }));

  const wa = process.env.WHATSAPP_NUMERO ?? "";

  const desc = calcDescuento({
    precio: producto.precio,
    descuentoActivo: producto.descuentoActivo,
    descuentoTipo: producto.descuentoTipo as any,
    descuentoValor: producto.descuentoValor,
    descuentoInicio: producto.descuentoInicio,
    descuentoFin: producto.descuentoFin,
  });

  return (
    <ProductoDetalle
      producto={{
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio: producto.precio.toString(),
        categoria: producto.categoria?.nombre ?? "",
        // ✅ descuento
        descuentoActivo: desc.activo,
        descuentoLabel: desc.label,
        precioFinal: desc.precioFinal === null ? null : desc.precioFinal.toFixed(2),
      }}
      imagenes={imagenes}
      imagenesColor={imagenesColor}
      variantes={
        hayStock
          ? variantesConStock.map((v) => ({
              id: v.id,
              talla: v.talla.nombre,
              tallaOrden: v.talla.orden,
              colorId: v.colorId,
              color: v.color.nombre,
              colorHex: v.color.hex,
              stock: v.stockActual,
            }))
          : []
      }
      whatsappNumero={wa}
      agotado={!hayStock}
    />
  );
}
