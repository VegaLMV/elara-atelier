export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: productoId } = await ctx.params;
  if (!productoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const last = await prisma.itemCompra.findFirst({
    where: {
      variante: { productoId },
      compra: { proveedorId: { not: null } },
    },
    orderBy: { compra: { fechaCompra: "desc" } },
    select: {
      compra: {
        select: {
          proveedorId: true,
          proveedor: { select: { nombre: true } },
        },
      },
    },
  });

  if (!last?.compra?.proveedorId) {
    return NextResponse.json({}, { status: 200 });
  }

  return NextResponse.json(
    {
      proveedorId: last.compra.proveedorId,
      proveedorNombre: last.compra.proveedor?.nombre ?? "",
    },
    { status: 200 }
  );
}
