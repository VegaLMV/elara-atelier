import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function POST(request: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const body = await request.json();
    const { clienteId, metodoPago, items, empaques } = body; // Recibimos empaques

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("El carrito está vacío", { status: 400 });
    }

    // 1. Validar Stock PRODUCTOS
    const variantesIds = items.map((i: any) => i.varianteId);
    const variantesDb = await prisma.variante.findMany({
        where: { id: { in: variantesIds } },
        select: { id: true, stockActual: true, producto: { select: { nombre: true } } }
    });

    for (const item of items) {
        const dbVar = variantesDb.find(v => v.id === item.varianteId);
        if (!dbVar) return new NextResponse(`Variante no encontrada`, { status: 400 });
        if (dbVar.stockActual < item.cantidad) return new NextResponse(`Stock insuficiente: ${dbVar.producto.nombre}`, { status: 409 });
    }

    // 2. Validar Stock EMPAQUES (Si se enviaron)
    if (empaques && Array.isArray(empaques) && empaques.length > 0) {
        const empaqueIds = empaques.map((e: any) => e.tipoEmpaqueId);
        const empaquesDb = await prisma.tipoEmpaque.findMany({
            where: { id: { in: empaqueIds } },
            select: { id: true, stock: true, nombre: true, costoUnitario: true }
        });

        for (const emp of empaques) {
            const dbEmp = empaquesDb.find(e => e.id === emp.tipoEmpaqueId);
            if (!dbEmp) return new NextResponse(`Empaque no encontrado`, { status: 400 });
            if (dbEmp.stock < emp.cantidad) return new NextResponse(`Sin stock de empaque: ${dbEmp.nombre}`, { status: 409 });
        }
    }

    // 3. Cálculos
    let subtotalVenta = 0;
    let descuentoTotalVenta = 0;
    let totalVenta = 0;

    const itemsProcesados = items.map((item: any) => {
        const sub = Number(item.precioFinal) * Number(item.cantidad);
        subtotalVenta += Number(item.precioUnitario) * Number(item.cantidad);
        descuentoTotalVenta += Number(item.descuentoAplicado || 0) * Number(item.cantidad);
        totalVenta += sub;
        return { ...item, subtotal: sub };
    });

    // 4. TRANSACCIÓN
    const ventaCreada = await prisma.$transaction(async (tx) => {
        
        // A. Crear Venta
        const venta = await tx.venta.create({
            data: {
                clienteId: clienteId || null,
                metodoPago: metodoPago || "EFECTIVO",
                subtotal: subtotalVenta,
                descuentoTotal: descuentoTotalVenta,
                total: totalVenta,
                items: {
                    create: itemsProcesados.map((i: any) => ({
                        varianteId: i.varianteId,
                        cantidad: i.cantidad,
                        precioUnitario: i.precioUnitario,
                        precioFinal: i.precioFinal,
                        subtotal: i.subtotal,
                        tieneDescuento: i.descuentoAplicado > 0,
                        descuentoMonto: i.descuentoAplicado,
                        descuentoRazon: i.descuentoAplicado > 0 ? "Oferta POS" : null
                    }))
                }
            }
        });

        // B. Registrar Empaques (Si los hay)
        if (empaques && empaques.length > 0) {
            for (const emp of empaques) {
                // Obtener costo unitario actual para registro histórico
                const dataEmp = await tx.tipoEmpaque.findUnique({ where: { id: emp.tipoEmpaqueId } });
                
                await tx.usoEmpaque.create({
                    data: {
                        ventaId: venta.id,
                        tipoEmpaqueId: emp.tipoEmpaqueId,
                        cantidad: emp.cantidad,
                        costoTotal: Number(dataEmp?.costoUnitario || 0) * emp.cantidad
                    }
                });

                // Restar Stock Empaque
                await tx.tipoEmpaque.update({
                    where: { id: emp.tipoEmpaqueId },
                    data: { stock: { decrement: emp.cantidad } }
                });
            }
        }

        // C. Restar Stock Productos y Kardex
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

    return NextResponse.json({ success: true, codigo: ventaCreada.codigo });

  } catch (error) {
    console.error(error);
    return new NextResponse("Error interno", { status: 500 });
  }
}