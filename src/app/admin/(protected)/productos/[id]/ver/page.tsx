export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const { id } = await params;
  if (!id) return notFound();

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { id: true, nombre: true },
  });

  if (!producto) return notFound();

  const variantes = await prisma.variante.findMany({
    where: { productoId: id },
    select: {
      id: true,
      activa: true,
      stockActual: true,
      talla: { select: { nombre: true, orden: true } },
      color: { select: { nombre: true } },
    },
    orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }],
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Variantes</h1>
          <p className="text-sm opacity-80">
            Producto: <b>{producto.nombre}</b>
          </p>
        </div>

        <div className="flex gap-3">
          <a className="underline" href="/admin/productos">Volver</a>
          <a className="underline" href={`/admin/productos/${producto.id}`}>Editar</a>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Talla</th>
              <th className="text-left p-3">Color</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {variantes.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-3">{v.talla.nombre}</td>
                <td className="p-3">{v.color.nombre}</td>
                <td className="p-3">{v.stockActual}</td>
                <td className="p-3">{v.activa ? "Activa" : "Inactiva"}</td>
              </tr>
            ))}
            {variantes.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
                  No hay variantes registradas para este producto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs opacity-70">
        Orden: talla.orden asc (XS→S→M→L→XL), luego color asc.
      </p>
    </div>
  );
}
