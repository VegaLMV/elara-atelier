import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Convert a Pedido to a Venta
 * This involves subtracting actual stock and creating inventory movements
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { metodoPago, notasVenta } = body;

        // 1. Obtener los datos del pedido
        const pedido = await prisma.pedido.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!pedido) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (pedido.estado === 'CANCELADO') {
            return NextResponse.json({ error: "No se puede convertir un pedido cancelado" }, { status: 400 });
        }

        // Usar una transacción para asegurar consistencia
        const ventaResult = await prisma.$transaction(async (tx) => {
            // 2. Crear la Venta
            const venta = await tx.venta.create({
                data: {
                    clienteId: pedido.clienteId,
                    clienteNombre: pedido.clienteNombre,
                    canal: "WhatsApp (Pedido)",
                    metodoPago: metodoPago || "YAPE",
                    estado: "COMPLETADO",
                    subtotal: pedido.subtotal,
                    total: pedido.total,
                    notas: notasVenta || pedido.notas,
                    pedidoId: pedido.id,
                    items: {
                        create: pedido.items.map(item => ({
                            varianteId: item.varianteId,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            precioFinal: item.precioUnitario,
                            subtotal: item.subtotal
                        }))
                    }
                }
            });

            // 3. NO Actualizar Stock de nuevo (ya se bloqueó al crear el Pedido)
            // Solo registrar el movimiento de inventario oficial como "VENTA"
            // y podríamos considerar el Pedido como la fuente de ese stock.
            for (const item of pedido.items) {
                // Registrar movimiento de inventario de tipo VENTA
                // Pero como ya restamos stock en el Pedido (tipo AJUSTE), 
                // aquí solo vinculamos la Venta al historial de variantes si es necesario, 
                // pero NO restamos de nuevo.

                await tx.movimientoInventario.create({
                    data: {
                        varianteId: item.varianteId,
                        tipo: "VENTA",
                        cambioCantidad: 0, // El cambio real ya lo hizo el Pedido (-cantidad)
                        ventaId: venta.id,
                        nota: `Pedido ${pedido.codigo} oficializado como Venta`
                    }
                });
            }

            // 4. Actualizar estado del Pedido
            await tx.pedido.update({
                where: { id: pedido.id },
                data: {
                    estado: 'ENTREGADO'
                }
            });

            return venta;
        });

        return NextResponse.json(ventaResult);

    } catch (error) {
        console.error("Error converting pedido to venta:", error);
        // Verificar si el error es de stock de Prisma (si pusieras un check de >=0)
        return NextResponse.json({ error: "Error en la transacción de conversión" }, { status: 500 });
    }
}
