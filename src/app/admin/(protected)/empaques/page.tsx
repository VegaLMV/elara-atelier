export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import EmpaquesClient from "./empaques-client";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const empaques = await prisma.tipoEmpaque.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, costoUnitario: true, activo: true },
  });

  const rows = empaques.map((e) => ({
    ...e,
    costoUnitario: e.costoUnitario.toString(),
  }));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Empaques</h1>
        <p className="text-sm opacity-80">Crea empaques (bolsa, caja, etc.) con su costo unitario.</p>
      </div>

      <EmpaquesClient initialRows={rows} />
    </div>
  );
}
