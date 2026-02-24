import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

/**
 * API: PROCESAR DEVOLUCIONES Y CAMBIOS
 * Soporta devoluciones de Clientes (Ventas) y a Proveedores (Compras).
 */
export async function POST(req: Request) {
  // 1. Verificación de seguridad
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const body = await req.json();
    const {
      tipo,          // "CLIENTE" | "PROVEEDOR"
      accion,        // "CAMBIO" | "SALDO_A_FAVOR" | "REEMBOLSO"
      referenciaId,  // ID de Venta o de Compra
      items,         // Array de { varianteId, cantidad }
      motivo,        // Texto explicativo
      montoTotal,    // Valor monetario de la devolución
      clienteId,     // Opcional: Para asignar saldo a favor
      itemsNuevos,   // [NUEVO] Array de { varianteId, cantidad } para cambio directo
      metodoPagoDiferencia // [NUEVO] Como paga la diferencia si hay
    } = body;

    // Validación mínima
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No se incluyeron productos" }, { status: 400 });
    }

    // --- 1.2 PREVENCIÓN DE DOBLE DEVOLUCIÓN ---
    if (tipo === "CLIENTE" || tipo === "PROVEEDOR") {
      const isCliente = tipo === "CLIENTE";

      // 1. Obtener el documento original y sus cantidades
      const original = isCliente
        ? await prisma.venta.findUnique({ where: { id: referenciaId }, include: { items: true } })
        : await prisma.compra.findUnique({ where: { id: referenciaId }, include: { items: true } });

      if (!original) {
        return NextResponse.json({ error: `${isCliente ? "Venta" : "Compra"} original no encontrada` }, { status: 404 });
      }

      // 2. Obtener lo ya devuelto históricamente para este documento
      const devolucionesPrevias = await prisma.devolucion.findMany({
        where: isCliente ? { ventaId: referenciaId } : { compraId: referenciaId },
        include: { items: true }
      });

      // Mapear cantidades ya devueltas por varianteId
      const yaDevueltoMap = new Map<string, number>();
      for (const dev of devolucionesPrevias) {
        for (const item of dev.items) {
          yaDevueltoMap.set(
            item.varianteId,
            (yaDevueltoMap.get(item.varianteId) || 0) + item.cantidad
          );
        }
      }

      // 3. Validar si la nueva solicitud excede lo permitido
      for (const itemSolicitado of items) {
        const itemOriginal = original.items.find((i: any) => i.varianteId === itemSolicitado.varianteId);

        if (!itemOriginal) {
          return NextResponse.json({ error: `El producto ${itemSolicitado.varianteId} no existe en el documento original` }, { status: 400 });
        }

        const yaDevuelto = yaDevueltoMap.get(itemSolicitado.varianteId) || 0;
        const disponible = itemOriginal.cantidad - yaDevuelto;

        if (itemSolicitado.cantidad > disponible) {
          return NextResponse.json({
            error: `La cantidad a devolver del producto (${itemSolicitado.cantidad}) excede los items disponibles para devolver en esta transacción. Máximo disponible: ${disponible}`
          }, { status: 400 });
        }
      }
    }



    // --- INICIO DE TRANSACCIÓN ---
    const resultado = await prisma.$transaction(async (tx) => {

      // 2. Crear el registro histórico de la Devolución
      const nuevaDevolucion = await tx.devolucion.create({
        data: {
          tipo,
          accion,
          motivo,
          montoTotal: new Prisma.Decimal(montoTotal || 0),
          ventaId: tipo === "CLIENTE" ? referenciaId : null,
          compraId: tipo === "PROVEEDOR" ? referenciaId : null,
          items: {
            create: items.map((item: any) => ({
              varianteId: item.varianteId,
              cantidad: item.cantidad,
            })),
          },
        },
      });

      // 3. Procesar cada producto del listado
      for (const item of items) {
        // Determinamos el impacto en el stock físico
        // Si el cliente devuelve: Stock sube (+). Si devolvemos al proveedor: Stock baja (-).
        const factor = tipo === "CLIENTE" ? 1 : -1;
        const cantidadCambio = item.cantidad * factor;

        // A. Actualizar Stock en la tabla Variante
        await tx.variante.update({
          where: { id: item.varianteId },
          data: { stockActual: { increment: cantidadCambio } },
        });

        // B. Registrar en el Kardex para auditoría
        await tx.movimientoInventario.create({
          data: {
            varianteId: item.varianteId,
            tipo: "DEVOLUCION",
            cambioCantidad: cantidadCambio,
            costoUnitario: new Prisma.Decimal(0), // Valor contable (ajustable según política)
            nota: `Devolución #${nuevaDevolucion.id.slice(-5)}: ${motivo}`
          }
        });
      }

      // 4. Lógica de Intercambio (Venta Automática)
      let idVentaCambio = null;

      if (tipo === "CLIENTE" && accion === "CAMBIO" && itemsNuevos && itemsNuevos.length > 0) {
        // Calcular totales de la nueva venta
        let totalNuevo = new Prisma.Decimal(0);

        // Obtenemos precios actuales de los nuevos productos
        const variantesNuevasIds = itemsNuevos.map((i: any) => i.varianteId);
        const variantesDb = await tx.variante.findMany({
          where: { id: { in: variantesNuevasIds } },
          include: { producto: true }
        });

        const itemsVenta = [];

        for (const itemNuevo of itemsNuevos) {
          const dbVar = variantesDb.find(v => v.id === itemNuevo.varianteId);
          if (!dbVar) throw new Error(`Variante ${itemNuevo.varianteId} no encontrada`);

          // Validar Stock
          if (dbVar.stockActual < itemNuevo.cantidad) {
            throw new Error(`Sin stock suficiente para ${dbVar.producto.nombre}`);
          }

          const precioUnit = dbVar.producto.precio; // Precio base (sin descuento complejo por ahora, o pasar desde front)
          // NOTA: Para MVP tomamos precio base. En producción ideal pasar precio calculado.
          const subtotal = new Prisma.Decimal(precioUnit).mul(itemNuevo.cantidad);

          totalNuevo = totalNuevo.plus(subtotal);

          // Reducir Stock
          await tx.variante.update({
            where: { id: itemNuevo.varianteId },
            data: { stockActual: { decrement: itemNuevo.cantidad } }
          });

          // Registrar Kardex Salida
          await tx.movimientoInventario.create({
            data: {
              varianteId: itemNuevo.varianteId,
              tipo: "VENTA",
              cambioCantidad: -itemNuevo.cantidad,
              costoUnitario: precioUnit, // Aprox
              nota: `Cambio por Devolución #${nuevaDevolucion.id.slice(-5)}`
            }
          });

          itemsVenta.push({
            varianteId: itemNuevo.varianteId,
            cantidad: itemNuevo.cantidad,
            precioUnitario: precioUnit,
            precioFinal: precioUnit,
            subtotal: subtotal
          });
        }

        // Crear la Venta de Cambio
        const diferencia = totalNuevo.minus(new Prisma.Decimal(montoTotal || 0));

        const nuevaVenta = await tx.venta.create({
          data: {
            clienteId: clienteId || null,
            clienteNombre: "Cambio / Devolución",
            metodoPago: metodoPagoDiferencia || "EFECTIVO", // Si hay diferencia positiva, el cliente paga
            subtotal: totalNuevo,
            total: totalNuevo,
            notas: `Generada automáticamente por Cambio de Dev. ${nuevaDevolucion.id}`,
            items: {
              create: itemsVenta
            }
          }
        });

        idVentaCambio = nuevaVenta.id;

        // Si sobro saldo a favor del cliente (Diferencia negativa: Devolucion > Nuevo)
        if (diferencia.isNegative() && clienteId) {
          await tx.cliente.update({
            where: { id: clienteId },
            data: { saldoAFavor: { increment: diferencia.abs() } }
          });
        }
      }

      // 5. Lógica Financiera: Saldo a Favor (Solo si NO hubo cambio directo o fue explícito)
      // Si fue CAMBIO, la lógica financiera ya se manejó arriba con la diferencia
      if (tipo === "CLIENTE" && accion === "SALDO_A_FAVOR" && clienteId) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoAFavor: { increment: new Prisma.Decimal(montoTotal || 0) } },
        });
      }

      return nuevaDevolucion;
    });

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      mensaje: "Proceso completado",
      id: resultado.id,
      ventaCambioId: (resultado as any).ventaCambioId
    });

  } catch (error: any) {
    console.error("Error en Devolución:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}