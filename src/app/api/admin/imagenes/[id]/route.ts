export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import { supabaseAdmin, bucketProductos } from "@/lib/supabase-admin";

function extraerRutaDesdeUrl(url: string, bucket: string) {
  // .../storage/v1/object/public/<bucket>/<ruta>
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const img = await prisma.imagenProducto.findUnique({ where: { id } });
  if (!img) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const bucket = bucketProductos();
  const ruta = extraerRutaDesdeUrl(img.url, bucket);

  // Borra en storage (si podemos obtener ruta)
  if (ruta) {
    const supabase = supabaseAdmin();
    await supabase.storage.from(bucket).remove([ruta]);
  }

  await prisma.imagenProducto.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
