"use client";

import { useCallback, useMemo, useState } from "react";
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

// Agregamos las nuevas secciones premium
type TipoSeccionHome =
    | "HERO"
    | "BEST_SELLERS"
    | "PROMO_CAMPAIGN"
    | "VIDEO_BANNER"
    | "CATEGORY_SPOTLIGHT"
    | "SHOP_THE_LOOK";

type HomeSection = {
    id: string;
    type: TipoSeccionHome;
    enabled: boolean;
    order: number;
    content: any;
};

// 👇 NUEVA INTERFAZ PARA RECIBIR LAS CATEGORÍAS 👇
interface CategoriaBasica {
    id: string;
    nombre: string;
    slug: string;
}

const LABEL: Record<TipoSeccionHome, string> = {
    HERO: "Hero principal",
    BEST_SELLERS: "Más vendidos / Novedades",
    PROMO_CAMPAIGN: "Campaña Publicitaria",
    VIDEO_BANNER: "Banner de Video",
    CATEGORY_SPOTLIGHT: "Foco de Categoría",
    SHOP_THE_LOOK: "Shop The Look",
};

function normalizeOrders(sections: HomeSection[]) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    return sorted.map((s, i) => ({ ...s, order: i }));
}

// ============================================================
// ProductPicker (Reutilizable para Best Sellers y Shop the Look)
// ============================================================
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

    useMemo(() => {
        setLoading(true);
        fetch("/api/admin/productos")
            .then(r => r.json())
            .then(d => setProducts(d))
            .catch(console.error)
            .finally(() => setLoading(false));
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

// ============================================================
// CampaignPicker
// ============================================================
function CampaignPicker({
    selectedId,
    onSelect,
}: {
    selectedId: string | null;
    onSelect: (campaign: any | null) => void;
}) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useMemo(() => {
        setLoading(true);
        fetch("/api/admin/descuentos/lista")
            .then(r => r.json())
            .then(d => setCampaigns(d))
            .catch(console.error)
            .finally(() => setLoading(false));
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

// ============================================================
// Componente principal
// ============================================================
// 👇 SE RECIBEN LAS CATEGORÍAS COMO PROP (default vacio para evitar errores) 👇
export default function HomeSeccionesClient({ initial, categorias = [] }: { initial: HomeSection[], categorias?: CategoriaBasica[] }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [sections, setSections] = useState<HomeSection[]>(normalizeOrders(initial as HomeSection[]));
    const [selectedId, setSelectedId] = useState<string>(sections[0]?.id ?? "");

    const selected = useMemo(
        () => sections.find((s) => s.id === selectedId) ?? sections[0],
        [sections, selectedId]
    );

    const updateSelected = useCallback((patch: Partial<HomeSection>) => {
        setSections((prev) =>
            prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s))
        );
    }, [selectedId]);

    const updateSelectedContent = useCallback((patch: any) => {
        setSections((prev) => {
            const sec = prev.find(s => s.id === selectedId);
            if (!sec) return prev;
            return prev.map((s) => s.id === selectedId ? { ...s, content: { ...(s.content ?? {}), ...patch } } : s);
        });
    }, [selectedId]);

    const move = useCallback((id: string, dir: "up" | "down") => {
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
    }, []);

    const toggle = useCallback((id: string) => {
        setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    }, []);

    const deleteSection = useCallback((id: string) => {
        setSections((prev) => normalizeOrders(prev.filter(s => s.id !== id)));
        setSelectedId((prev) => prev === id ? "" : prev);
    }, []);

    function addSection(type: TipoSeccionHome) {
        const id = `temp_${Date.now()}`;
        const base: HomeSection = {
            id,
            type,
            enabled: true,
            order: sections.length,
            content: {},
        };

        if (type === "HERO") base.content = { title: "Título", subtitle: "Subtítulo", ctaText: "Ver catálogo", ctaHref: "/tienda/catalogo", imageUrl: null, overlayOpacity: 0.25 };
        if (type === "BEST_SELLERS") base.content = {
            title: "NEW LAUNCH",
            subtitle: "BEST SELLER",
            mode: "automático",
            manualProductIds: []
        };
        if (type === "PROMO_CAMPAIGN") base.content = { selectedCampaignId: null, title: "", subtitle: "" };
        if (type === "VIDEO_BANNER") base.content = { title: "Nueva Colección", subtitle: "Editorial", ctaText: "Descubrir", ctaHref: "/tienda/catalogo", videoUrl: "", overlayOpacity: 0.3 };
        if (type === "CATEGORY_SPOTLIGHT") base.content = { title: "Vestidos de Noche", subtitle: "Elegancia Atemporal", categorySlug: "", ctaText: "Ver Colección", ctaHref: "/tienda/catalogo", imageUrl: null };
        if (type === "SHOP_THE_LOOK") base.content = { title: "Get The Look", subtitle: "Inspiración", categorySlug: "", imageUrl: null, manualProductIds: [] };

        setSections((prev) => normalizeOrders([...prev, base]));
        setSelectedId(id);
    }

    async function guardar() {
        setBusy(true);
        setMsg(null);

        try {
            const payload = {
                sections: normalizeOrders(sections).map((s) => ({
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
            setSections(normalizeOrders(data as HomeSection[]));
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
                            Ordena, activa/desactiva y edita las secciones del home público.
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
                            </div>

                            {/* Botones de añadir sección */}
                            <div className="mt-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Añadir sección premium</p>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(LABEL) as TipoSeccionHome[]).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => addSection(t)}
                                            className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center gap-1.5 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {LABEL[t]}
                                        </button>
                                    ))}
                                </div>
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
                                                <p className="font-bold text-slate-900 truncate">{LABEL[sec.type as TipoSeccionHome] ?? sec.type}</p>
                                                <p className="text-xs text-slate-500 truncate mt-1">
                                                    {sec.content?.title || sec.content?.subtitle || "Sin título"}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                {/* Toggle */}
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

                                                {/* Order controls */}
                                                <div className="flex items-center gap-1">
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

                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (confirm(`¿Eliminar sección "${LABEL[sec.type as TipoSeccionHome] ?? sec.type}"?`)) {
                                                                deleteSection(sec.id);
                                                            }
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-red-50 hover:border-red-100 border border-transparent"
                                                        title="Eliminar sección"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            {sections.length === 0 && (
                                <div className="p-10 text-center text-slate-400 text-sm">
                                    Sin secciones. Añade una arriba.
                                </div>
                            )}
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
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Editor • {selected.type}
                                    </p>
                                    <h2 className="font-bold text-slate-900">{LABEL[selected.type] ?? selected.type}</h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Edita el contenido que se renderizará en el home público.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm(`¿Eliminar sección "${LABEL[selected.type] ?? selected.type}"?`)) {
                                            deleteSection(selected.id);
                                        }
                                    }}
                                    className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
                                    title="Eliminar sección"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                            </div>

                            <div className="p-6 space-y-5">

                                {/* === HERO === */}
                                {selected.type === "HERO" && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                                                value={selected.content?.title ?? ""}
                                                onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subtítulo</label>
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

                                {/* === BEST_SELLERS === */}
                                {selected.type === "BEST_SELLERS" && (
                                    <div className="space-y-6">

                                        {/* Nombres de pestañas */}
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombres de Pestañas</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pestaña "Novedades"</label>
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                        placeholder="Novedades"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pestaña "Más Vendidos"</label>
                                                    <input
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                        placeholder="Más Vendidos"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modo de selección */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selección de Productos</h3>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modo</label>
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
                                                <p className="text-[10px] text-slate-400 ml-1 mt-1">
                                                    {(selected.content?.mode || "automático") === "automático"
                                                        ? "Modo automático: Se muestran los productos destacados más recientes."
                                                        : "Modo manual: Selecciona exactamente qué productos quieres mostrar."}
                                                </p>
                                            </div>

                                            {(selected.content?.mode || "automático") === "manual" && (
                                                <div className="space-y-4 pt-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Seleccionar Productos (máx. 8)</label>
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
                                                            <p className="w-full text-[10px] text-slate-400 font-bold uppercase">
                                                                {selected.content.manualProductIds.length} producto(s) seleccionado(s)
                                                            </p>
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

                                {/* === PROMO_CAMPAIGN === */}
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
                                                    💡 <strong>Nota:</strong> Los datos como fechas y valor del descuento se obtienen automáticamente de la campaña seleccionada. La imagen de la campaña debe configurarse en "Descuentos".
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

                                {/* === VIDEO BANNER === */}
                                {selected.type === "VIDEO_BANNER" && (
                                    <div className="space-y-5">
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
                                            <p className="text-[11px] text-amber-800 font-medium">
                                                💡 <strong>Importante:</strong> Pega el enlace directo a un archivo de video terminado en <strong>.mp4</strong>. Para mejor rendimiento, te sugerimos alojarlo en un servicio como Cloudinary o tu propio hosting.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">URL del Video (.mp4)</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 outline-none"
                                                value={selected.content?.videoUrl ?? ""}
                                                onChange={(e) => updateSelectedContent({ videoUrl: e.target.value })}
                                                placeholder="https://tudominio.com/video.mp4"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 outline-none"
                                                value={selected.content?.title ?? ""}
                                                onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subtítulo (Opcional)</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 outline-none"
                                                value={selected.content?.subtitle ?? ""}
                                                onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Botón: Texto</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaText ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Botón: Enlace</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaHref ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaHref: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Filtro Oscuro (0 a 1)</label>
                                            <input
                                                type="number" step="0.1" min={0} max={1}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.overlayOpacity ?? 0.3}
                                                onChange={(e) => updateSelectedContent({ overlayOpacity: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* === CATEGORY SPOTLIGHT === */}
                                {selected.type === "CATEGORY_SPOTLIGHT" && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título de la Colección</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.title ?? ""}
                                                onChange={(e) => updateSelectedContent({ title: e.target.value })}
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
                                        {/* 👇 AQUI USAMOS EL SELECT PARA LA CATEGORÍA 👇 */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Asignar a Categoría</label>
                                            <select
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 outline-none bg-white cursor-pointer"
                                                value={selected.content?.categorySlug ?? ""}
                                                onChange={(e) => updateSelectedContent({ categorySlug: e.target.value })}
                                            >
                                                <option value="">-- Catálogo General (Se muestra a todos) --</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.id} value={cat.slug}>
                                                        {cat.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Botón: Texto</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaText ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Botón: Enlace</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                    value={selected.content?.ctaHref ?? ""}
                                                    onChange={(e) => updateSelectedContent({ ctaHref: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <UploaderImage
                                            label="Imagen Principal (Editorial)"
                                            url={selected.content?.imageUrl || null}
                                            onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                        />
                                    </div>
                                )}

                                {/* === SHOP THE LOOK === */}
                                {selected.type === "SHOP_THE_LOOK" && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título del Look</label>
                                            <input
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                                                value={selected.content?.title ?? ""}
                                                onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                placeholder="Ej: Elegancia Urbana"
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
                                        
                                        {/* 👇 AQUI TAMBIEN USAMOS EL SELECT PARA LA CATEGORÍA 👇 */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Asignar a Categoría</label>
                                            <select
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 outline-none bg-white cursor-pointer"
                                                value={selected.content?.categorySlug ?? ""}
                                                onChange={(e) => updateSelectedContent({ categorySlug: e.target.value })}
                                            >
                                                <option value="">-- Catálogo General (Se muestra a todos) --</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.id} value={cat.slug}>
                                                        {cat.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <UploaderImage
                                            label="Fotografía del Outfit (Cuerpo completo)"
                                            url={selected.content?.imageUrl || null}
                                            onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                        />
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prendas que componen el Look</h3>
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
                                                    <p className="w-full text-[10px] text-slate-400 font-bold uppercase">
                                                        {selected.content.manualProductIds.length} prenda(s) en el outfit
                                                    </p>
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