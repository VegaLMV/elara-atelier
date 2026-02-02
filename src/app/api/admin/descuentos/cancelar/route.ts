import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function POST(request: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const { ids } = await request.json(); // Array de IDs de DescuentoProducto

    if (!Array.isArray(ids) || ids.length === 0) {
      return new NextResponse("No se enviaron IDs", { status: 400 });
    }

    // 1. Marcar como CANCELADO en historial
    await prisma.descuentoProducto.updateMany({
      where: { id: { in: ids } },
      data: { estado: "CANCELADO" }
    });

    // 2. Limpiar productos que tengan estos descuentos como activos actualmente
    // (Solo aquellos cuyo descuentoActualId coincida con alguno de los IDs cancelados)
    // Prisma no soporta updateMany con join directo fácilmente para setear null condicional,
    // así que hacemos updateMany basado en la relación inversa si existe, o iteramos.
    // Para eficiencia en Postgres, podemos limpiar todos los productos cuyo descuentoActualId esté en la lista.
    
    // Primero, encontrar qué productos tienen estos descuentos activos para limpiarlos en el Producto
    // Esto es un "reset" visual del producto.
    
    // Opción rápida: Update many products where descuentoActualId IN ids
    // Pero en tu schema la relación es 'descuentoActualId', vamos a limpiar los campos de valor.
    await prisma.producto.updateMany({
      where: { descuentoActualId: { in: ids } },
      data: {
        descuentoActivo: false,
        descuentoTipo: null,
        descuentoValor: null,
        descuentoInicio: null,
        descuentoFin: null,
        descuentoActualId: null
      }
    });

    return NextResponse.json({ success: true, mensaje: "Campaña cancelada correctamente" });
  } catch (error) {
    console.error("Error cancelando masivo:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}