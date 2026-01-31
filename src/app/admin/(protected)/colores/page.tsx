export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import ColoresClient from "./colores-client";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const colores = await prisma.color.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      hex: true,
      _count: { select: { variantes: true } },
    },
  });

  const rows = colores.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    hex: c.hex,
    usos: c._count.variantes,
  }));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">COLORES</h1>
        <p className="text-sm opacity-80">Gestiona colores</p>
      </div>

      <ColoresClient initialRows={rows} />
    </div>
  );
}
