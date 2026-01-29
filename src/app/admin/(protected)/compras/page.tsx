export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";


function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

type SP = {
  q?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const where: Prisma.CompraWhereInput = {};
  if (q) {
    where.OR = [
      { notas: { contains: q, mode: "insensitive" } },
      { proveedor: { is: { nombre: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const compras = await prisma.compra.findMany({
    where,
    include: {
      proveedor: true,
      items: { select: { cantidad: true, costoUnitario: true } },
    },
    orderBy: { fechaCompra: "desc" },
    take: 100,
  });

  const rows = compras.map((c) => {
    const totalItems = c.items.reduce((acc, it) => acc + it.cantidad, 0);
    const subtotal = c.items.reduce((acc, it) => acc + it.cantidad * Number(it.costoUnitario.toString()), 0);
    const envio = c.costoEnvio ? Number(c.costoEnvio.toString()) : 0;
    const otros = c.otrosCostos ? Number(c.otrosCostos.toString()) : 0;
    const total = subtotal + envio + otros;

    return {
      id: c.id,
      fecha: c.fechaCompra,
      proveedor: c.proveedor?.nombre ?? "—",
      estado: c.estado,
      totalItems,
      total,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Compras</h1>
          <p className="text-sm opacity-80">Ingresos de mercadería (RECIBIDO sube stock y registra kardex).</p>
        </div>

        <Link className="bg-black text-white rounded-md px-4 py-2" href="/admin/compras/nueva">
          + Nueva compra
        </Link>
      </div>

      <form className="flex gap-2 items-center max-w-xl">
        <input
          name="q"
          defaultValue={q}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Buscar por proveedor o nota…"
        />
        <button className="border rounded-md px-3 py-2">Buscar</button>
      </form>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Proveedor</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Ítems</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
                <tr key={r.id} className="border-t">
                <td className="p-3">{new Date(r.fecha).toLocaleDateString("es-PE")}</td>
                <td className="p-3">{r.proveedor}</td>
                <td className="p-3">{r.estado}</td>
                <td className="p-3">{r.totalItems}</td>
                <td className="p-3">{soles(r.total)}</td>

                <td className="p-3">
                    <Link className="underline" href={`/admin/compras/${r.id}`}>
                    Detalle
                    </Link>
                </td>
                </tr>
            ))}

            {rows.length === 0 && (
                <tr>
                <td className="p-3" colSpan={6}>
                    No hay compras aún.
                </td>
                </tr>
            )}
            </tbody>
        </table>
      </div>
    </div>
  );
}
