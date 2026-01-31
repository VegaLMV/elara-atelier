export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

type VarianteRow = {
  id: string;
  activa: boolean;
  stockActual: number;
  talla: { nombre: string; orden: number };
  color: { nombre: string; hex: string | null };
};

function Swatch({ hex }: { hex: string | null }) {
  const valido = typeof hex === "string" && /^#([0-9a-fA-F]{6})$/.test(hex.trim());
  const bg = valido ? hex!.trim() : null;

  return (
    <span
      className="inline-block w-4 h-4 rounded border"
      style={bg ? { backgroundColor: bg } : undefined}
      title={bg ? bg : "Sin HEX"}
    />
  );
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

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { id: true, nombre: true },
  });

  if (!producto) return notFound();

  const variantes = (await prisma.variante.findMany({
    where: { productoId: id },
    select: {
      id: true,
      activa: true,
      stockActual: true,
      talla: { select: { nombre: true, orden: true } },
      color: { select: { nombre: true, hex: true } }, // ✅ incluir HEX
    },
    orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }],
  })) as VarianteRow[];

  // Agrupar por talla
  const grupos = new Map<
    string,
    {
      tallaNombre: string;
      tallaOrden: number;
      totalStock: number;
      totalStockActivo: number;
      totalVariantes: number;
      colores: Array<{
        id: string;
        color: string;
        hex: string | null;
        stock: number;
        activa: boolean;
      }>;
    }
  >();

  for (const v of variantes) {
    const key = v.talla.nombre;

    if (!grupos.has(key)) {
      grupos.set(key, {
        tallaNombre: v.talla.nombre,
        tallaOrden: v.talla.orden,
        totalStock: 0,
        totalStockActivo: 0,
        totalVariantes: 0,
        colores: [],
      });
    }

    const g = grupos.get(key)!;
    g.totalVariantes += 1;
    g.totalStock += v.stockActual;
    if (v.activa) g.totalStockActivo += v.stockActual;

    g.colores.push({
      id: v.id,
      color: v.color.nombre,
      hex: v.color.hex ?? null,
      stock: v.stockActual,
      activa: v.activa,
    });
  }

  const tallasOrdenadas = [...grupos.values()].sort((a, b) => a.tallaOrden - b.tallaOrden);

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
          <a className="underline" href="/admin/productos">
            Volver
          </a>
          <a className="underline" href={`/admin/productos/${producto.id}`}>
            Editar
          </a>
        </div>
      </div>

      {tallasOrdenadas.length === 0 ? (
        <div className="border rounded-xl p-4 text-sm opacity-80">
          No hay variantes registradas para este producto.
        </div>
      ) : (
        <div className="space-y-3">
          {tallasOrdenadas.map((t, idx) => (
            <details
              key={t.tallaNombre}
              className="border rounded-xl overflow-hidden"
              open={idx === 0}
            >
              <summary className="list-none cursor-pointer select-none p-4 border-b flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Talla {t.tallaNombre}</div>
                  <div className="text-sm opacity-80">
                    Variantes: <b>{t.totalVariantes}</b> · Stock total: <b>{t.totalStock}</b> · Stock activo:{" "}
                    <b>{t.totalStockActivo}</b>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.colores.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-2 text-xs opacity-80">
                        <Swatch hex={c.hex} />
                        <span className="line-clamp-1">{c.color}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm opacity-70 flex items-center gap-2">
                  <span>Ver colores</span>
                  <span className="opacity-60">▾</span>
                </div>
              </summary>

              <div className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="text-left p-3">Color</th>
                      <th className="text-left p-3">Stock</th>
                      <th className="text-left p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.colores.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Swatch hex={c.hex} />
                            <span>{c.color}</span>
                            {c.hex ? <span className="text-xs opacity-60">{c.hex}</span> : null}
                          </div>
                        </td>
                        <td className="p-3">{c.stock}</td>
                        <td className="p-3">{c.activa ? "Activa" : "Inactiva"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}

    </div>
  );
}
