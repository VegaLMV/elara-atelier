"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Plus,
    ChevronUp,
    ChevronDown,
    ToggleLeft,
    ToggleRight,
    LayoutPanelTop,
    Search,
    Trash2,
    Check,
    Loader2,
    X
} from "lucide-react";
import { UploaderImage } from "@/components/ui/uploader-image";
import { formatMoney } from "@/lib/precios";

type TipoSeccionHome =
    | "HERO"
    | "BEST_SELLERS"
    | "FEATURED_COLLECTIONS"
    | "STORY"
    | "NEWSLETTER"
    | "CONTACT"
    | "BENEFITS"
    | "FEATURED_CATEGORIES"
    | "BRAND_ESSENCE"
    | "PROMO_CAMPAIGN";

type HomeSection = {
    id: string;
    type: TipoSeccionHome;
    enabled: boolean;
    order: number;
    content: any;
};

const LABEL: Record<TipoSeccionHome, string> = {
    HERO: "Hero principal",
    BEST_SELLERS: "Más vendidos",
    FEATURED_COLLECTIONS: "Colecciones",
    STORY: "Historia",
    NEWSLETTER: "Newsletter",
    CONTACT: "Contacto",
    BENEFITS: "Barra de Confianza",
    FEATURED_CATEGORIES: "Categorías Destacadas",
    BRAND_ESSENCE: "Esencia de Marca",
    PROMO_CAMPAIGN: "Campaña Publicitaria",
};

function normalizeOrders(sections: HomeSection[]) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    return sorted.map((s, i) => ({ ...s, order: i }));
}

