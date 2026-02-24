import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

/**
 * GET: List all orders with filters
 */
export async function GET(req: Request) {
    const admin = await sesionAdmin();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const estado = searchParams.get("estado") as any;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "25"); // Default 25 items per page

        const skip = (page - 1) * limit;

        const where = estado && estado !== "ALL" ? { estado } : {};

        const [pedidos, total] = await Promise.all([
            prisma.pedido.findMany({
                where,
                include: {
                    cliente: true,
                    items: {
                        include: {
                            variante: {
                                include: {
                                    producto: {
                                        include: { imagenes: true }
                                    },
                                    talla: { select: { nombre: true } },
                                    color: { select: { nombre: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { creadoEn: 'desc' },
                skip,
                take: limit
            }),
            prisma.pedido.count({ where })
        ]);

        return NextResponse.json({
            data: pedidos,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error listing pedidos:", error);
        return NextResponse.json({ error: "Error al listar pedidos" }, { status: 500 });
    }
}

/**
 * POST: Create a new order with HARD STOCK LOCKING
 */
export async function POST(req: Request) {
    const admin = await sesionAdmin();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    try {
        const body = await req.json();
        const {
            clienteId,
            direccion,
            distrito,
            provincia,
            departamento,
            referencia,
            items, // Array: { varianteId, cantidad, precioUnitario }
            notas,
            whatsappMessage,
            costoEnvio = 0,
            empaques = [] // Array: { tipoEmpaqueId, cantidad }
        } = body;

        if (!clienteId) {
            return NextResponse.json({ error: "Cliente es requerido" }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "El pedido debe tener al menos un item" }, { status: 400 });
        }

        // Usar una transacción para asegurar el stock y el pedido (Timeout 20s)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Validar y restar stock para cada item
            const itemsToCreate = [];
            for (const item of items) {
                const variante = await tx.variante.findUnique({
                    where: { id: item.varianteId },
                    select: { stockActual: true, id: true, producto: { select: { nombre: true } } }
                });

                if (!variante) throw new Error(`Variante no encontrada`);
                if (variante.stockActual < item.cantidad) {
                    throw new Error(`Stock insuficiente para "${variante.producto.nombre}". Disponible: ${variante.stockActual}`);
                }

                // Restar stock
                await tx.variante.update({
                    where: { id: item.varianteId },
                    data: { stockActual: { decrement: item.cantidad } }
                });

                // Registrar movimiento
                await tx.movimientoInventario.create({
                    data: {
                        varianteId: item.varianteId,
                        tipo: "AJUSTE",
                        cambioCantidad: -item.cantidad,
                        nota: `Reserva por Pedido (Bloqueo inmediato)`
                    }
                });

                itemsToCreate.push({
                    varianteId: item.varianteId,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    subtotal: item.cantidad * item.precioUnitario
                });
            }

            // 1.5 Validar y restar stock para cada empaque (si hay)
            const empaquesToCreate = [];
            for (const empaque of empaques) {
                const tipoEmpaque = await tx.tipoEmpaque.findUnique({
                    where: { id: empaque.tipoEmpaqueId },
                    select: { stock: true, id: true, nombre: true, costoUnitario: true }
                });

                if (!tipoEmpaque) throw new Error(`Tipo de empaque no encontrado`);
                if (tipoEmpaque.stock < empaque.cantidad) {
                    throw new Error(`Stock insuficiente para empaque "${tipoEmpaque.nombre}". Disponible: ${tipoEmpaque.stock}`);
                }

                // Restar stock de empaque
                await tx.tipoEmpaque.update({
                    where: { id: empaque.tipoEmpaqueId },
                    data: { stock: { decrement: empaque.cantidad } }
                });

                empaquesToCreate.push({
                    tipoEmpaqueId: empaque.tipoEmpaqueId,
                    cantidad: empaque.cantidad,
                    costoTotal: Number(tipoEmpaque.costoUnitario) * empaque.cantidad
                });
            }

            // 2. Calcular totales
            const subtotal = items.reduce((acc: number, it: any) => acc + (it.cantidad * it.precioUnitario), 0);
            const total = subtotal + costoEnvio;

            // 3. Crear el Pedido
            return await tx.pedido.create({
                data: {
                    clienteId,
                    direccion,
                    distrito,
                    provincia,
                    departamento,
                    referencia,
                    subtotal,
                    costoEnvio,
                    total,
                    notas,
                    whatsappMessage,
                    estado: 'PENDIENTE',
                    items: {
                        create: itemsToCreate
                    },
                    empaques: {
                        create: empaquesToCreate
                    }
                },
                include: {
                    items: {
                        include: {
                            variante: {
                                include: {
                                    producto: true,
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
        }, {
            maxWait: 5000, // default: 2000
            timeout: 20000 // default: 5000
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error creating pedido:", error);
        return NextResponse.json({ error: error.message || "Error al crear el pedido" }, { status: 500 });
    }
}
