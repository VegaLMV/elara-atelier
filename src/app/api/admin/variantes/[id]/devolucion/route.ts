export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const cantidad = Number(body?.cantidad);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return NextResponse.json({ error: "cantidad debe ser entero > 0" }, { status: 400 });
  }

  const nota =
    typeof body?.nota === "string" && body.nota.trim()
      ? body.nota.trim()
      : null;

  const cambioCantidad = -Math.abs(cantidad);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const variante = await tx.variante.findUnique({ where: { id } });
      if (!variante) return { error: "VARIANTE_NO_EXISTE" as const };

      const nuevoStock = variante.stockActual + cambioCantidad;
      if (nuevoStock < 0) return { error: "STOCK_NEGATIVO" as const };

      const actualizada = await tx.variante.update({
        where: { id },
        data: { stockActual: nuevoStock },
      });

      await tx.movimientoInventario.create({
        data: {
          varianteId: id,
          tipo: "DEVOLUCION",
          cambioCantidad,
          nota,
        },
      });

      return { ok: true as const, stockActual: actualizada.stockActual };
    });

    if ("error" in result) {
      if (result.error === "VARIANTE_NO_EXISTE") {
        return NextResponse.json({ error: "Variante no existe" }, { status: 404 });
      }
      if (result.error === "STOCK_NEGATIVO") {
        return NextResponse.json({ error: "No puedes dejar stock en negativo" }, { status: 400 });
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("POST /variantes/[id]/devolucion error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
