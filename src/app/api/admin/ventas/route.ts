import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    try {
        const body = await request.json();
        const { clienteId, metodoPago, items, empaques } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
        }

        // 1. Validar Stock PRODUCTOS (Cargando relaciones correctamente)
        const variantesIds = items.map((i: any) => i.varianteId);
        const variantesDb = await prisma.variante.findMany({
            where: { id: { in: variantesIds } },
            include: { 
                producto: { select: { nombre: true } }, 
                talla: true, 
                color: true 
            }
        });

        for (const item of items) {
            const dbVar = variantesDb.find(v => v.id === item.varianteId);
            if (!dbVar) return NextResponse.json({ error: `Variante no encontrada` }, { status: 400 });

            if (dbVar.stockActual < item.cantidad) {
                return NextResponse.json({
                    error: `Stock insuficiente para "${dbVar.producto.nombre}" (${dbVar.talla.nombre}/${dbVar.color.nombre}). Disponible: ${dbVar.stockActual}`
                }, { status: 409 });
            }
        }

        // 2. Cálculos Financieros usando la precisión de Prisma.Decimal
        let subtotalVenta = new Prisma.Decimal(0);
        let descuentoTotalVenta = new Prisma.Decimal(0);
        let totalVenta = new Prisma.Decimal(0);

        const itemsProcesados = items.map((item: any) => {
            const pUnit = new Prisma.Decimal(item.precioUnitario);
            const cant = new Prisma.Decimal(item.cantidad);
            const descUnit = new Prisma.Decimal(item.descuentoAplicado || 0);

            const pFinalUnit = pUnit.minus(descUnit);
            const subtotalLinea = pFinalUnit.mul(cant);

            subtotalVenta = subtotalVenta.plus(pUnit.mul(cant));
            descuentoTotalVenta = descuentoTotalVenta.plus(descUnit.mul(cant));
            totalVenta = totalVenta.plus(subtotalLinea);

            return {
                varianteId: item.varianteId,
                cantidad: Number(item.cantidad),
                precioUnitario: pUnit,
                precioFinal: pFinalUnit,
                subtotal: subtotalLinea,
                tieneDescuento: descUnit.gt(0),
                descuentoMonto: descUnit,
                descuentoRazon: item.descuentoRazon || null
            };
        });

        // 3. Transacción Atómica
        const ventaCreada = await prisma.$transaction(async (tx) => {
            
            // ==========================================
            // SOLUCIÓN: ESTRUCTURACIÓN SEGURA PARA PRISMA
            // ==========================================
            const dataVenta: any = {
                metodoPago: metodoPago || "EFECTIVO",
                subtotal: subtotalVenta,
                descuentoTotal: descuentoTotalVenta,
                total: totalVenta,
                items: {
                    create: itemsProcesados.map(i => ({
                        varianteId: i.varianteId,
                        cantidad: i.cantidad,
                        precioUnitario: i.precioUnitario,
                        precioFinal: i.precioFinal,
                        subtotal: i.subtotal,
                        tieneDescuento: i.tieneDescuento,
                        descuentoMonto: i.descuentoMonto,
                        descuentoRazon: i.descuentoRazon
                    }))
                }
            };

            // VINCULACIÓN ESTRICTA DEL CLIENTE
            if (clienteId && clienteId.trim() !== "") {
                dataVenta.cliente = { connect: { id: clienteId } };
                dataVenta.clienteNombre = null; 
            } else {
                dataVenta.clienteNombre = "Público General";
            }

            // A. Crear Venta
            const venta = await tx.venta.create({
                data: dataVenta
            });

            // B. Kardex y Stock de Productos
            for (const item of itemsProcesados) {
                await tx.variante.update({
                    where: { id: item.varianteId },
                    data: { stockActual: { decrement: item.cantidad } }
                });

                await tx.movimientoInventario.create({
                    data: {
                        varianteId: item.varianteId,
                        tipo: "VENTA",
                        cambioCantidad: -item.cantidad,
                        costoUnitario: item.precioFinal,
                        ventaId: venta.id,
                        nota: `Venta POS #${venta.codigo}`
                    }
                });
            }

            // C. Manejo de Empaques (Si existen)
            if (empaques && empaques.length > 0) {
                for (const emp of empaques) {
                    const dbEmp = await tx.tipoEmpaque.findUnique({ where: { id: emp.tipoEmpaqueId } });
                    if (dbEmp) {
                        const costoTotal = new Prisma.Decimal(dbEmp.costoUnitario).mul(emp.cantidad);
                        await tx.usoEmpaque.create({
                            data: {
                                ventaId: venta.id,
                                tipoEmpaqueId: emp.tipoEmpaqueId,
                                cantidad: emp.cantidad,
                                costoTotal: costoTotal
                            }
                        });
                        await tx.tipoEmpaque.update({
                            where: { id: emp.tipoEmpaqueId },
                            data: { stock: { decrement: emp.cantidad } }
                        });
                    }
                }
            }

            return venta;
        });

        return NextResponse.json({ success: true, codigo: ventaCreada.codigo, id: ventaCreada.id });

    } catch (error: any) {
        console.error("Error en POST Ventas:", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}