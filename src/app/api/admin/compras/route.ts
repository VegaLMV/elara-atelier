export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

type BodyCompra = {
  proveedorId?: string | null;
  fechaCompra?: string; // ISO
  costoEnvio?: string | number | null;
  otrosCostos?: string | number | null;
  notas?: string | null;
  estado?: "BORRADOR" | "ORDENADO" | "RECIBIDO" | "CANCELADO";
  items: Array<{
    varianteId: string;
    cantidad: number;
    costoUnitario: string | number; // Decimal
  }>;
};

export async function GET(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const compras = await prisma.compra.findMany({
    where: q
      ? {
          OR: [
            { notas: { contains: q, mode: "insensitive" } },
            { proveedor: { is: { nombre: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    include: {
      proveedor: true,
      items: true,
    },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  return NextResponse.json(compras);
}

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as BodyCompra | null;
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Agrega al menos 1 ítem" }, { status: 400 });
  }

  for (const it of items) {
    if (!it?.varianteId) return NextResponse.json({ error: "Falta varianteId" }, { status: 400 });
    if (!Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }
    if (it.costoUnitario === undefined || it.costoUnitario === null || isNaN(Number(it.costoUnitario))) {
      return NextResponse.json({ error: "Costo unitario inválido" }, { status: 400 });
    }
  }

  const estado = body.estado ?? "RECIBIDO"; // por defecto: entra stock
  const fechaCompra = body.fechaCompra ? new Date(body.fechaCompra) : new Date();

  const costoEnvio = body.costoEnvio === null || body.costoEnvio === undefined ? null : String(body.costoEnvio);
  const otrosCostos = body.otrosCostos === null || body.otrosCostos === undefined ? null : String(body.otrosCostos);

  const proveedorId = body.proveedorId ? String(body.proveedorId) : null;
  const notas = body.notas ? String(body.notas) : null;

  // Transacción completa
  const result = await prisma.$transaction(async (tx) => {
    const compra = await tx.compra.create({
      data: {
        proveedorId,
        estado,
        fechaCompra,
        costoEnvio: costoEnvio ? new Prisma.Decimal(costoEnvio) : null,
        otrosCostos: otrosCostos ? new Prisma.Decimal(otrosCostos) : null,
        notas,
      },
    });

    await tx.itemCompra.createMany({
      data: items.map((it) => ({
        compraId: compra.id,
        varianteId: it.varianteId,
        cantidad: Number(it.cantidad),
        costoUnitario: new Prisma.Decimal(String(it.costoUnitario)),
      })),
    });

    // Si es RECIBIDO, actualiza stock + crea movimientos
    if (estado === "RECIBIDO") {
      for (const it of items) {
        const cant = Number(it.cantidad);
        const cu = new Prisma.Decimal(String(it.costoUnitario));

        await tx.variante.update({
          where: { id: it.varianteId },
          data: { stockActual: { increment: cant } },
        });

        await tx.movimientoInventario.create({
          data: {
            varianteId: it.varianteId,
            tipo: "COMPRA",
            cambioCantidad: cant,
            costoUnitario: cu,
            nota: notas ? `Compra: ${notas}` : null,
            compraId: compra.id,
          },
        });
      }
    }

    return compra;
  });

  return NextResponse.json({ ok: true, compraId: result.id }, { status: 201 });
}
