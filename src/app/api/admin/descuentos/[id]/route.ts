import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await obtenerSesion();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;

  try {
    const descuento = await prisma.descuentoProducto.findUnique({
      where: { id },
      include: { producto: true }
    });

    if (!descuento) return new NextResponse("No encontrado", { status: 404 });

    // Si el descuento ya está cancelado o finalizado, tal vez queramos permitir borrarlo físicamente
    // Pero por ahora, asumimos que "eliminar" desde la UI significa "cancelar la campaña".

    // 1. Si estaba activo en el producto, lo quitamos del producto
    if (descuento.producto.descuentoActualId === id) {
      await prisma.producto.update({
        where: { id: descuento.productoId },
        data: {
          descuentoActivo: false,
          descuentoTipo: null,
          descuentoValor: null,
          descuentoInicio: null,
          descuentoFin: null,
          descuentoActualId: null,
        }
      });
    }

    // 2. Soft Delete: Cambiar estado a CANCELADO
    await prisma.descuentoProducto.update({
      where: { id },
      data: {
        estado: "CANCELADO"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelando descuento:", error);
    return new NextResponse("Error al cancelar", { status: 500 });
  }
}