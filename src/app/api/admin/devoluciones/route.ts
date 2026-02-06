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
      clienteId      // Opcional: Para asignar saldo a favor
    } = body;

    // Validación mínima
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No se incluyeron productos" }, { status: 400 });
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

      // 4. Lógica Financiera: Saldo a Favor
      // Si el cliente no quiere cambio ni dinero, se le guarda crédito para el futuro.
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
      id: resultado.id 
    });

  } catch (error: any) {
    console.error("Error en Devolución:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}