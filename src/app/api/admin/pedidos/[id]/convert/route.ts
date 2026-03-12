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

        const ventaResult = await prisma.$transaction(async (tx) => {
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

            for (const item of pedido.items) {

                await tx.movimientoInventario.create({
                    data: {
                        varianteId: item.varianteId,
                        tipo: "VENTA",
                        cambioCantidad: 0,
                        ventaId: venta.id,
                        nota: `Pedido ${pedido.codigo} oficializado como Venta`
                    }
                });
            }

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
        return NextResponse.json({ error: "Error en la transacción de conversión" }, { status: 500 });
    }
}
