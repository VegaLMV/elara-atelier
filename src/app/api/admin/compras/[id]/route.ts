export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const compra = await prisma.compra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      items: {
        include: {
          variante: { include: { producto: true, talla: true, color: true } },
        },
      },
    },
  });

  if (!compra) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(compra);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const nuevoEstado = body?.estado as "BORRADOR" | "ORDENADO" | "RECIBIDO" | "CANCELADO";

  if (!nuevoEstado) return NextResponse.json({ error: "Falta estado" }, { status: 400 });

  const compra = await prisma.compra.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!compra) return NextResponse.json({ error: "No existe" }, { status: 404 });

  // Evitar doble ingreso
  if (compra.estado === "RECIBIDO" && nuevoEstado === "RECIBIDO") {
    return NextResponse.json({ error: "La compra ya está RECIBIDA" }, { status: 400 });
  }

  // Si pasas a RECIBIDO: aplica stock + movimientos
  if (nuevoEstado === "RECIBIDO" && compra.estado !== "RECIBIDO") {
    await prisma.$transaction(async (tx) => {
      await tx.compra.update({ where: { id }, data: { estado: "RECIBIDO" } });

      for (const it of compra.items) {
        await tx.variante.update({
          where: { id: it.varianteId },
          data: { stockActual: { increment: it.cantidad } },
        });

        await tx.movimientoInventario.create({
          data: {
            varianteId: it.varianteId,
            tipo: "COMPRA",
            cambioCantidad: it.cantidad,
            costoUnitario: new Prisma.Decimal(it.costoUnitario.toString()),
            compraId: compra.id,
            nota: compra.notas ? `Compra: ${compra.notas}` : null,
          },
        });
      }
    });

    return NextResponse.json({ ok: true, estado: "RECIBIDO" });
  }

  const upd = await prisma.compra.update({
    where: { id },
    data: { estado: nuevoEstado },
  });

  return NextResponse.json({ ok: true, estado: upd.estado });
}