function ProductPicker({
    selectedIds,
    onToggle,
}: {
    selectedIds: string[];
    onToggle: (id: string) => void;
}) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        if (!q.trim()) return products;
        return products.filter((p) =>
            p.nombre.toLowerCase().includes(q.toLowerCase())
        );
    }, [products, q]);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch("/api/admin/productos");
            const d = await r.json();
            setProducts(d);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useMemo(() => {
        load();
    }, []);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs"
                    placeholder="Buscar producto..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        No se encontraron productos
                    </div>
                ) : (
                    filtered.map((p) => {
                        const isSelected = selectedIds.includes(p.id);
                        const img = p.imagenes?.[0]?.url || "";
                        const pOriginal = Number(p.precio);
                        const tieneDesc = p.descuentoActivo;

                        return (
                            <div
                                key={p.id}
                                onClick={() => onToggle(p.id)}
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50" : ""
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                    {img && <img src={img} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {p.nombre}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            {formatMoney(pOriginal)}
                                        </p>
                                        {tieneDesc && (
                                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1 rounded font-bold">
                                                DESC
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isSelected ? (
                                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function CampaignPicker({
    selectedId,
    onSelect,
}: {
    selectedId: string | null;
    onSelect: (campaign: any | null) => void;
}) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch("/api/admin/descuentos/lista");
            const d = await r.json();
            setCampaigns(d);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useMemo(() => {
        load();
    }, []);

    const selected = campaigns.find(c => c.id === selectedId);

    return (
        <div className="space-y-4">
            <div className="max-h-[250px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        No hay campañas activas o programadas
                    </div>
                ) : (
                    campaigns.map((c) => {
                        const isSelected = selectedId === c.id;
                        return (
                            <div
                                key={c.id}
                                onClick={() => onSelect(isSelected ? null : c)}
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50 border-l-4 border-slate-900" : ""
                                    }`}
                            >
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{c.nombre}</p>
                                    <p className="text-[10px] text-slate-500">
                                        {c.tipo} {c.valor}{c.tipo === 'PORCENTAJE' ? '%' : '$'} • {c.estado}
                                    </p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">
                                        Validez: {new Date(c.startsAt).toLocaleDateString()} - {new Date(c.endsAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {isSelected ? (
                                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            {selected && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Productos en esta campaña:</p>
                    <div className="flex flex-wrap gap-2">
                        {selected.detalles?.slice(0, 5).map((d: any) => (
                            <div key={d.producto.id} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-md">
                                {d.producto.nombre}
                            </div>
                        ))}
                        {selected.detalles?.length > 5 && (
                            <div className="text-[10px] text-slate-400 px-2 py-1">+{selected.detalles.length - 5} más</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function HomeSeccionesClient({ initial }: { initial: HomeSection[] }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [sections, setSections] = useState<HomeSection[]>(normalizeOrders(initial));
    const [selectedId, setSelectedId] = useState<string>(sections[0]?.id ?? "");

    const selected = useMemo(
        () => sections.find((s) => s.id === selectedId) ?? sections[0],
        [sections, selectedId]
    );

    function updateSelected(patch: Partial<HomeSection>) {
        if (!selected) return;
        setSections((prev) =>
            prev.map((s) => (s.id === selected.id ? { ...s, ...patch } : s))
        );
    }

    function updateSelectedContent(patch: any) {
        if (!selected) return;
        updateSelected({ content: { ...(selected.content ?? {}), ...patch } });
    }

    function move(id: string, dir: "up" | "down") {
        setSections((prev) => {
            const sorted = normalizeOrders(prev);
            const idx = sorted.findIndex((s) => s.id === id);
            if (idx < 0) return prev;

            const swapWith = dir === "up" ? idx - 1 : idx + 1;
            if (swapWith < 0 || swapWith >= sorted.length) return prev;

            const copy = [...sorted];
            [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
            return normalizeOrders(copy);
        });
    }

    function toggle(id: string) {
        setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    }

    function addSection(type: TipoSeccionHome) {
        const id = `temp_${Date.now()}`;
        const base: HomeSection = {
            id,
            type,
            enabled: true,
            order: sections.length,
            content: {},
        };

        // defaults rápidos por tipo
        if (type === "HERO") base.content = { title: "Título", subtitle: "Subtítulo", ctaText: "Ver catálogo", ctaHref: "/tienda/catalogo", imageUrl: null, overlayOpacity: 0.25 };
        if (type === "BEST_SELLERS") base.content = {
            title: "NEW LAUNCH",
            subtitle: "BEST SELLER",
            bannerTitle: "The Pink Aurora Tulle Dress",
            bannerCtaText: "VIEW ALL",
            bannerCtaHref: "/tienda/catalogo",
            bannerImageUrl: null,
            mode: "automático", // automático, manual
            manualProductIds: []
        };
        if (type === "STORY") base.content = { title: "Nuestra historia", body: "Texto...", imageUrl: null, ctaText: "Conócenos", ctaHref: "/tienda/catalogo" };
        if (type === "CONTACT") base.content = { title: "Contáctanos", subtitle: "WhatsApp", showMap: false, mapUrl: null };
        if (type === "BENEFITS") base.content = {
            items: [
                { icon: "Truck", title: "Envío Prioritario", desc: "A todo el país en 24-48h" },
                { icon: "ShieldCheck", title: "Compra Segura", desc: "Garantía de satisfacción total" },
                { icon: "Heart", title: "Diseño Local", desc: "Hecho con amor y calidad" },
                { icon: "Sparkles", title: "Calidad Premium", desc: "Telas y acabados de lujo" },
            ]
        };
        if (type === "FEATURED_CATEGORIES") base.content = { title: "Colecciones", subtitle: "Explora lo mejor", categories: [] };
        if (type === "BRAND_ESSENCE") base.content = { tagline: "Nuestra Esencia", title: "Elara Atelier", body: "...", imageUrl: null, quote: null };
        if (type === "NEWSLETTER") base.content = { badge: "VIP", title: "Únete", subtitle: "Regístrate hoy" };
        if (type === "PROMO_CAMPAIGN") base.content = { selectedCampaignId: null, title: "", subtitle: "" };

        setSections((prev) => normalizeOrders([...prev, base]));
        setSelectedId(id);
    }

    async function guardar() {
        setBusy(true);
        setMsg(null);

        try {
            const payload = {
                sections: normalizeOrders(sections).map((s) => ({
                    // si es temp_ lo mandamos sin id para que el endpoint cree
                    id: s.id.startsWith("temp_") ? undefined : s.id,
                    type: s.type,
                    enabled: s.enabled,
                    order: s.order,
                    content: s.content ?? {},
                }))
            };

            const r = await fetch("/api/admin/tienda/home-secciones", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });

            if (!r.ok) {
                const t = await r.text();
                throw new Error(t || "Error guardando secciones");
            }

            const data = (await r.json()) as HomeSection[];
            setSections(normalizeOrders(data));
            setSelectedId(data[0]?.id ?? "");
            setMsg({ type: "ok", text: "Secciones guardadas ✅" });
            router.refresh();
        } catch (e: any) {
            setMsg({ type: "err", text: e?.message ?? "Error inesperado" });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
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
                                <LayoutPanelTop className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Home Secciones</h1>
                        </div>
                        <p className="text-sm text-gray-500 max-w-2xl ml-1">
                            Ordena, activa/desactiva y edita secciones como Squarespace (Hales).
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
                {/* LEFT: LIST */}
                <div className="lg:col-span-4 sticky top-6 space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight">Secciones</h3>
                                    <p className="text-slate-400 text-xs">Orden y visibilidad</p>
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        className="bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2"
                                        onClick={() => addSection("HERO")}
                                        title="Añadir Hero rápido"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {(Object.keys(LABEL) as TipoSeccionHome[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => addSection(t)}
                                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50 max-h-[70vh] overflow-y-auto">
                            {sections
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .map((sec) => {
                                    const active = sec.id === selectedId;
                                    return (
                                        <div
                                            key={sec.id}
                                            onClick={() => setSelectedId(sec.id)}
                                            className={`w-full cursor-pointer text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors ${active ? "bg-slate-50 ring-2 ring-slate-900/10" : ""
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {sec.type} • #{sec.order + 1}
                                                </p>
                                                <p className="font-bold text-slate-900 truncate">{LABEL[sec.type]}</p>
                                                <p className="text-xs text-slate-500 truncate mt-1">
                                                    {sec.content?.title || sec.content?.subtitle || "Sin título"}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggle(sec.id);
                                                    }}
                                                    className="text-slate-600 hover:text-slate-900"
                                                    title={sec.enabled ? "Desactivar" : "Activar"}
                                                >
                                                    {sec.enabled ? (
                                                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                                                    ) : (
                                                        <ToggleLeft className="w-6 h-6 text-slate-300" />
                                                    )}
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            move(sec.id, "up");
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
                                                        title="Subir"
                                                    >
                                                        <ChevronUp className="w-4 h-4 text-slate-500" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            move(sec.id, "down");
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-white border border-transparent hover:border-slate-200"
                                                        title="Bajar"
                                                    >
                                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: EDITOR */}
                <div className="lg:col-span-8 space-y-6">
                    {!selected ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                            Selecciona una sección para editar.
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Editor • {selected.type}
                                </p>
                                <h2 className="font-bold text-slate-900">{LABEL[selected.type]}</h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Edita el contenido que se renderizará en el home público.
                                </p>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Campos comunes (Título) */}
                                {("title" in (selected.content ?? {}) ||
                                    ["HERO", "BEST_SELLERS", "STORY", "CONTACT", "FEATURED_CATEGORIES", "BRAND_ESSENCE", "NEWSLETTER"].includes(selected.type)) && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Title</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                                                value={selected.content?.title ?? ""}
                                                onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                            />
                                        </div>
                                    )}

                                {/* HERO */}
                                {selected.type === "HERO" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subtitle</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                                                value={selected.content?.subtitle ?? ""}
                                                onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CTA Text</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaText ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CTA Href</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaHref ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaHref: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <UploaderImage
                                            label="Imagen de Fondo"
                                            url={selected.content?.imageUrl || null}
                                            onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                        />

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Overlay opacity (0 - 1)</label>
                                            <input
                                                type="number"
                                                step="0.05"
                                                min={0}
                                                max={1}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.overlayOpacity ?? 0.25}
                                                onChange={(e) =>
                                                    updateSelectedContent({ overlayOpacity: Number(e.target.value) })
                                                }
                                            />
                                        </div>
                                    </>
                                )}

                                {/* BEST_SELLERS - DUAL SECTION */}
                                {selected.type === "BEST_SELLERS" && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuración de Pestañas</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Título Pestaña 1</label>
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                        placeholder="Novedades"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Título Pestaña 2</label>
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                        placeholder="Más Vendidos"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banner Destacado (Izquierda)</h3>

                                            <div className="space-y-4">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Vincular a Campaña (Opcional)</label>
                                                <CampaignPicker
                                                    selectedId={selected.content?.selectedCampaignId || null}
                                                    onSelect={(c) => {
                                                        if (c) {
                                                            updateSelectedContent({
                                                                selectedCampaignId: c.id,
                                                                bannerTitle: c.nombre,
                                                                bannerCtaText: "Ver Ofertas",
                                                                bannerCtaHref: `/tienda/catalogo?campana=${c.id}`
                                                            });
                                                        } else {
                                                            updateSelectedContent({
                                                                selectedCampaignId: null,
                                                                bannerTitle: "",
                                                                bannerCtaText: "VIEW ALL",
                                                                bannerCtaHref: "/tienda/catalogo"
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {!selected.content?.selectedCampaignId && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título Banner</label>
                                                        <input
                                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                            value={selected.content?.bannerTitle ?? ""}
                                                            onChange={(e) => updateSelectedContent({ bannerTitle: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Texto Botón</label>
                                                        <input
                                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                            value={selected.content?.bannerCtaText ?? "VIEW ALL"}
                                                            onChange={(e) => updateSelectedContent({ bannerCtaText: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {!selected.content?.selectedCampaignId && (
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Enlace Botón</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                        value={selected.content?.bannerCtaHref ?? "/tienda/catalogo"}
                                                        onChange={(e) => updateSelectedContent({ bannerCtaHref: e.target.value })}
                                                    />
                                                </div>
                                            )}

                                            <UploaderImage
                                                label={selected.content?.selectedCampaignId ? "Portada personalizada de la Campaña" : "Imagen del Banner"}
                                                url={selected.content?.bannerImageUrl || null}
                                                onUpload={(url) => updateSelectedContent({ bannerImageUrl: url })}
                                            />
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pestaña "Más Vendidos"</h3>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modo de Selección</label>
                                                <div className="flex gap-2">
                                                    {["automático", "manual"].map((m) => (
                                                        <button
                                                            key={m}
                                                            type="button"
                                                            onClick={() => updateSelectedContent({ mode: m })}
                                                            className={`flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${(selected.content?.mode || "automático") === m
                                                                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                                }`}
                                                        >
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {(selected.content?.mode || "automático") === "manual" && (
                                                <div className="space-y-4 pt-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Seleccionar Productos</label>
                                                    <ProductPicker
                                                        selectedIds={selected.content?.manualProductIds || []}
                                                        onToggle={(id) => {
                                                            const current = selected.content?.manualProductIds || [];
                                                            const next = current.includes(id)
                                                                ? current.filter((x: string) => x !== id)
                                                                : [...current, id];
                                                            updateSelectedContent({ manualProductIds: next });
                                                        }}
                                                    />

                                                    {selected.content?.manualProductIds?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {selected.content.manualProductIds.map((id: string) => (
                                                                <div key={id} className="bg-slate-100 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-200">
                                                                    ID: {id.slice(-6)}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = selected.content.manualProductIds.filter((x: string) => x !== id);
                                                                            updateSelectedContent({ manualProductIds: next });
                                                                        }}
                                                                        className="hover:text-red-500"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STORY */}
                                {selected.type === "STORY" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Body</label>
                                            <textarea
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium min-h-[140px]"
                                                value={selected.content?.body ?? ""}
                                                onChange={(e) => updateSelectedContent({ body: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CTA Text</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaText ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">CTA Href</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaHref ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaHref: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <UploaderImage
                                                key={`story-img-${selected.id}`}
                                                label="Imagen de Historia"
                                                url={selected.content?.imageUrl || null}
                                                onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* CONTACT */}
                                {selected.type === "CONTACT" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subtitle</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.subtitle ?? ""}
                                                onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(selected.content?.showMap)}
                                                onChange={(e) => updateSelectedContent({ showMap: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            Mostrar mapa
                                        </label>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Map URL</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                placeholder="https://maps.google.com/..."
                                                value={selected.content?.mapUrl ?? ""}
                                                onChange={(e) => updateSelectedContent({ mapUrl: e.target.value || null })}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* BENEFITS */}
                                {selected.type === "BENEFITS" && (
                                    <div className="space-y-6">
                                        {(selected.content?.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Beneficio #{idx + 1}</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Icono (Lucide)</label>
                                                        <input
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                            value={item.icon || ""}
                                                            onChange={(e) => {
                                                                const newItems = [...selected.content.items];
                                                                newItems[idx].icon = e.target.value;
                                                                updateSelectedContent({ items: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Título</label>
                                                        <input
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                            value={item.title || ""}
                                                            onChange={(e) => {
                                                                const newItems = [...selected.content.items];
                                                                newItems[idx].title = e.target.value;
                                                                updateSelectedContent({ items: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción</label>
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                        value={item.desc || ""}
                                                        onChange={(e) => {
                                                            const newItems = [...selected.content.items];
                                                            newItems[idx].desc = e.target.value;
                                                            updateSelectedContent({ items: newItems });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* FEATURED_CATEGORIES */}
                                {selected.type === "FEATURED_CATEGORIES" && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subtítulo</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.subtitle ?? ""}
                                                onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Categorías</p>
                                            {(selected.content?.categories || []).map((cat: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre</label>
                                                            <input
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                                value={cat.title || ""}
                                                                onChange={(e) => {
                                                                    const newCats = [...selected.content.categories];
                                                                    newCats[idx].title = e.target.value;
                                                                    updateSelectedContent({ categories: newCats });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Slug</label>
                                                            <input
                                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                                value={cat.slug || ""}
                                                                onChange={(e) => {
                                                                    const newCats = [...selected.content.categories];
                                                                    newCats[idx].slug = e.target.value;
                                                                    updateSelectedContent({ categories: newCats });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Imagen URL</label>
                                                        <input
                                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                            value={cat.image || ""}
                                                            onChange={(e) => {
                                                                const newCats = [...selected.content.categories];
                                                                newCats[idx].image = e.target.value;
                                                                updateSelectedContent({ categories: newCats });
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newCats = [...selected.content.categories];
                                                            newCats.splice(idx, 1);
                                                            updateSelectedContent({ categories: newCats });
                                                        }}
                                                        className="text-red-500 text-[10px] font-bold uppercase hover:underline"
                                                    >
                                                        Eliminar Categoría
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCats = [...(selected.content?.categories || []), { title: "", slug: "", image: "" }];
                                                    updateSelectedContent({ categories: newCats });
                                                }}
                                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all"
                                            >
                                                + Añadir Categoría
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* BRAND_ESSENCE */}
                                {selected.type === "BRAND_ESSENCE" && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tagline</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.tagline ?? ""}
                                                onChange={(e) => updateSelectedContent({ tagline: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cuerpo (Body)</label>
                                            <textarea
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium min-h-[100px]"
                                                value={selected.content?.body ?? ""}
                                                onChange={(e) => updateSelectedContent({ body: e.target.value })}
                                            />
                                        </div>
                                        <UploaderImage
                                            label="Imagen Principal"
                                            url={selected.content?.imageUrl || null}
                                            onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cita (Quote)</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium italic"
                                                value={selected.content?.quote ?? ""}
                                                onChange={(e) => updateSelectedContent({ quote: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selected.type === "NEWSLETTER" && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Badge</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.badge ?? ""}
                                                onChange={(e) => updateSelectedContent({ badge: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subtítulo</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.subtitle ?? ""}
                                                onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* PROMO_CAMPAIGN */}
                                {selected.type === "PROMO_CAMPAIGN" && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar Campaña</h3>
                                            <CampaignPicker
                                                selectedId={selected.content?.selectedCampaignId || null}
                                                onSelect={(c) => {
                                                    if (c) {
                                                        updateSelectedContent({
                                                            selectedCampaignId: c.id,
                                                            title: c.nombre,
                                                            subtitle: c.descripcion || ""
                                                        });
                                                    } else {
                                                        updateSelectedContent({
                                                            selectedCampaignId: null,
                                                            title: "",
                                                            subtitle: ""
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                                <p className="text-[11px] text-amber-800 font-medium">
                                                    💡 <strong>Nota:</strong> Los datos como fechas y valor del descuento se obtienen automáticamente de la campaña seleccionada. La imagen de la campaña debe configurarse en la sección de "Descuentos".
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título de Publicidad (Override)</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.title ?? ""}
                                                    onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                    placeholder="Ej: Gran Oportunidad!"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción corta (Override)</label>
                                                <textarea
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium min-h-[80px]"
                                                    value={selected.content?.subtitle ?? ""}
                                                    onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                    placeholder="Ej: Aprovecha antes que se agoten"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
