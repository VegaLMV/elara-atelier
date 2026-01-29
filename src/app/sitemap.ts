import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { baseUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  const productos = await prisma.producto.findMany({
    where: { estado: "ACTIVO" },
    select: { slug: true, actualizadoEn: true },
  });

  return [
    { url: `${base}/catalogo`, lastModified: new Date() },
    ...productos.map((p) => ({
      url: `${base}/catalogo/${p.slug}`,
      lastModified: p.actualizadoEn,
    })),
  ];
}
