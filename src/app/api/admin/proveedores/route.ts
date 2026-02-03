import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function POST(req: Request) {
  try {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

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

    if (!nombre) return new NextResponse("El nombre es obligatorio", { status: 400 });

    const proveedor = await prisma.proveedor.create({
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
    console.error("Error creando proveedor:", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}