import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const cliente = await prisma.cliente.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(cliente);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  // PROTEGER CLIENTE PÚBLICO (Opcional, si usas el ID fijo del seed)
  // if (id === "PUBLICO") return NextResponse.json({ error: "No se puede eliminar el cliente público" }, { status: 400 });

  try {
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    // Error P2003 de Prisma: Constraint failed (tiene ventas)
    return NextResponse.json({ error: "No se puede eliminar: El cliente tiene ventas registradas." }, { status: 400 });
  }
}