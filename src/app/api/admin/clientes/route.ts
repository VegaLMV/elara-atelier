import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  // Buscamos por Nombre, DNI o Teléfono
  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { dni: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { nombre: "asc" },
    take: 50,
  });

  return NextResponse.json(clientes);
}

export async function POST(request: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    
    if (body.dni) {
        const existe = await prisma.cliente.findUnique({ where: { dni: body.dni } });
        if (existe) return NextResponse.json({ error: "El DNI ya está registrado" }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({ data: body });
    return NextResponse.json(cliente);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
  }
}