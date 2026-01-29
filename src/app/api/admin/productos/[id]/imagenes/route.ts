export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { supabaseAdmin, bucketProductos } from "@/lib/supabase-admin";
import { ratelimit, ipFromReq } from "@/lib/ratelimit";

function extFromName(nombre: string) {
  const parts = nombre.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1) Auth
    const sesion = await obtenerSesion();
    if (!sesion || sesion.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 2) Rate limit
    const rl = ratelimit(`img:${ipFromReq(req)}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    }

    // 3) Params (Next 16)
    const { id: productoId } = await params;
    if (!productoId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // 4) FormData
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta archivo (file)" }, { status: 400 });
    }

    // 5) Validación
    const mime = file.type || "";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    const maxMB = 6;
    if (file.size > maxMB * 1024 * 1024) {
      return NextResponse.json({ error: `Máximo ${maxMB}MB` }, { status: 400 });
    }

    const ext =
      extFromName(file.name) ||
      (mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg");

    const nombreArchivo = `${crypto.randomUUID()}.${ext}`;
    const ruta = `${productoId}/${nombreArchivo}`;

    // 6) Subir a Storage
    const supabase = supabaseAdmin();
    const bucket = bucketProductos();

    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage.from(bucket).upload(ruta, bytes, {
      contentType: mime || "image/jpeg",
      upsert: true, // <-- más robusto
      cacheControl: "3600",
    });

    if (upErr) {
      return NextResponse.json({ error: `Error subiendo: ${upErr.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
    const url = data.publicUrl;

    // 7) Calcular orden robusto: MAX(orden)+1
    const agg = await prisma.imagenProducto.aggregate({
      where: { productoId },
      _max: { orden: true },
      _count: { _all: true },
    });

    const maxOrden = agg._max.orden ?? -1;
    const total = agg._count._all ?? 0;
    const siguienteOrden = maxOrden + 1;

    // 8) Guardar en BD
    const creada = await prisma.imagenProducto.create({
      data: {
        productoId,
        url,
        esPortada: total === 0,
        orden: siguienteOrden,
      },
    });

    return NextResponse.json(
      { id: creada.id, url: creada.url, esPortada: creada.esPortada, orden: creada.orden },
      { status: 201 }
    );
  } catch (e: any) {
    // Si algo falló, devolvemos error real
    return NextResponse.json(
      { error: `Error interno: ${e?.message ?? String(e)}` },
      { status: 500 }
    );
  }
}
