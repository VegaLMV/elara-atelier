export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import CompraForm from "./compra-form";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const variantes = await prisma.variante.findMany({
    include: {
      producto: { select: { id: true, nombre: true, precio: true } },
      talla: { select: { nombre: true, orden: true } },
      color: { select: { nombre: true } },
    },
    orderBy: [
      { producto: { nombre: "asc" } },
      { talla: { orden: "asc" } },
      { color: { nombre: "asc" } },
    ],
  });

  const data = {
    proveedores,
    variantes: variantes.map((v) => ({
      id: v.id,
      productoId: v.productoId,
      productoNombre: v.producto.nombre,
      productoPrecio: v.producto.precio.toString(),
      talla: v.talla.nombre,
      tallaOrden: v.talla.orden,
      color: v.color.nombre,
      sku: v.sku ?? "",
      stockActual: v.stockActual,
      activa: v.activa,
    })),
  };

  return <CompraForm initialData={data} />;
}
