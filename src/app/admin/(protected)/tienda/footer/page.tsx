export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { sesionAdmin } from "@/lib/sesion";
import { prisma } from "@/lib/prisma";
import FooterClient from "./footer-client";

export default async function Page() {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    const footerLinks = await prisma.navigationItem.findMany({
        where: { location: "FOOTER" },
        orderBy: { order: "asc" },
    });

    const social = await prisma.socialLink.findMany({
        orderBy: { order: "asc" },
    });

    return <FooterClient initialLinks={footerLinks} initialSocial={social} />;
}
