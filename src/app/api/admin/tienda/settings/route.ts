export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

const DEFAULT_ID = "default";

function optString(v: any) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function GET() {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  let settings = await prisma.storeSettings.findUnique({
    where: { id: DEFAULT_ID },
  });

  // Si no existe, creamos una config base
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        id: DEFAULT_ID,
        storeName: "Elara Atelier",
        currency: "PEN",
        locale: "es-PE",
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  // storeName es obligatorio si lo mandas
  if ("storeName" in body) {
    const name = String(body.storeName ?? "").trim();
    if (!name) return NextResponse.json({ error: "storeName es requerido" }, { status: 400 });
  }

  const data: any = {};
  if ("storeName" in body) data.storeName = String(body.storeName).trim();
  if ("tagline" in body) data.tagline = optString(body.tagline);
  if ("description" in body) data.description = optString(body.description);

  if ("logoUrl" in body) data.logoUrl = optString(body.logoUrl);
  if ("faviconUrl" in body) data.faviconUrl = optString(body.faviconUrl);
  if ("ogImageUrl" in body) data.ogImageUrl = optString(body.ogImageUrl);

  if ("primaryColor" in body) data.primaryColor = optString(body.primaryColor);
  if ("accentColor" in body) data.accentColor = optString(body.accentColor);
  if ("backgroundColor" in body) data.backgroundColor = optString(body.backgroundColor);

  if ("fontHeading" in body) data.fontHeading = optString(body.fontHeading);
  if ("fontBody" in body) data.fontBody = optString(body.fontBody);

  if ("contactEmail" in body) data.contactEmail = optString(body.contactEmail);
  if ("phone" in body) data.phone = optString(body.phone);
  if ("whatsapp" in body) data.whatsapp = optString(body.whatsapp);
  if ("address" in body) data.address = optString(body.address);

  if ("currency" in body) data.currency = String(body.currency ?? "PEN").trim() || "PEN";
  if ("locale" in body) data.locale = String(body.locale ?? "es-PE").trim() || "es-PE";

  const updated = await prisma.storeSettings.upsert({
    where: { id: DEFAULT_ID },
    create: {
      id: DEFAULT_ID,
      storeName: data.storeName ?? "Elara Atelier",
      currency: data.currency ?? "PEN",
      locale: data.locale ?? "es-PE",
      ...data,
    },
    update: data,
  });

  return NextResponse.json(updated);
}
