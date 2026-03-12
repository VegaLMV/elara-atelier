export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

/**
 * ============================================================================
 * GET: OBTENER DETALLE DE COMPRA
 * ============================================================================
 * Retorna la compra con sus relaciones completas para visualizar:
 * 1. Proveedor
 * 2. Items de Ropa (Variantes + Producto + Talla + Color)
 * 3. Items de Empaque (TipoEmpaque)
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
          // Opción A: Es Producto (Ropa)
          variante: {
            include: {
              producto: { include: { imagenes: true, imagenesColor: true } },
              talla: true,
              color: true
            }
          },
          // Opción B: Es Empaque
          tipoEmpaque: true,
        },
      },
    },
  });

  if (!compra) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(compra);
}

/**
 * ============================================================================
 * PATCH: ACTUALIZAR ESTADO DE COMPRA (RECEPCIÓN DE MERCADERÍA)
 * ============================================================================
 * Maneja la transición de estados.
 * CRÍTICO: Cuando pasa a 'RECIBIDO', ejecuta una transacción que:
 * 1. Actualiza el stock de Variantes (Ropa) O Empaques.
 * 2. Registra el movimiento en el Kardex (Solo para Ropa).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const nuevoEstado = body?.estado as "BORRADOR" | "ORDENADO" | "RECIBIDO" | "CANCELADO";

  if (!nuevoEstado) return NextResponse.json({ error: "Falta estado" }, { status: 400 });

  // Buscamos la compra con sus items para poder iterar sobre ellos
  const compra = await prisma.compra.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!compra) return NextResponse.json({ error: "No existe" }, { status: 404 });

  // Validación: Evitar recibir dos veces
  if (compra.estado === "RECIBIDO" && nuevoEstado === "RECIBIDO") {
    return NextResponse.json({ error: "La compra ya está RECIBIDA" }, { status: 400 });
  }

  // --- LÓGICA DE RECEPCIÓN (Impacto en Inventario) ---
  if (nuevoEstado === "RECIBIDO" && compra.estado !== "RECIBIDO") {

    await prisma.$transaction(async (tx) => {
      // 1. Marcar compra como recibida
      await tx.compra.update({ where: { id }, data: { estado: "RECIBIDO" } });

      // 2. Procesar cada ítem (Puede ser Ropa o Empaque)
      for (const it of compra.items) {

        // CASO A: Es un Producto (Ropa) -> Actualiza Stock + Kardex
        if (it.varianteId) {
          // A1. Incrementar Stock Físico
          await tx.variante.update({
            where: { id: it.varianteId },
            data: { stockActual: { increment: it.cantidad } },
          });

          // A2. Registrar Movimiento en Kardex
          await tx.movimientoInventario.create({
            data: {
              varianteId: it.varianteId,
              tipo: "COMPRA",
              cambioCantidad: it.cantidad,
              costoUnitario: new Prisma.Decimal(it.costoUnitario.toString()),
              compraId: compra.id,
              nota: compra.notas ? `Ingreso Compra: ${compra.notas}` : "Ingreso por Compra",
            },
          });
        }

        // CASO B: Es un Empaque (Bolsa/Caja) -> Solo Actualiza Stock Simple
        else if (it.tipoEmpaqueId) {
          await tx.tipoEmpaque.update({
            where: { id: it.tipoEmpaqueId },
            data: { stock: { increment: it.cantidad } }
          });
          // NOTA: No creamos MovimientoInventario porque el modelo actual de Kardex
          // requiere 'varianteId' obligatorio. El stock de empaques es un contador simple.
        }
      }
    });

    return NextResponse.json({ ok: true, estado: "RECIBIDO" });
  }

  // --- OTROS CAMBIOS DE ESTADO (Sin impacto en stock) ---
  // Ej: Borrador -> Ordenado, o Cancelado (si no estaba recibido)
  const upd = await prisma.compra.update({
    where: { id },
    data: { estado: nuevoEstado },
  });

  return NextResponse.json({ ok: true, estado: upd.estado });
}

/**
 * ============================================================================
 * PUT: ACTUALIZAR DETALLE DE COMPRA
 * ============================================================================
 * Permite corregir datos de una compra registrada.
 * Si la compra está 'RECIBIDA', ajusta el stock compensando la diferencia.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const compraActual = await prisma.compra.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!compraActual) return NextResponse.json({ error: "No existe la compra" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Si estaba RECIBIDA, revertir stock actual antes de aplicar el nuevo
      if (compraActual.estado === "RECIBIDO") {
        // Eliminar TODOS los movimientos previos de esta compra de una vez
        await tx.movimientoInventario.deleteMany({
          where: { compraId: id }
        });

        for (const it of compraActual.items) {
          if (it.varianteId) {
            await tx.variante.update({
              where: { id: it.varianteId },
              data: { stockActual: { decrement: it.cantidad } },
            });
          } else if (it.tipoEmpaqueId) {
            await tx.tipoEmpaque.update({
              where: { id: it.tipoEmpaqueId },
              data: { stock: { decrement: it.cantidad } }
            });
          }
        }
      }

      // 2. Eliminar items anteriores
      await tx.itemCompra.deleteMany({ where: { compraId: id } });

      // 3. Crear nuevos items y actualizar stock si el nuevo estado es RECIBIDO
      const esRecibido = body.estado === "RECIBIDO";

      const compraActualizada = await tx.compra.update({
        where: { id },
        data: {
          proveedorId: body.proveedorId || null,
          fechaCompra: body.fechaCompra ? new Date(body.fechaCompra) : undefined,
          notas: body.notas || null,
          costoEnvio: body.costoEnvio ? new Prisma.Decimal(body.costoEnvio) : null,
          otrosCostos: body.otrosCostos ? new Prisma.Decimal(body.otrosCostos) : null,
          estado: body.estado,
          items: {
            create: body.items.map((it: any) => ({
              varianteId: it.tipo === "PRODUCTO" ? it.id : null,
              tipoEmpaqueId: it.tipo === "EMPAQUE" ? it.id : null,
              cantidad: it.cantidad,
              costoUnitario: new Prisma.Decimal(it.costoUnitario),
            })),
          },
        },
        include: { items: true }
      });

      // 4. Aplicar stock nuevo si corresponde
      if (esRecibido) {
        for (const it of compraActualizada.items) {
          if (it.varianteId) {
            await tx.variante.update({
              where: { id: it.varianteId },
              data: { stockActual: { increment: it.cantidad } },
            });
            await tx.movimientoInventario.create({
              data: {
                varianteId: it.varianteId,
                tipo: "COMPRA",
                cambioCantidad: it.cantidad,
                costoUnitario: it.costoUnitario,
                compraId: id,
                nota: body.notas ? `Corrección Compra: ${body.notas}` : "Corrección por Compra",
              },
            });
          } else if (it.tipoEmpaqueId) {
            await tx.tipoEmpaque.update({
              where: { id: it.tipoEmpaqueId },
              data: { stock: { increment: it.cantidad } }
            });
          }
        }
      }

      return compraActualizada;
    }, {
      timeout: 30000
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error al actualizar compra:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}