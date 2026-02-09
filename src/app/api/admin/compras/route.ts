export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

// Tipado actualizado para aceptar items híbridos
type BodyCompra = {
  proveedorId?: string | null;
  fechaCompra?: string; // ISO
  costoEnvio?: string | number | null;
  otrosCostos?: string | number | null;
  notas?: string | null;
  estado?: "BORRADOR" | "ORDENADO" | "RECIBIDO" | "CANCELADO";
  items: Array<{
    id: string; // Puede ser ID de Variante o de Empaque
    tipo: "PRODUCTO" | "EMPAQUE"; // Nuevo campo discriminador
    cantidad: number;
    costoUnitario: string | number;
  }>;
};

export async function GET(req: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) {
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
      items: {
        include: {
          variante: { include: { producto: true, talla: true, color: true } }, // Incluimos detalles de ropa
          tipoEmpaque: true // Incluimos detalles de empaque
        }
      },
    },
    orderBy: { creadoEn: "desc" },
    take: 50,
  });

  return NextResponse.json(compras);
}

export async function POST(req: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as BodyCompra | null;
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Agrega al menos 1 ítem" }, { status: 400 });
  }

  // Validaciones
  for (const it of items) {
    if (!it?.id) return NextResponse.json({ error: "Falta ID del ítem" }, { status: 400 });
    if (!it?.tipo || (it.tipo !== "PRODUCTO" && it.tipo !== "EMPAQUE")) {
      // Si viene del código antiguo sin 'tipo', asumimos PRODUCTO por compatibilidad
      if (!it.tipo) it.tipo = "PRODUCTO";
      else return NextResponse.json({ error: "Tipo de ítem inválido" }, { status: 400 });
    }

    if (!Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }
    // Permitimos 0 si es un regalo, pero debe ser número
    if (it.costoUnitario === undefined || it.costoUnitario === null || isNaN(Number(it.costoUnitario))) {
      return NextResponse.json({ error: "Costo unitario inválido" }, { status: 400 });
    }
  }

  const estado = body.estado ?? "RECIBIDO";
  const fechaCompra = body.fechaCompra ? new Date(body.fechaCompra) : new Date();

  // Convertimos a string o Decimal seguro
  const costoEnvio = body.costoEnvio ? new Prisma.Decimal(String(body.costoEnvio)) : null;
  const otrosCostos = body.otrosCostos ? new Prisma.Decimal(String(body.otrosCostos)) : null;

  const proveedorId = body.proveedorId ? String(body.proveedorId) : null;
  const notas = body.notas ? String(body.notas) : null;

  try {
    // Transacción completa
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Cabecera de Compra
      const compra = await tx.compra.create({
        data: {
          proveedorId,
          estado,
          fechaCompra,
          costoEnvio,
          otrosCostos,
          notas,
        },
      });

      // 2. Crear Ítems
      // Preparamos los datos con Decimal para bulk insert (createMany si soportado, o loop)
      // Prisma createMany soporta Decimal si el input type lo permite.

      const itemsData = items.map((it) => ({
        compraId: compra.id,
        varianteId: it.tipo === "PRODUCTO" ? it.id : null,
        tipoEmpaqueId: it.tipo === "EMPAQUE" ? it.id : null,
        cantidad: Number(it.cantidad), // Cantidad suele ser Int/Float
        costoUnitario: new Prisma.Decimal(String(it.costoUnitario)),
      }));

      await tx.itemCompra.createMany({
        data: itemsData,
      });

      // 3. Actualizar Stock + Movimientos (Solo si es RECIBIDO)
      if (estado === "RECIBIDO") {
        for (const it of items) {
          const cant = Number(it.cantidad);
          const cu = new Prisma.Decimal(String(it.costoUnitario));

          if (it.tipo === "PRODUCTO") {
            // A. Stock de Ropa (Variante)
            await tx.variante.update({
              where: { id: it.id },
              data: { stockActual: { increment: cant } },
            });

            // Registro en Kardex 
            await tx.movimientoInventario.create({
              data: {
                varianteId: it.id,
                tipo: "COMPRA",
                cambioCantidad: cant,
                costoUnitario: cu,
                nota: notas ? `Compra: ${notas}` : null,
                compraId: compra.id,
              },
            });

          } else if (it.tipo === "EMPAQUE") {
            // B. Stock de Empaques
            await tx.tipoEmpaque.update({
              where: { id: it.id },
              data: { stock: { increment: cant } },
            });
          }
        }
      }

      return compra;
    });

    return NextResponse.json({ ok: true, compraId: result.id }, { status: 201 });

  } catch (error) {
    console.error("Error creando compra:", error);
    return NextResponse.json({ error: "Error interno al procesar la compra" }, { status: 500 });
  }
}