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
              producto: { include: { imagenes: true, imagenesColor: true } }, // Incluimos imágenes para el detalle visual
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
                    costoUnitario: new Prisma.Decimal(it.costoUnitario.toString()), // Asegurar formato Decimal
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