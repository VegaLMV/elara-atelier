export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

type SP = { q?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/admin/login");

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  const where =
    q.length > 0
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { ruc: { contains: q, mode: "insensitive" as const } },
            { telefono: { contains: q, mode: "insensitive" as const } },
            { correo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

  const rows = await prisma.proveedor.findMany({
    where,
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, ruc: true, telefono: true, correo: true, direccion: true },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm opacity-80">Crea y administra proveedores para compras.</p>
        </div>

        <Link className="bg-black text-white rounded-md px-4 py-2" href="/admin/proveedores/nuevo">
          + Nuevo proveedor
        </Link>
      </div>

      <form className="flex gap-2 max-w-xl">
        <input
          name="q"
          defaultValue={q}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Buscar por nombre, RUC, teléfono o correo…"
        />
        <button className="border rounded-md px-4 py-2">Buscar</button>
      </form>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">RUC</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-left p-3">Correo</th>
              <th className="text-left p-3">Dirección</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.nombre}</td>
                <td className="p-3">{p.ruc ?? "—"}</td>
                <td className="p-3">{p.telefono ?? "—"}</td>
                <td className="p-3">{p.correo ?? "—"}</td>
                <td className="p-3">{p.direccion ?? "—"}</td>
                <td className="p-3">
                  <Link className="underline" href={`/admin/proveedores/${p.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={6}>
                  No hay proveedores aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link className="underline" href="/admin/compras">
        ← Volver a compras
      </Link>
    </div>
  );
}
