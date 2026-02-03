import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  
  const { id } = await params;
  const body = await request.json();
  const { nombre, costoUnitario, stock } = body;

  try {
    const dataToUpdate: any = {};
    
    if (nombre) dataToUpdate.nombre = nombre;
    
    if (costoUnitario !== undefined) {
       dataToUpdate.costoUnitario = new Prisma.Decimal(String(costoUnitario));
    }
    
    if (stock !== undefined) {
       const stockNum = parseInt(String(stock), 10);
       if (!isNaN(stockNum) && stockNum >= 0) {
          dataToUpdate.stock = stockNum;
       }
    }

    const actualizado = await prisma.tipoEmpaque.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const { activo } = await request.json();

  try {
    await prisma.tipoEmpaque.update({ where: { id }, data: { activo } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const sesion = await obtenerSesion();
    if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const { id } = await params;
  
    try {
      await prisma.tipoEmpaque.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "No se puede eliminar (en uso)" }, { status: 500 });
    }
}