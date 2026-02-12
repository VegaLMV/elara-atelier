export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { sesionAdmin } from "@/lib/sesion";
import { prisma } from "@/lib/prisma";
import NavegacionClient from "./navegacion-client";

export default async function Page() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const items = await prisma.navigationItem.findMany({
    orderBy: [{ location: "asc" }, { order: "asc" }],
  });

  return <NavegacionClient initial={items} />;
}
