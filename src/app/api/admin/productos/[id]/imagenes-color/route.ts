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

async function subirArchivoProductoColor(opts: {
  productoId: string;
  colorId: string;
  file: File;
}): Promise<string> {
  const { productoId, colorId, file } = opts;

  const mime = file.type || "";
  const ext =
    extFromName(file.name) ||
    (mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg");

  const nombreArchivo = `${crypto.randomUUID()}.${ext}`;
  // ✅ guardamos en subcarpeta /colores/{colorId}/
  const ruta = `${productoId}/colores/${colorId}/${nombreArchivo}`;

  const supabase = supabaseAdmin();
  const bucket = bucketProductos();

  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from(bucket).upload(ruta, bytes, {
    contentType: mime || "image/jpeg",
    upsert: true,
    cacheControl: "3600",
  });

  if (upErr) throw new Error(upErr.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
  return data.publicUrl;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: productoId } = await ctx.params;
  if (!productoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const rows = await prisma.imagenProductoColor.findMany({
    where: { productoId },
    include: { color: { select: { id: true, nombre: true, hex: true } } },
    orderBy: { color: { nombre: "asc" } },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      productoId: r.productoId,
      colorId: r.colorId,
      url: r.url,
      colorNombre: r.color.nombre,
      colorHex: r.color.hex,
    }))
  );
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion || sesion.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // rate limit
    const rl = ratelimit(`imgc:${ipFromReq(req)}`, 20, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });

    const { id: productoId } = await ctx.params;
    if (!productoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const form = await req.formData();
    const colorId = String(form.get("colorId") ?? "").trim();
    const file = form.get("file");

    if (!colorId) return NextResponse.json({ error: "Falta colorId" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta archivo (file)" }, { status: 400 });

    // validación imagen
    const mime = file.type || "";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    const maxMB = 6;
    if (file.size > maxMB * 1024 * 1024) {
      return NextResponse.json({ error: `Máximo ${maxMB}MB` }, { status: 400 });
    }

    // opcional: valida que el color exista
    const existeColor = await prisma.color.findUnique({ where: { id: colorId }, select: { id: true } });
    if (!existeColor) return NextResponse.json({ error: "Color no existe" }, { status: 400 });

    const url = await subirArchivoProductoColor({ productoId, colorId, file });

    const row = await prisma.imagenProductoColor.upsert({
      where: { productoId_colorId: { productoId, colorId } },
      create: { productoId, colorId, url },
      update: { url },
    });

    return NextResponse.json({ ok: true, id: row.id, url: row.url });
  } catch (e: any) {
    return NextResponse.json({ error: `Error interno: ${e?.message ?? String(e)}` }, { status: 500 });
  }
}
