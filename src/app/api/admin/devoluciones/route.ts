export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

type Body = {
  nota?: string | null;
  items: Array<{
    varianteId: string;
    cantidad: number; // positiva
  }>;
};

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const nota =
    typeof body.nota === "string" && body.nota.trim() ? body.nota.trim() : null;

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Agrega al menos 1 ítem" }, { status: 400 });
  }

  for (const it of items) {
    if (!it?.varianteId) return NextResponse.json({ error: "Falta varianteId" }, { status: 400 });
    const c = Number(it.cantidad);
    if (!Number.isInteger(c) || c <= 0) {
      return NextResponse.json({ error: "Cantidad inválida (entero > 0)" }, { status: 400 });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validación previa para evitar resultados parciales
      for (const it of items) {
        const v = await tx.variante.findUnique({
          where: { id: it.varianteId },
          select: { id: true, stockActual: true },
        });
        if (!v) {
          return { error: "VARIANTE_NO_EXISTE" as const, varianteId: it.varianteId };
        }
        if (v.stockActual - Number(it.cantidad) < 0) {
          return {
            error: "STOCK_NEGATIVO" as const,
            varianteId: it.varianteId,
            stockActual: v.stockActual,
            intentas: Number(it.cantidad),
          };
        }
      }

      // Ejecutar devoluciones
      for (const it of items) {
        const cant = Number(it.cantidad);

        await tx.variante.update({
          where: { id: it.varianteId },
          data: { stockActual: { decrement: cant } },
        });

        await tx.movimientoInventario.create({
          data: {
            varianteId: it.varianteId,
            tipo: "DEVOLUCION",
            cambioCantidad: -cant, // ✅ negativo
            nota: nota || null,
          },
        });
      }

      return { ok: true as const };
    });

    if ("error" in result) {
      if (result.error === "VARIANTE_NO_EXISTE") {
        return NextResponse.json(
          { error: `Variante no existe: ${result.varianteId}` },
          { status: 404 }
        );
      }
      if (result.error === "STOCK_NEGATIVO") {
        return NextResponse.json(
          {
            error: `No puedes dejar stock negativo. Variante: ${result.varianteId} (stock: ${result.stockActual}, intentas devolver: ${result.intentas})`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/devoluciones error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
