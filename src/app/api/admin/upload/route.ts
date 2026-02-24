export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/sesion";
import { supabaseAdmin, bucketProductos } from "@/lib/supabase-admin";

export async function POST(req: Request) {
    try {
        // 1. Verificación de Seguridad (Tu estándar)
        const sesion = await obtenerSesion();
        if (!sesion || sesion.rol !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const form = await req.formData();
        const file = form.get("file") as File;
        const modulo = form.get("modulo") as string; // Recibimos el módulo

        if (!file || !modulo) {
            return NextResponse.json({ error: "Faltan datos (archivo o módulo)" }, { status: 400 });
        }

        // 2. Preparar el archivo (Tu estándar de extensión)
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const nombreArchivo = `${crypto.randomUUID()}.${ext}`;
        
        // ✅ DISTRIBUCIÓN CORRECTA: Se guarda en la carpeta del módulo
        // Ejemplo: categorias/uuid.jpg o seo/uuid.jpg
        const ruta = `${modulo}/${nombreArchivo}`;

        // 3. Subir a Storage usando tu lib
        const supabase = supabaseAdmin();
        const bucket = bucketProductos();
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: upErr } = await supabase.storage.from(bucket).upload(ruta, buffer, {
            contentType: file.type,
            upsert: true,
        });

        if (upErr) throw upErr;

        // 4. Generar URL Pública
        const { data } = supabase.storage.from(bucket).getPublicUrl(ruta);
        
        return NextResponse.json({ url: data.publicUrl });

    } catch (e: any) {
        console.error("Upload API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}