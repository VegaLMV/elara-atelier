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
    ArrowRight
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
    return s ?? { storeName: "Élara Atelier" };
}

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSettings();
    const storeName = s.storeName ?? "Élara Atelier";
    const desc = s.description ?? "Catálogo público de Élara Atelier.";
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

import SmartHeader from "@/components/layout/smart-header";
import CartDrawer from "@/components/layout/cart-drawer";

export default async function CatalogoLayout({ children }: { children: React.ReactNode }) {
    const [settings, navItems, social, categorias] = await Promise.all([
        getSettings(),
        prisma.navigationItem?.findMany?.({
            where: { enabled: true },
            orderBy: [{ location: "asc" }, { order: "asc" }],
        }) as Promise<NavItem[]>,
        prisma.socialLink?.findMany?.({
            where: { enabled: true },
            orderBy: { order: "asc" },
        }) as Promise<SocialLink[]>,
        prisma.categoria.findMany({
            where: { visible: true },
            orderBy: { orden: "asc" }
        })
    ]);

    const storeName = settings.storeName ?? "Élara Atelier";
    const headerLinks = (navItems ?? []).filter((i) => i.location === "HEADER");
    const footerLinks = (navItems ?? []).filter((i) => i.location === "FOOTER");

    const primary = settings.primaryColor ?? "#3f2f2f";
    const accent = settings.accentColor ?? "#864d2d";
    const bg = settings.backgroundColor ?? "#e6dad1";
    const fontH = settings.fontHeading || "Playfair Display, serif";
    const fontB = settings.fontBody || "Inter, sans-serif";

    const googleFonts = [];
    if (fontH && !fontH.includes(",")) googleFonts.push(fontH);
    if (fontB && !fontB.includes(",") && fontB !== fontH) googleFonts.push(fontB);

    const fontsUrl = googleFonts.length
        ? `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;700;900`).join('&')}&display=swap`
        : null;

    return (
        <div
            className="min-h-screen overflow-x-hidden flex flex-col w-full relative"
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

            <SmartHeader
                settings={{
                    storeName,
                    logoUrl: settings.logoUrl
                }}
                navItems={headerLinks.map(l => ({ id: l.id, label: l.label, href: l.href }))}
                categorias={categorias.map(c => ({ id: c.id, nombre: c.nombre, slug: c.slug }))}
            />

            <CartDrawer />

            {/* MAIN */}
            <main
                className="pt-[112px]"
                style={{
                    backgroundColor: "var(--brand-bg)",
                    fontFamily: "var(--brand-font-body)"
                }}
            >
                {children}
            </main>

            {/* FOOTER PREMIUM */}
            <footer className="bg-[#3f2f2f] text-[#e6dad1] border-t border-[#e6dad1]/20" style={{ fontFamily: "var(--brand-font-body)" }}>

                {/* 2. Main Footer Links */}
                <div className="max-w-[1600px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
                    
                    {/* Brand Column */}
                    <div className="md:col-span-12 lg:col-span-5 space-y-6 pr-0 lg:pr-12 text-center lg:text-left">
                        <p className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-white tracking-wide leading-none" style={{ fontFamily: "var(--brand-font-heading)" }}>
                            {storeName}
                        </p>
                        {settings.tagline && <p className="text-xs text-[#864d2d] font-bold uppercase tracking-[0.3em]">{settings.tagline}</p>}
                        {settings.description && (
                            <p className="text-sm text-[#e6dad1]/60 leading-relaxed font-light max-w-md mx-auto lg:mx-0">
                                {settings.description}
                            </p>
                        )}
                    </div>

                    {/* Links Column */}
                    <div className="md:col-span-4 lg:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8">Descubrir</p>
                        <ul className="space-y-5">
                            {footerLinks.map((l) => (
                                <li key={l.id}>
                                    <Link href={l.href} className="text-sm text-[#e6dad1]/60 hover:text-white hover:pl-2 transition-all duration-300 font-light relative w-fit">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                            {footerLinks.length === 0 && <li className="text-sm text-[#e6dad1]/40">Navegación en curso</li>}
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8">Atención al Cliente</p>
                        <ul className="space-y-5 font-light text-sm text-[#e6dad1]/60">
                            {settings.contactEmail && (
                                <li>
                                    <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors flex items-center gap-4">
                                        <Mail className="w-4 h-4 text-[#864d2d]" /> {settings.contactEmail}
                                    </a>
                                </li>
                            )}
                            {(settings.phone || settings.whatsapp) && (
                                <li>
                                    <div className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                                        <Phone className="w-4 h-4 text-[#864d2d]" />
                                        <span>{settings.phone ?? settings.whatsapp}</span>
                                    </div>
                                </li>
                            )}
                            {settings.address && (
                                <li className="flex items-start gap-4">
                                    <MapPin className="w-4 h-4 text-[#864d2d] mt-1 shrink-0" />
                                    <span className="leading-relaxed hover:text-white transition-colors">{settings.address}</span>
                                </li>
                            )}
                            {!settings.contactEmail && !settings.phone && !settings.whatsapp && !settings.address && (
                                <li>Contacto en actualización.</li>
                            )}
                        </ul>
                    </div>

                    {/* Social Column */}
                    <div className="md:col-span-4 lg:col-span-2 lg:flex lg:justify-end">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-8 lg:text-right">Social</p>
                            <div className="flex flex-wrap lg:flex-col gap-4 lg:items-end">
                                {(social ?? []).map((s) => {
                                    const Icon = iconForPlatform(s.platform);
                                    return (
                                        <a
                                            key={s.id}
                                            href={s.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-3 text-[#e6dad1]/60 hover:text-white transition-colors"
                                            title={s.platform}
                                        >
                                            <span className="text-[11px] tracking-[0.2em] uppercase hidden lg:block group-hover:pr-1 transition-all">{s.platform}</span>
                                            <div className="w-10 h-10 rounded-full border border-[#e6dad1]/20 flex items-center justify-center group-hover:border-[#864d2d] group-hover:bg-[#864d2d]/10 transition-all duration-300">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Bottom Bar */}
                <div className="border-t border-[#e6dad1]/10 bg-[#352727]">
                    <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] text-[#e6dad1]/40 tracking-widest uppercase">
                            © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6 text-[10px] text-[#e6dad1]/40 uppercase tracking-[0.2em] font-medium">
                            <span className="text-[#864d2d]">Diseñado en Ica, Perú</span>
                        </div>
                    </div>
                </div>

            </footer>
        </div>
    );
}