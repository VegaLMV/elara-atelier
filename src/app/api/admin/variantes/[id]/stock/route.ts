export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

type Tipo = "AJUSTE" | "DEVOLUCION";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params; 
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const tipoMovimiento: Tipo =
    body?.tipoMovimiento === "DEVOLUCION" ? "DEVOLUCION" : "AJUSTE";

  const cambioCantidad = Number(body?.cambioCantidad);
  if (!Number.isInteger(cambioCantidad) || cambioCantidad === 0) {
    return NextResponse.json(
      { error: "cambioCantidad debe ser entero y distinto de 0" },
      { status: 400 }
    );
  }

  // ✅ Reglas sugeridas:
  if (tipoMovimiento === "DEVOLUCION" && cambioCantidad > 0) {
    return NextResponse.json(
      { error: "En DEVOLUCION, cambioCantidad debe ser negativo (ej: -1, -2)" },
      { status: 400 }
    );
  }

  const nota =
    typeof body?.nota === "string" && body.nota.trim()
      ? body.nota.trim()
      : null;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
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
          tipo: tipoMovimiento,
          cambioCantidad,
          nota,
        },
      });

      return {
        ok: true as const,
        tipo: tipoMovimiento,
        stockActual: actualizada.stockActual,
      };
    });

    if ("error" in resultado) {
      if (resultado.error === "VARIANTE_NO_EXISTE") {
        return NextResponse.json({ error: "Variante no existe" }, { status: 404 });
      }
      if (resultado.error === "STOCK_NEGATIVO") {
        return NextResponse.json(
          { error: "No puedes dejar stock en negativo" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(resultado);
  } catch (e) {
    console.error("PATCH /variantes/[id]/stock error:", e);
    return NextResponse.json(
      { error: "Error interno al ajustar stock" },
      { status: 500 }
    );
  }
}
