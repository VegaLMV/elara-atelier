export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import DevolucionForm from "./devolucion-form";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const variantes = await prisma.variante.findMany({
    include: {
      producto: { select: { nombre: true } },
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
    variantes: variantes.map((v) => ({
      id: v.id,
      productoNombre: v.producto.nombre,
      talla: v.talla.nombre,
      tallaOrden: v.talla.orden,
      color: v.color.nombre,
      sku: v.sku ?? "",
      stockActual: v.stockActual,
      activa: v.activa,
    })),
  };

  return <DevolucionForm initialData={data} />;
}
