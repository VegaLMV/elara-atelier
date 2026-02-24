"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Palette, Phone, Mail, Type } from "lucide-react";
import Link from "next/link";
import { UploaderImage } from "@/components/ui/uploader-image";

type Settings = {
    id: string;
    storeName: string;
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

    contactEmail?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    address?: string | null;

    currency: string;
    locale: string;
};

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                {label}
            </label>
            {children}
        </div>
    );
}

export default function IdentidadClient({ initial }: { initial: Settings }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [s, setS] = useState<Settings>(initial);

    const preview = useMemo(() => {
        return {
            primary: s.primaryColor || "#0f172a",
            accent: s.accentColor || "#10b981",
            bg: s.backgroundColor || "#ffffff",
            fontH: s.fontHeading || "serif",
            fontB: s.fontBody || "sans-serif",
        };
    }, [s.primaryColor, s.accentColor, s.backgroundColor, s.fontHeading, s.fontBody]);

    async function guardar() {
        setBusy(true);
        setMsg(null);

        try {
            const r = await fetch("/api/admin/tienda/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(s),
                credentials: "include",
            });

            if (!r.ok) {
                const t = await r.text();
                throw new Error(t || "Error guardando");
            }

            const data = await r.json();
            setS(data);
            setMsg({ type: "ok", text: "Guardado correctamente ✅" });
            router.refresh();
        } catch (e: any) {
            setMsg({ type: "err", text: e?.message ?? "Error inesperado" });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
                <div className="flex items-start gap-4">
                    <Link
                        href="/admin/tienda"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group mt-1"
                        title="Volver"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-black" />
                    </Link>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
                                <Palette className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Identidad</h1>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl ml-1">
                            Ajusta estilo global tipográfico y visual.
                        </p>
                    </div>
                </div>

                <button
                    onClick={guardar}
                    disabled={busy}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 disabled:opacity-60"
                >
                    <Save className="w-4 h-4 text-emerald-400" />
                    {busy ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>

            {msg && (
                <div
                    className={`border rounded-2xl px-5 py-4 text-sm font-medium ${msg.type === "ok"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                >
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT: FORM */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Identidad */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-bold text-slate-900">Marca</h2>
                            <p className="text-xs text-slate-500 mt-1">Nombre y descripción de tu tienda.</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <Field label="Nombre de tienda">
                                <input
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                                    value={s.storeName}
                                    onChange={(e) => setS((p) => ({ ...p, storeName: e.target.value }))}
                                />
                            </Field>

                            <Field label="Tagline">
                                <input
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                                    placeholder="Ej: Diseños pensados para ti"
                                    value={s.tagline ?? ""}
                                    onChange={(e) => setS((p) => ({ ...p, tagline: e.target.value }))}
                                />
                            </Field>

                            <Field label="Descripción (SEO)">
                                <textarea
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium min-h-[100px]"
                                    placeholder="Se usará en Google y redes sociales"
                                    value={s.description ?? ""}
                                    onChange={(e) => setS((p) => ({ ...p, description: e.target.value }))}
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Assets Visuales */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <h2 className="font-bold text-slate-900 text-sm">Recursos Visuales</h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <UploaderImage
                                modulo="identidad"
                                label="Logo Principal"
                                url={s.logoUrl || null}
                                onUpload={(url) => setS((p) => ({ ...p, logoUrl: url }))}
                            />

                            <UploaderImage
                                modulo="identidad"
                                label="Favicon"
                                url={s.faviconUrl || null}
                                onUpload={(url) => setS((p) => ({ ...p, faviconUrl: url }))}
                            />

                            <UploaderImage
                                modulo="identidad"
                                label="Imagen OG / Redes"
                                url={s.ogImageUrl || null}
                                onUpload={(url) => setS((p) => ({ ...p, ogImageUrl: url }))}
                            />
                        </div>
                    </div>

                    {/* Estilos */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Type className="w-4 h-4" /> Tipografía y Colores
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Fuente Títulos">
                                    <input
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                        placeholder="Ej: Playfair Display, serif"
                                        value={s.fontHeading ?? ""}
                                        onChange={(e) => setS((p) => ({ ...p, fontHeading: e.target.value }))}
                                    />
                                </Field>
                                <Field label="Fuente Cuerpo">
                                    <input
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                        placeholder="Ej: Inter, sans-serif"
                                        value={s.fontBody ?? ""}
                                        onChange={(e) => setS((p) => ({ ...p, fontBody: e.target.value }))}
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                                <Field label="Color Primario">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={preview.primary}
                                            onChange={(e) => setS((p) => ({ ...p, primaryColor: e.target.value }))}
                                            className="w-10 h-10 rounded-lg border border-slate-200 shrink-0"
                                        />
                                        <input
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                                            value={s.primaryColor ?? ""}
                                            onChange={(e) => setS((p) => ({ ...p, primaryColor: e.target.value }))}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </Field>
                                <Field label="Color Acento">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={preview.accent}
                                            onChange={(e) => setS((p) => ({ ...p, accentColor: e.target.value }))}
                                            className="w-10 h-10 rounded-lg border border-slate-200 shrink-0"
                                        />
                                        <input
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                                            value={s.accentColor ?? ""}
                                            onChange={(e) => setS((p) => ({ ...p, accentColor: e.target.value }))}
                                            placeholder="#10b981"
                                        />
                                    </div>
                                </Field>
                                <Field label="Fondo Página">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={preview.bg}
                                            onChange={(e) => setS((p) => ({ ...p, backgroundColor: e.target.value }))}
                                            className="w-10 h-10 rounded-lg border border-slate-200 shrink-0"
                                        />
                                        <input
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                                            value={s.backgroundColor ?? ""}
                                            onChange={(e) => setS((p) => ({ ...p, backgroundColor: e.target.value }))}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PREVIEW */}
                <div className="lg:col-span-5 sticky top-6 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">Vista Previa</h3>
                                <p className="text-slate-400 text-xs">Simulación de interfaz</p>
                            </div>
                            {s.logoUrl && (
                                <img src={s.logoUrl} alt="Logo Preview" className="h-8 max-w-[100px] object-contain" />
                            )}
                        </div>

                        <div className="p-6 space-y-6" style={{ backgroundColor: preview.bg }}>
                            <div className="space-y-2">
                                <h4 style={{ color: preview.primary, fontFamily: preview.fontH }} className="text-2xl font-bold">
                                    {s.storeName}
                                </h4>
                                <p style={{ color: "slate-600", fontFamily: preview.fontB }} className="text-sm">
                                    {s.tagline || "Tagline de la tienda..."}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    style={{ backgroundColor: preview.primary, color: "#fff", fontFamily: preview.fontB }}
                                    className="px-6 py-2 rounded-xl text-sm font-bold shadow-lg"
                                >
                                    Botón Primario
                                </button>
                                <button
                                    style={{ backgroundColor: preview.accent, color: "#fff", fontFamily: preview.fontB }}
                                    className="px-6 py-2 rounded-xl text-sm font-bold shadow-lg"
                                >
                                    Acento
                                </button>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Contacto Preview</p>
                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {s.contactEmail || "email@tienda.com"}</div>
                                    <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {s.phone || "Whatsapp"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-xs font-medium">
                        💡 Estos cambios se aplicarán dinámicamente a la parte pública del catálogo.
                    </div>
                </div>
            </div>
        </div>
    );
}
