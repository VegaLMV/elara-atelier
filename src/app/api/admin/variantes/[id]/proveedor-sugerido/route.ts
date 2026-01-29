export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const varianteId = params.id;
  if (!varianteId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const ultimo = await prisma.itemCompra.findFirst({
    where: {
      varianteId,
      compra: { proveedorId: { not: null } },
    },
    include: {
      compra: { include: { proveedor: true } },
    },
    orderBy: {
      compra: { fechaCompra: "desc" },
    },
  });

  const prov = ultimo?.compra?.proveedor;
  if (!prov) {
    return NextResponse.json({ proveedorId: null, proveedorNombre: null, fuente: null });
  }

  return NextResponse.json({
    proveedorId: prov.id,
    proveedorNombre: prov.nombre,
    fuente: "HISTORIAL_ULTIMO",
  });
}
