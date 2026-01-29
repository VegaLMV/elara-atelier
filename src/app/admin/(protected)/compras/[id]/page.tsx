export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function badgeTipo(tipo: string) {
  const base = "inline-block px-2 py-0.5 rounded-full text-xs border";
  if (tipo === "COMPRA") return `${base} bg-green-50 border-green-200`;
  if (tipo === "AJUSTE") return `${base} bg-yellow-50 border-yellow-200`;
  if (tipo === "DEVOLUCION") return `${base} bg-red-50 border-red-200`;
  return `${base} bg-gray-50 border-gray-200`;
}

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

  const compra = await prisma.compra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      items: {
        include: {
          variante: {
            include: {
              producto: true,
              talla: true,
              color: true,
            },
          },
        },
        orderBy: [
          { variante: { producto: { nombre: "asc" } } },
          { variante: { talla: { orden: "asc" } } },
          { variante: { color: { nombre: "asc" } } },
        ],
      },
    },
  });

  if (!compra) return notFound();

  const totalItems = compra.items.reduce((acc, it) => acc + it.cantidad, 0);

  const subtotal = compra.items.reduce((acc, it) => {
    const cu = Number(it.costoUnitario.toString());
    return acc + cu * it.cantidad;
  }, 0);

  const envio = Number(compra.costoEnvio?.toString?.() ?? 0);
  const otros = Number(compra.otrosCostos?.toString?.() ?? 0);
  const total = subtotal + envio + otros;

  // -----------------------------
  // KARDEX: compra + (ajustes y devoluciones posteriores)
  // -----------------------------
  const varianteIds = Array.from(new Set(compra.items.map((it) => it.varianteId)));

  const movimientos = await prisma.movimientoInventario.findMany({
    where: {
      OR: [
        // movimientos directamente asociados a esta compra (idealmente COMPRA)
        { compraId: compra.id },

        // ajustes o devoluciones posteriores en variantes que fueron parte de la compra
        {
          varianteId: { in: varianteIds },
          tipo: { in: ["AJUSTE", "DEVOLUCION"] },
          creadoEn: { gte: compra.fechaCompra },
        },
      ],
    },
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
    take: 300, // suficiente para historial relacionado
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Detalle de compra</h1>
          <p className="text-sm opacity-80">
            Estado: <b>{compra.estado}</b> · Ítems: <b>{totalItems}</b>
          </p>
        </div>

        <Link className="underline" href="/admin/compras">
          ← Volver
        </Link>
      </div>

      <div className="border rounded-xl p-4 space-y-2">
        <p className="text-sm">
          <b>Fecha:</b> {new Date(compra.fechaCompra).toLocaleDateString("es-PE")}
        </p>
        <p className="text-sm">
          <b>Proveedor:</b> {compra.proveedor?.nombre ?? "—"}
        </p>

        {typeof envio === "number" ? (
          <p className="text-sm">
            <b>Envío:</b> {soles(envio)} · <b>Otros:</b> {soles(otros)}
          </p>
        ) : null}

        {compra.notas ? (
          <p className="text-sm whitespace-pre-wrap">
            <b>Notas:</b> {compra.notas}
          </p>
        ) : null}
      </div>

      {/* ITEMS */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Ítems de la compra</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Producto</th>
              <th className="text-left p-3">Talla</th>
              <th className="text-left p-3">Color</th>
              <th className="text-right p-3">Cantidad</th>
              <th className="text-right p-3">Costo unit.</th>
              <th className="text-right p-3">Importe</th>
            </tr>
          </thead>
          <tbody>
            {compra.items.map((it) => {
              const cu = Number(it.costoUnitario.toString());
              const imp = cu * it.cantidad;

              return (
                <tr key={it.id} className="border-t">
                  <td className="p-3">{it.variante.producto.nombre}</td>
                  <td className="p-3">{it.variante.talla.nombre}</td>
                  <td className="p-3">{it.variante.color.nombre}</td>
                  <td className="p-3 text-right">{it.cantidad}</td>
                  <td className="p-3 text-right">{soles(cu)}</td>
                  <td className="p-3 text-right">{soles(imp)}</td>
                </tr>
              );
            })}

            {compra.items.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  No hay ítems en esta compra.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* TOTALES */}
      <div className="border rounded-xl p-4 space-y-1 text-sm max-w-xl">
        <div className="flex justify-between">
          <span>Subtotal ítems</span>
          <b>{soles(subtotal)}</b>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <b>{soles(envio)}</b>
        </div>
        <div className="flex justify-between">
          <span>Otros</span>
          <b>{soles(otros)}</b>
        </div>
        <div className="flex justify-between text-base pt-2 border-t">
          <span>Total</span>
          <b>{soles(total)}</b>
        </div>
      </div>

      {/* KARDEX */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kardex relacionado</h2>
          <p className="text-sm opacity-80">
            Incluye <b>COMPRA</b> de esta compra + <b>AJUSTE</b>/<b>DEVOLUCIÓN</b> posteriores en sus variantes.
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Producto</th>
              <th className="text-left p-3">Talla</th>
              <th className="text-left p-3">Color</th>
              <th className="text-right p-3">Cambio</th>
              <th className="text-right p-3">Costo unit.</th>
              <th className="text-left p-3">Nota</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => {
              const cu = m.costoUnitario ? Number(m.costoUnitario.toString()) : null;
              const v = m.variante;
              return (
                <tr key={m.id} className="border-t">
                  <td className="p-3">
                    {new Date(m.creadoEn).toLocaleString("es-PE")}
                  </td>
                  <td className="p-3">
                    <span className={badgeTipo(m.tipo)}>{m.tipo}</span>
                  </td>
                  <td className="p-3">{v.producto.nombre}</td>
                  <td className="p-3">{v.talla.nombre}</td>
                  <td className="p-3">{v.color.nombre}</td>
                  <td className="p-3 text-right">{m.cambioCantidad > 0 ? `+${m.cambioCantidad}` : m.cambioCantidad}</td>
                  <td className="p-3 text-right">{cu === null ? "—" : soles(cu)}</td>
                  <td className="p-3">{m.nota ?? "—"}</td>
                </tr>
              );
            })}

            {movimientos.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={8}>
                  No hay movimientos para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
