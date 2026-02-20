export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { absolutizeUrl, baseUrl } from "@/lib/site";
import {
    Instagram,
    Facebook,
    Twitter,
    Youtube,
    Music2,
    Phone,
    Mail,
    MapPin,
    Link2,
} from "lucide-react";

type StoreSettings = {
    storeName?: string | null;
    tagline?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    ogImageUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    backgroundColor?: string | null;
    fontHeading?: string | null;
    fontBody?: string | null;
    whatsapp?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    address?: string | null;
};

type NavItem = {
    id: string;
    location: "HEADER" | "FOOTER";
    label: string;
    href: string;
    order: number;
    enabled: boolean;
};

type SocialLink = {
    id: string;
    platform: string;
    url: string;
    order: number;
    enabled: boolean;
};

function iconForPlatform(platform: string) {
    const key = platform.toLowerCase();
    if (key.includes("insta")) return Instagram;
    if (key.includes("face")) return Facebook;
    if (key.includes("tiktok")) return Music2;
    if (key.includes("x") || key.includes("twitter")) return Twitter;
    if (key.includes("you")) return Youtube;
    return Link2;
}

async function getSettings(): Promise<StoreSettings> {
    const s = (await prisma.storeSettings?.findUnique?.({ where: { id: "default" } })) as
        | StoreSettings
        | null;
    return s ?? { storeName: "Elara Atelier" };
}

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSettings();
    const storeName = s.storeName ?? "Elara Atelier";
    const desc = s.description ?? "Catálogo público de Elara Atelier.";
    const og = s.ogImageUrl ? absolutizeUrl(s.ogImageUrl) : absolutizeUrl("/og-default.jpg");
    const favicon = s.faviconUrl ? absolutizeUrl(s.faviconUrl) : "/favicon.ico";

    return {
        metadataBase: new URL(baseUrl()),
        title: {
            default: `${storeName} | Catálogo`,
            template: `%s | ${storeName}`,
        },
        description: desc,
        icons: {
            icon: favicon,
            apple: favicon,
        },
        openGraph: {
            type: "website",
            siteName: storeName,
            title: `${storeName} | Catálogo`,
            description: desc,
            url: "/tienda",
            images: [{ url: og, width: 1200, height: 630, alt: storeName }],
        },
        twitter: {
            card: "summary_large_image",
            title: `${storeName} | Catálogo`,
            description: desc,
            images: [og],
        },
    };
}

