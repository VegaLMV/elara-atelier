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

        // --- 1. Validaciones Iniciales ---
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
        }

        // --- 2. Validar Stock PRODUCTOS ---
        const variantesIds = items.map((i: any) => i.varianteId);
        const variantesDb = await prisma.variante.findMany({
            where: { id: { in: variantesIds } },
            select: { id: true, stockActual: true, producto: { select: { nombre: true } }, talla: true, color: true }
        });

        for (const item of items) {
            const dbVar = variantesDb.find(v => v.id === item.varianteId);
            if (!dbVar) return NextResponse.json({ error: `Variante no encontrada (ID: ${item.varianteId})` }, { status: 400 });

            if (dbVar.stockActual < item.cantidad) {
                return NextResponse.json({
                    error: `Stock insuficiente para "${dbVar.producto.nombre}" (${dbVar.talla.nombre}/${dbVar.color.nombre}). Solicitado: ${item.cantidad}, Disponible: ${dbVar.stockActual}`
                }, { status: 409 });
            }
        }

        // --- 3. Validar Stock EMPAQUES ---
        if (empaques && Array.isArray(empaques) && empaques.length > 0) {
            const empaqueIds = empaques.map((e: any) => e.tipoEmpaqueId);
            const empaquesDb = await prisma.tipoEmpaque.findMany({
                where: { id: { in: empaqueIds } },
                select: { id: true, stock: true, nombre: true, costoUnitario: true }
            });

            for (const emp of empaques) {
                const dbEmp = empaquesDb.find(e => e.id === emp.tipoEmpaqueId);
                if (!dbEmp) return NextResponse.json({ error: `Empaque no encontrado` }, { status: 400 });

                if (dbEmp.stock < emp.cantidad) {
                    return NextResponse.json({
                        error: `Sin stock de empaque "${dbEmp.nombre}". Disponible: ${dbEmp.stock}`
                    }, { status: 409 });
                }
            }
        }

        // --- 4. Cálculos Financieros (Precisión Decimal) ---
        let subtotalVenta = new Prisma.Decimal(0);
        let descuentoTotalVenta = new Prisma.Decimal(0);
        let totalVenta = new Prisma.Decimal(0);

        const itemsProcesados = items.map((item: any) => {
            const precioUnit = new Prisma.Decimal(item.precioUnitario || 0);
            const cantidad = new Prisma.Decimal(item.cantidad || 0);
            const descuentoUnit = new Prisma.Decimal(item.descuentoAplicado || 0);

            // Cálculos por línea: (PrecioUnit - DescuentoUnit)
            const precioFinalUnit = precioUnit.minus(descuentoUnit);

            // Subtotal línea (lo que paga el cliente)
            const subtotalLinea = precioFinalUnit.mul(cantidad);

            // Acumuladores generales
            const montoBaseLinea = precioUnit.mul(cantidad);
            const montoDescuentoLinea = descuentoUnit.mul(cantidad);

            subtotalVenta = subtotalVenta.plus(montoBaseLinea);
            descuentoTotalVenta = descuentoTotalVenta.plus(montoDescuentoLinea);
            totalVenta = totalVenta.plus(subtotalLinea);

            return {
                varianteId: item.varianteId,
                cantidad: Number(cantidad), // Para stock y kardex (Int)
                precioUnitario: precioUnit,
                precioFinal: precioFinalUnit,
                subtotal: subtotalLinea,
                tieneDescuento: descuentoUnit.greaterThan(0),
                descuentoMonto: descuentoUnit,
                descuentoRazon: item.descuentoRazon || (descuentoUnit.greaterThan(0) ? "Oferta POS" : null)
            };
        });

        // --- 5. TRANSACCIÓN ATÓMICA ---
        const ventaCreada = await prisma.$transaction(async (tx) => {

            // A. Crear Venta
            const venta = await tx.venta.create({
                data: {
                    clienteId: clienteId || null,
                    clienteNombre: !clienteId ? "Público General" : null,
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
                }
            });

            // B. Registrar Empaques
            if (empaques && empaques.length > 0) {
                for (const emp of empaques) {
                    const dataEmp = await tx.tipoEmpaque.findUnique({ where: { id: emp.tipoEmpaqueId } });
                    const costoUnit = new Prisma.Decimal(dataEmp?.costoUnitario || 0);
                    const cant = new Prisma.Decimal(emp.cantidad);

                    await tx.usoEmpaque.create({
                        data: {
                            ventaId: venta.id,
                            tipoEmpaqueId: emp.tipoEmpaqueId,
                            cantidad: Number(cant),
                            costoTotal: costoUnit.mul(cant)
                        }
                    });
                    await tx.tipoEmpaque.update({
                        where: { id: emp.tipoEmpaqueId },
                        data: { stock: { decrement: Number(cant) } }
                    });
                }
            }

            // C. Kardex & Stock Productos
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

            return venta;
        });

        return NextResponse.json({ success: true, codigo: ventaCreada.codigo, id: ventaCreada.id });

    } catch (error) {
        console.error("Error en POST Ventas:", error);
        return NextResponse.json({ error: "Error interno al procesar la venta" }, { status: 500 });
    }
}