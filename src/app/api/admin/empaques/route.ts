export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { Prisma } from "@prisma/client";
import { supabaseAdmin, bucketProductos } from "@/lib/supabase-admin";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await prisma.tipoEmpaque.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    // 1. Procesar FormData (necesario para archivos)
    const formData = await req.formData();
    const nombre = String(formData.get("nombre") ?? "").trim();
    const costoUnitario = formData.get("costoUnitario");
    const file = formData.get("imagen") as File | null;
    const stock = formData.get("stock");

    // Validaciones
    if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    if (!costoUnitario || isNaN(Number(costoUnitario)) || Number(costoUnitario) < 0) {
      return NextResponse.json({ error: "Costo unitario inválido" }, { status: 400 });
    }

    let imagenUrl: string | null = null;

    // 2. Subir imagen a Supabase (si existe)
    if (file && file.size > 0) {
        const bucket = bucketProductos(); // Tu bucket configurado
        const ext = file.name.split(".").pop();
        const fileName = `empaques/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
        
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabaseAdmin()
            .storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error("Error subiendo a Supabase:", uploadError);
            return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
        }

        // Obtener URL pública
        const { data } = supabaseAdmin()
            .storage
            .from(bucket)
            .getPublicUrl(fileName);
            
        imagenUrl = data.publicUrl;
    }

    // 3. Guardar en Base de Datos
    const created = await prisma.tipoEmpaque.create({
      data: {
        nombre,
        costoUnitario: new Prisma.Decimal(String(costoUnitario)),
        activo: true,
        imagenUrl: imagenUrl,
        stock: stock ? Number(stock) : 0
      },
    });

    return NextResponse.json(created, { status: 201 });

  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Nombre de empaque ya existe" }, { status: 409 });
    }
    console.error("POST /empaques error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}