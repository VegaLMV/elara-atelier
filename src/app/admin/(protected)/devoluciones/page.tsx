export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

type SP = { q?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const where: Prisma.MovimientoInventarioWhereInput = { tipo: "DEVOLUCION" };

  if (q) {
    where.OR = [
      { nota: { contains: q, mode: "insensitive" } },
      { variante: { is: { producto: { is: { nombre: { contains: q, mode: "insensitive" } } } } } },
      { variante: { is: { sku: { contains: q, mode: "insensitive" } } } },
      { variante: { is: { talla: { is: { nombre: { contains: q, mode: "insensitive" } } } } } },
      { variante: { is: { color: { is: { nombre: { contains: q, mode: "insensitive" } } } } } },
    ];
  }

  const rows = await prisma.movimientoInventario.findMany({
    where,
    include: {
      variante: {
        include: {
          producto: true,
          talla: true,
          color: true,
        },
      },
    },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Devoluciones</h1>
          <p className="text-sm opacity-80">Resta stock y registra movimiento DEVOLUCIÓN.</p>
        </div>

        <div className="flex gap-3">
          <Link className="underline" href="/admin">
            ← Admin
          </Link>
          <Link className="bg-black text-white rounded-md px-4 py-2" href="/admin/devoluciones/nueva">
            + Nueva devolución
          </Link>
        </div>
      </div>

      <form className="flex gap-2" action="/admin/devoluciones">
        <input
          className="w-full max-w-lg border rounded-md px-3 py-2"
          name="q"
          placeholder="Buscar por producto, SKU, talla, color o nota…"
          defaultValue={q}
        />
        <button className="border rounded-md px-4 py-2">Buscar</button>
      </form>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Producto</th>
              <th className="text-left p-3">Talla</th>
              <th className="text-left p-3">Color</th>
              <th className="text-right p-3">Cambio</th>
              <th className="text-left p-3">Nota</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((m) => {
              const cambio = Number(m.cambioCantidad || 0);
              const cambioTxt = `${cambio > 0 ? "+" : ""}${cambio}`;
              const cambioClass = cambio < 0 ? "text-red-500" : cambio > 0 ? "text-green-500" : "";

              return (
                <tr key={m.id} className="border-t">
                  <td className="p-3">{new Date(m.creadoEn).toLocaleString("es-PE")}</td>
                  <td className="p-3">{m.variante.producto.nombre}</td>
                  <td className="p-3">{m.variante.talla.nombre}</td>
                  <td className="p-3">{m.variante.color.nombre}</td>
                  <td className={`p-3 text-right font-semibold ${cambioClass}`}>{cambioTxt}</td>
                  <td className="p-3">{m.nota ?? "—"}</td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  No hay devoluciones aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