export default async function CatalogoLayout({ children }: { children: React.ReactNode }) {
    const [settings, navItems, social] = await Promise.all([
        getSettings(),
        prisma.navigationItem?.findMany?.({
            where: { enabled: true },
            orderBy: [{ location: "asc" }, { order: "asc" }],
        }) as Promise<NavItem[]>,
        prisma.socialLink?.findMany?.({
            where: { enabled: true },
            orderBy: { order: "asc" },
        }) as Promise<SocialLink[]>,
    ]);

    const storeName = settings.storeName ?? "Elara Atelier";
    const headerLinks = (navItems ?? []).filter((i) => i.location === "HEADER");
    const footerLinks = (navItems ?? []).filter((i) => i.location === "FOOTER");

    const primary = settings.primaryColor ?? "#3f2f2f";
    const accent = settings.accentColor ?? "#864d2d";
    const bg = settings.backgroundColor ?? "#e6dad1";
    const fontH = settings.fontHeading || "Playfair Display, serif";
    const fontB = settings.fontBody || "Inter, sans-serif";

    // Generar URL de Google Fonts si parecen ser fuentes de Google (no nombres genéricos)
    const googleFonts = [];
    if (fontH && !fontH.includes(",")) googleFonts.push(fontH);
    if (fontB && !fontB.includes(",") && fontB !== fontH) googleFonts.push(fontB);

    const fontsUrl = googleFonts.length
        ? `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@400;700`).join('&')}&display=swap`
        : null;

    return (
        <div
            className="min-h-screen"
            style={
                {
                    "--brand-primary": primary,
                    "--brand-accent": accent,
                    "--brand-bg": bg,
                    "--brand-font-heading": fontH.includes(",") ? fontH : `'${fontH}', serif`,
                    "--brand-font-body": fontB.includes(",") ? fontB : `'${fontB}', sans-serif`,
                } as CSSProperties
            }
        >
            {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}

            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/50 shadow-sm transition-all duration-300">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <Link
                        href="/tienda"
                        className="flex items-center gap-3 group"
                    >
                        {settings.logoUrl ? (
                            <div className="relative h-12 md:h-14 w-32 md:w-40 transition-transform group-hover:scale-105">
                                <Image
                                    src={settings.logoUrl}
                                    alt={storeName}
                                    fill
                                    priority
                                    className="object-contain object-left"
                                />
                            </div>
                        ) : (
                            <span
                                className="text-xl md:text-2xl tracking-tight font-bold"
                                style={{ color: "var(--brand-primary)", fontFamily: "var(--brand-font-heading)" }}
                            >
                                {storeName}
                            </span>
                        )}
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {headerLinks.map((l) => (
                            <Link
                                key={l.id}
                                href={l.href}
                                className="hover:text-slate-900 transition-all hover:-translate-y-0.5 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-slate-900 after:transition-all hover:after:w-full"
                                style={{ fontFamily: "var(--brand-font-body)" }}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {settings.whatsapp && (
                            <a
                                href={`https://wa.me/${String(settings.whatsapp).replace(/\D/g, "")}`}
                                className="hidden md:inline-flex items-center justify-center px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 hover:shadow-xl hover:brightness-110 transition-all duration-300"
                                style={{ backgroundColor: "var(--brand-accent)", fontFamily: "var(--brand-font-body)" }}
                                target="_blank"
                                rel="noreferrer"
                            >
                                WhatsApp
                            </a>
                        )}

                        {headerLinks.length > 0 && (
                            <div className="md:hidden flex items-center gap-1">
                                <Link
                                    href={headerLinks[0].href}
                                    className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-600 px-3 py-2 rounded-full bg-slate-50 border border-slate-200"
                                    style={{ fontFamily: "var(--brand-font-body)" }}
                                >
                                    {headerLinks[0].label}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main
                style={{
                    backgroundColor: "var(--brand-bg)",
                    fontFamily: "var(--brand-font-body)"
                }}
            >
                {children}
            </main>

            {/* FOOTER */}
            <footer className="bg-[#3f2f2f] text-[#e6dad1]" style={{ fontFamily: "var(--brand-font-body)" }}>
                <div className="max-w-[1600px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-4 space-y-4">
                        <p
                            className="text-2xl font-bold text-[#e6dad1]"
                            style={{ fontFamily: "var(--brand-font-heading)" }}
                        >
                            {storeName}
                        </p>
                        {settings.tagline && <p className="text-sm text-[#e6dad1]/70">{settings.tagline}</p>}
                        {settings.description && (
                            <p className="text-sm text-[#e6dad1]/70 leading-relaxed">{settings.description}</p>
                        )}
                    </div>

                    <div className="md:col-span-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#e6dad1]/40 mb-4">Links</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {footerLinks.map((l) => (
                                <Link key={l.id} href={l.href} className="text-sm text-[#e6dad1]/70 hover:text-[#e6dad1] transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                            {footerLinks.length === 0 && <p className="text-sm text-[#e6dad1]/50">Sin links configurados.</p>}
                        </div>
                    </div>

                    <div className="md:col-span-4 space-y-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#e6dad1]/40">Contacto</p>

                        <div className="space-y-3">
                            {settings.contactEmail && (
                                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 text-sm text-[#e6dad1]/70 hover:text-[#e6dad1]">
                                    <Mail className="w-4 h-4" /> {settings.contactEmail}
                                </a>
                            )}
                            {(settings.phone || settings.whatsapp) && (
                                <div className="flex items-center gap-2 text-sm text-[#e6dad1]/70">
                                    <Phone className="w-4 h-4" />
                                    <span>{settings.phone ?? settings.whatsapp}</span>
                                </div>
                            )}
                            {settings.address && (
                                <div className="flex items-start gap-2 text-sm text-[#e6dad1]/70">
                                    <MapPin className="w-4 h-4 mt-0.5" />
                                    <span>{settings.address}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            {(social ?? []).map((s) => {
                                const Icon = iconForPlatform(s.platform);
                                return (
                                    <a
                                        key={s.id}
                                        href={s.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-10 h-10 rounded-xl bg-[#e6dad1]/5 border border-[#e6dad1]/10 flex items-center justify-center hover:bg-[#e6dad1]/10 transition"
                                        title={s.platform}
                                    >
                                        <Icon className="w-4 h-4 text-[#e6dad1]" />
                                    </a>
                                );

                            })}
                        </div>
                    </div>

                    <div className="md:col-span-12 pt-10 border-t border-[#e6dad1]/10 flex flex-col md:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-[#e6dad1]/40">
                            © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
