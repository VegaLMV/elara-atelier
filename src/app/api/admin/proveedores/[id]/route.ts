import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    const { id } = await params;
    const body = await req.json();
    
    const { 
      nombre, 
      telefono, 
      correo, 
      ruc, 
      razonSocial, 
      departamento, 
      provincia, 
      distrito, 
      direccion 
    } = body;

    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: {
        nombre,
        telefono,
        correo,
        ruc,
        razonSocial,
        departamento,
        provincia,
        distrito,
        direccion,
      },
    });

    return NextResponse.json(proveedor);
  } catch (error) {
    console.error("Error actualizando proveedor:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    const { id } = await params;

    await prisma.proveedor.delete({
      where: { id },
    });

    return new NextResponse("Proveedor eliminado");
  } catch (error) {
    console.error("Error eliminando proveedor:", error);
    return new NextResponse("Error al eliminar (puede tener compras asociadas)", { status: 500 });
  }
}