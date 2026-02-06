import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { Prisma } from "@prisma/client"; // <--- IMPORTANTE: Faltaba esto

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

    // --- 4. Cálculos Financieros ---
    let subtotalVenta = 0;
    let descuentoTotalVenta = 0;
    let totalVenta = 0;

    const itemsProcesados = items.map((item: any) => {
        const precioUnit = Number(item.precioUnitario);
        const precioFinal = Number(item.precioFinal);
        const cantidad = Number(item.cantidad);
        const descuentoUnit = Number(item.descuentoAplicado || 0);

        const subtotalLinea = precioFinal * cantidad; // Lo que paga el cliente
        
        subtotalVenta += precioUnit * cantidad; // Precio original total
        descuentoTotalVenta += descuentoUnit * cantidad;
        totalVenta += subtotalLinea;

        return { 
            varianteId: item.varianteId,
            cantidad: cantidad,
            precioUnitario: precioUnit,
            precioFinal: precioFinal,
            subtotal: subtotalLinea,
            tieneDescuento: descuentoUnit > 0,
            descuentoMonto: descuentoUnit,
            descuentoRazon: item.descuentoRazon || (descuentoUnit > 0 ? "Oferta POS" : null)
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
                    create: itemsProcesados
                }
            }
        });

        // B. Registrar Empaques
        if (empaques && empaques.length > 0) {
            for (const emp of empaques) {
                const dataEmp = await tx.tipoEmpaque.findUnique({ where: { id: emp.tipoEmpaqueId } });
                await tx.usoEmpaque.create({
                    data: {
                        ventaId: venta.id,
                        tipoEmpaqueId: emp.tipoEmpaqueId,
                        cantidad: emp.cantidad,
                        costoTotal: Number(dataEmp?.costoUnitario || 0) * emp.cantidad
                    }
                });
                await tx.tipoEmpaque.update({
                    where: { id: emp.tipoEmpaqueId },
                    data: { stock: { decrement: emp.cantidad } }
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
                    costoUnitario: new Prisma.Decimal(item.precioFinal.toString()),
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