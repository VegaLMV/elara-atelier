export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { sesionAdmin } from "@/lib/sesion";
import { prisma } from "@/lib/prisma";
import IntegracionesClient from "./integraciones-client";

export default async function Page() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const settings =
    (await prisma.storeSettings.findUnique({ where: { id: "default" } })) ??
    (await prisma.storeSettings.create({
      data: { id: "default", storeName: "Elara Atelier", currency: "PEN", locale: "es-PE" },
    }));

  return <IntegracionesClient initial={settings} />;
}
