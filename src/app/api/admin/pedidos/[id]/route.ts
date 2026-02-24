import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

/**
 * GET: Retrieve details of a specific order
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await sesionAdmin();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    try {
        const { id } = await params;
        const pedido = await prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: true,
                items: {
                    include: {
                        variante: {
                            include: {
                                producto: {
                                    include: { imagenes: true }
                                },
                                talla: true,
                                color: true
                            }
                        }
                    }
                },
                empaques: {
                    include: {
                        tipoEmpaque: true
                    }
                }
            }
        });

        if (!pedido) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        return NextResponse.json(pedido);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener el pedido" }, { status: 500 });
    }
}

/**
 * PATCH: Edit an existing order with stock reconciliation
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await sesionAdmin();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    try {
        const { id } = await params;
        const body = await req.json();
        const {
            clienteId,
            direccion, distrito, provincia, departamento, referencia,
            items, // Nuevos items
            empaques,
            costoEnvio,
            notas
        } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Obtener pedido actual y sus items (para saber qué devolver)
            const oldPedido = await tx.pedido.findUnique({
                where: { id },
                include: { items: true, empaques: true }
            });

            if (!oldPedido) throw new Error("Pedido no encontrado");

            // 2. RECONCILIACIÓN DE STOCK - PRENDAS
            // Estrategia: "Devolver todo lo viejo, restar todo lo nuevo" (Más seguro y simple que diff complejo)
            // A menos que sea muy costoso, pero para < 50 items está bien.

            // A) Devolver stock de items antiguos
            for (const oldItem of oldPedido.items) {
                await tx.variante.update({
                    where: { id: oldItem.varianteId },
                    data: { stockActual: { increment: oldItem.cantidad } }
                });
            }

            // B) Restar stock de items nuevos (Validando disponibilidad real, considerando que acabamos de devolver lo suyo)
            // OJO: Si el item es el mismo, al haber devuelto, ahora hay stock.
            let nuevoTotal = 0;

            for (const newItem of items) {
                // Verificar stock
                const variante = await tx.variante.findUnique({ where: { id: newItem.varianteId } });
                if (!variante) throw new Error(`Variante ${newItem.varianteId} no encontrada`);

                if (variante.stockActual < newItem.cantidad) {
                    throw new Error(`Stock insuficiente para ${newItem.titulo || 'un producto'}. Disponible: ${variante.stockActual}`);
                }

                // Restar
                await tx.variante.update({
                    where: { id: newItem.varianteId },
                    data: { stockActual: { decrement: newItem.cantidad } }
                });

                nuevoTotal += (newItem.cantidad * newItem.precioUnitario);
            }

            // 3. RECONCILIACIÓN DE EMPAQUES
            // A) Devolver antiguos
            for (const oldEmp of oldPedido.empaques) {
                await tx.tipoEmpaque.update({
                    where: { id: oldEmp.tipoEmpaqueId },
                    data: { stock: { increment: oldEmp.cantidad } }
                });
            }

            // B) Restar nuevos empaques y preparar datos creación
            const empaquesToCreate = [];
            for (const newEmp of empaques) {
                const emp = await tx.tipoEmpaque.findUnique({ where: { id: newEmp.tipoEmpaqueId } });
                if (!emp || emp.stock < newEmp.cantidad) {
                    throw new Error(`Stock insuficiente de empaque: ${newEmp.nombre || 'Desconocido'}`);
                }
                await tx.tipoEmpaque.update({
                    where: { id: newEmp.tipoEmpaqueId },
                    data: { stock: { decrement: newEmp.cantidad } }
                });
                empaquesToCreate.push({
                    tipoEmpaqueId: newEmp.tipoEmpaqueId,
                    cantidad: newEmp.cantidad,
                    costoTotal: Number(emp.costoUnitario) * newEmp.cantidad
                });
            }

            // 4. ACTUALIZAR PEDIDO
            // Eliminar relaciones antiguas
            await tx.itemPedido.deleteMany({ where: { pedidoId: id } });
            await tx.usoEmpaque.deleteMany({ where: { pedidoId: id } });

            // Actualizar Cabecera
            const pedidoUpdated = await tx.pedido.update({
                where: { id },
                data: {
                    clienteId,
                    direccion, distrito, provincia, departamento, referencia,
                    costoEnvio,
                    total: nuevoTotal + (costoEnvio || 0),
                    notas,
                    // Re-crear relaciones
                    items: {
                        create: items.map((i: any) => ({
                            varianteId: i.varianteId,
                            cantidad: i.cantidad,
                            precioUnitario: i.precioUnitario,
                            subtotal: Number(i.precioUnitario) * i.cantidad
                        }))
                    },
                    empaques: {
                        create: empaquesToCreate // Usar array pre-calculado
                    }
                }
            });

            return pedidoUpdated;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error editing pedido:", error);
        return NextResponse.json({ error: error.message || "Error al editar el pedido" }, { status: 500 });
    }
}

/**
 * DELETE: Cancel the order and RESTORE STOCK
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await sesionAdmin();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    try {
        const { id } = await params;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Obtener pedido y sus items para saber qué devolver
            const pedido = await tx.pedido.findUnique({
                where: { id },
                include: { items: true, empaques: true }
            });

            if (!pedido) throw new Error("Pedido no encontrado");

            // Solo devolvemos stock si el pedido NO estaba ya cancelado
            if (pedido.estado !== 'CANCELADO') {
                // Devolver Prendas
                for (const item of pedido.items) {
                    await tx.variante.update({
                        where: { id: item.varianteId },
                        data: { stockActual: { increment: item.cantidad } }
                    });
                }
                // Devolver Empaques
                for (const emp of pedido.empaques) {
                    await tx.tipoEmpaque.update({
                        where: { id: emp.tipoEmpaqueId },
                        data: { stock: { increment: emp.cantidad } }
                    });
                }
            }

            // 2. Marcar como cancelado
            return await tx.pedido.update({
                where: { id },
                data: { estado: 'CANCELADO' }
            });
        });

        return NextResponse.json({ success: true, pedido: result });
    } catch (error: any) {
        console.error("Error canceling pedido:", error);
        return NextResponse.json({ error: error.message || "Error al cancelar el pedido" }, { status: 500 });
    }
}
