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
    X,
    Type,
    Link as LinkIcon,
    Image as ImageIcon,
    ShoppingBag,
    Tag
} from "lucide-react";
import { UploaderImage } from "@/components/ui/uploader-image";
import { formatMoney } from "@/lib/precios";

// Tipos de sección
type TipoSeccionHome =
    | "HERO"
    | "CATEGORY_SPOTLIGHT"
    | "BEST_SELLERS"
    | "PROMO_CAMPAIGN"
    | "VIDEO_BANNER"
    | "SHOP_THE_LOOK";

type HomeSection = {
    id: string;
    type: TipoSeccionHome;
    enabled: boolean;
    order: number;
    content: any;
    descripcion: string | null;
};

interface CategoriaBasica {
    id: string;
    nombre: string;
    slug: string;
}

const LABEL: Record<TipoSeccionHome, string> = {
    HERO: "Hero principal",
    CATEGORY_SPOTLIGHT: "Foco de Categoría",
    BEST_SELLERS: "Más vendidos / Novedades",
    PROMO_CAMPAIGN: "Campaña Publicitaria",
    VIDEO_BANNER: "Banner de Video",
    SHOP_THE_LOOK: "Shop The Look",
};

const TYPE_ORDER: TipoSeccionHome[] = [
    "HERO",
    "CATEGORY_SPOTLIGHT",
    "BEST_SELLERS",
    "PROMO_CAMPAIGN",
    "VIDEO_BANNER",
    "SHOP_THE_LOOK"
];

function normalizeOrders(sections: HomeSection[]) {
    let newOrder = 0;
    const result: HomeSection[] = [];

    TYPE_ORDER.forEach(type => {
        const ofType = sections.filter(s => s.type === type).sort((a, b) => a.order - b.order);
        ofType.forEach(s => {
            result.push({ ...s, order: newOrder++ });
        });
    });

    return result;
}

// ============================================================
// ProductPicker (Reutilizable)
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
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                    placeholder="Buscar producto..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-slate-200 bg-white rounded-xl divide-y divide-slate-50 shadow-inner">
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
                                className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50/80" : ""}`}
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
                                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
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
            <div className="max-h-[250px] overflow-y-auto border border-slate-200 bg-white rounded-xl divide-y divide-slate-50 shadow-inner">
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
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50/80 border-l-4 border-slate-900" : ""}`}
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
                                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
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
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Productos en esta campaña:</p>
                    <div className="flex flex-wrap gap-2">
                        {selected.detalles?.slice(0, 5).map((d: any) => (
                            <div key={d.producto.id} className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-slate-600 font-medium">
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
export default function HomeSeccionesClient({ initial, categorias = [] }: { initial: HomeSection[], categorias?: CategoriaBasica[] }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    // Estado para responsividad en móvil (Controlador de vistas)
    const [isEditingMobile, setIsEditingMobile] = useState(false);

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
            return prev.map((s) => s.id === selectedId ? { ...s, content: { ...(s.content ?? {}), ...patch } } : s);
        });
    }, [selectedId]);

    // Función Move Corregida (Mueve elementos SÓLO dentro de su propio grupo)
    const move = useCallback((id: string, dir: "up" | "down") => {
        setSections((prev) => {
            const section = prev.find(s => s.id === id);
            if (!section) return prev;

            const ofType = prev.filter(s => s.type === section.type).sort((a, b) => a.order - b.order);
            const idx = ofType.findIndex(s => s.id === id);

            if (dir === "up" && idx > 0) {
                const copy = [...prev];
                const s1Index = copy.findIndex(s => s.id === ofType[idx].id);
                const s2Index = copy.findIndex(s => s.id === ofType[idx - 1].id);
                // Intercambiamos el orden
                const temp = copy[s1Index].order;
                copy[s1Index].order = copy[s2Index].order;
                copy[s2Index].order = temp;
                return normalizeOrders(copy);
            } else if (dir === "down" && idx < ofType.length - 1) {
                const copy = [...prev];
                const s1Index = copy.findIndex(s => s.id === ofType[idx].id);
                const s2Index = copy.findIndex(s => s.id === ofType[idx + 1].id);
                // Intercambiamos el orden
                const temp = copy[s1Index].order;
                copy[s1Index].order = copy[s2Index].order;
                copy[s2Index].order = temp;
                return normalizeOrders(copy);
            }
            return prev;
        });
    }, []);

    const toggle = useCallback((id: string) => {
        setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    }, []);

    const deleteSection = useCallback((id: string) => {
        setSections((prev) => normalizeOrders(prev.filter(s => s.id !== id)));
        setIsEditingMobile(false);
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
            descripcion: null,
        };

        if (type === "HERO") base.content = { title: "Título", subtitle: "Subtítulo", ctaText: "Ver catálogo", ctaHref: "/tienda/catalogo", imageUrl: null, overlayOpacity: 0.25 };
        if (type === "BEST_SELLERS") base.content = {
            title: "NEW LAUNCH",
            subtitle: "BEST SELLER",
            mode: "automático",
            manualProductIds: []
        };
        if (type === "PROMO_CAMPAIGN") base.content = { selectedCampaignId: null, title: "", subtitle: "" };
        if (type === "VIDEO_BANNER") base.content = { title: "Nueva Colección", subtitle: "Editorial", ctaText: "Descubrir", ctaHref: "/tienda/catalogo", videoUrl: "", overlayOpacity: 0.3, categorySlug: "" }; // NUEVO categorySlug
        if (type === "CATEGORY_SPOTLIGHT") base.content = { title: "Vestidos de Noche", subtitle: "Elegancia Atemporal", categorySlug: "", ctaText: "Ver Colección", ctaHref: "/tienda/catalogo", imageUrl: null };
        if (type === "SHOP_THE_LOOK") base.content = { title: "Get The Look", subtitle: "Inspiración", categorySlug: "", imageUrl: null, manualProductIds: [] }; // NUEVO categorySlug

        setSections((prev) => normalizeOrders([...prev, base]));
        setSelectedId(id);
        setIsEditingMobile(true);
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
                    descripcion: s.descripcion,
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
            setMsg({ type: "ok", text: "Estructura de tienda actualizada ✅" });
            router.refresh();
        } catch (e: any) {
            setMsg({ type: "err", text: e?.message ?? "Error inesperado" });
        } finally {
            setBusy(false);
        }
    }

    const renderSectionHeader = (icon: any, title: string) => (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/60">
            {icon}
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
        </div>
    );

    // ============================================================
    // COMPONENTE REUTILIZABLE: Selector de Categoría
    // ============================================================
    const CategorySelector = () => (
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {renderSectionHeader(<Tag className="w-4 h-4 text-slate-400" />, "Merchandising Dinámico")}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 ml-1">Regla de Visibilidad (Catálogo)</label>
                <p className="text-[10px] text-slate-400 ml-1 mb-2">Si dejas esto en "Home General", se mostrará en el inicio. Si eliges una categoría, esta sección "viajará" y solo se mostrará cuando el cliente navegue dentro de esa categoría específica en el catálogo.</p>
                <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold focus:border-slate-900 outline-none bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    value={selected.content?.categorySlug ?? ""}
                    onChange={(e) => updateSelectedContent({ categorySlug: e.target.value })}
                >
                    <option value="">Mostrar en el Home General</option>
                    {categorias.map(cat => (
                        <option key={cat.id} value={cat.slug}>
                            Mostrar solo en: {cat.nombre}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header Global */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div className="flex items-start gap-4">
                    <Link
                        href="/admin/tienda"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group mt-1 hidden md:block"
                        title="Volver"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-black" />
                    </Link>

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
                                <LayoutPanelTop className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Home Secciones</h1>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 max-w-2xl ml-1">
                            Ordena, activa/desactiva y edita las secciones del home público.
                        </p>
                    </div>
                </div>

                <button
                    onClick={guardar}
                    disabled={busy}
                    className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <Save className="w-4 h-4 text-emerald-400" />
                    {busy ? "Guardando..." : "Guardar cambios públicos"}
                </button>
            </div>

            {msg && (
                <div
                    className={`border rounded-2xl px-5 py-4 text-sm font-medium shadow-sm ${msg.type === "ok"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-800"
                        }`}
                >
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                
                {/* ==================== LEFT: LISTA ESTRUCTURAL ==================== */}
                <div className={`lg:col-span-4 lg:sticky lg:top-6 space-y-6 ${isEditingMobile ? 'hidden lg:block' : 'block'}`}>
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                            {/* Decorative blur */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                            <div className="flex items-center justify-between gap-3 relative z-10">
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight">Estructura Global</h3>
                                    <p className="text-slate-400 text-xs">Añade o reorganiza</p>
                                </div>
                            </div>

                            {/* Botones de añadir sección */}
                            <div className="mt-5 space-y-3 relative z-10">
                                <div className="flex flex-wrap gap-2">
                                    {TYPE_ORDER.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => addSection(t)}
                                            className="text-[10px] font-bold px-3 py-2 rounded-lg bg-white/10 hover:bg-white border border-white/10 hover:border-white hover:text-slate-900 flex items-center gap-1.5 transition-all"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {LABEL[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* LISTA AGRUPADA POR TIPOS */}
                        <div className="bg-slate-50 max-h-[60vh] overflow-y-auto">
                            {TYPE_ORDER.map(type => {
                                const items = sections.filter(s => s.type === type).sort((a, b) => a.order - b.order);
                                if (items.length === 0) return null;

                                return (
                                    <div key={type} className="mb-2 last:mb-0">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-100/80 px-5 py-2.5 sticky top-0 z-10 border-y border-slate-200/50 backdrop-blur-md">
                                            {LABEL[type as TipoSeccionHome]}
                                        </h4>
                                        <div className="divide-y divide-slate-100 bg-white">
                                            {items.map((sec, index) => {
                                                const active = sec.id === selectedId;
                                                const isFirst = index === 0;
                                                const isLast = index === items.length - 1;

                                                return (
                                                    <div
                                                        key={sec.id}
                                                        onClick={() => {
                                                            setSelectedId(sec.id);
                                                            setIsEditingMobile(true);
                                                        }}
                                                        className={`w-full cursor-pointer text-left p-4 flex items-start justify-between gap-3 transition-all ${active ? "bg-slate-50 border-l-4 border-l-slate-900" : "hover:bg-slate-50/50 border-l-4 border-l-transparent"}`}
                                                    >
                                                        <div className="min-w-0 pt-1">
                                                            <p className="font-bold text-sm text-slate-900 truncate leading-tight">
                                                                {sec.content?.title || "Sin título configurado"}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate mt-0.5 flex flex-col gap-1">
                                                                <span>{sec.content?.subtitle || "Sin subtítulo"}</span>
                                                                {/* Indicador visual de que pertenece a una categoría */}
                                                                {sec.content?.categorySlug && (
                                                                     <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded w-fit">
                                                                         En Catálogo
                                                                     </span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault(); e.stopPropagation(); toggle(sec.id);
                                                                }}
                                                                className="transition-transform hover:scale-105"
                                                                title={sec.enabled ? "Desactivar" : "Activar"}
                                                            >
                                                                {sec.enabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                                                            </button>

                                                            {/* Flechas Inteligentes */}
                                                            {items.length > 1 && (
                                                                <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                                                                    <button
                                                                        type="button"
                                                                        disabled={isFirst}
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(sec.id, "up"); }}
                                                                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-l-lg border-r border-slate-200 disabled:opacity-30 disabled:hover:bg-white"
                                                                    >
                                                                        <ChevronUp className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={isLast}
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(sec.id, "down"); }}
                                                                        className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-r-lg disabled:opacity-30 disabled:hover:bg-white"
                                                                    >
                                                                        <ChevronDown className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {sections.length === 0 && (
                                <div className="p-12 text-center text-slate-400 text-sm font-medium bg-white">
                                    El layout está vacío. <br /> Añade una sección desde arriba.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================== RIGHT: EDITOR VISUAL ==================== */}
                <div className={`lg:col-span-8 space-y-6 ${isEditingMobile ? 'block' : 'hidden lg:block'}`}>
                    {!selected ? (
                        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                            <LayoutPanelTop className="w-12 h-12 mb-4 text-slate-200" />
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Selecciona una sección</h3>
                            <p className="text-sm max-w-sm">Haz clic en una de las secciones del panel izquierdo para comenzar a editar su contenido.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden flex flex-col">
                            
                            {/* Editor Header */}
                            <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setIsEditingMobile(false)}
                                        className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                Modo Edición
                                            </p>
                                        </div>
                                        <h2 className="text-lg md:text-xl font-bold text-slate-900">{LABEL[selected.type] ?? selected.type}</h2>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm(`¿Eliminar sección "${LABEL[selected.type] ?? selected.type}"?`)) {
                                            deleteSection(selected.id);
                                        }
                                    }}
                                    className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2 text-xs font-bold"
                                    title="Eliminar sección permanentemente"
                                >
                                    <Trash2 className="w-4 h-4" /> <span className="hidden md:inline">Eliminar</span>
                                </button>
                            </div>

                            {/* Editor Content Area */}
                            <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/30">

                                {/* SIEMPRE RENDERIZAR CATEGORY SELECTOR PARA ESTOS TRES TIPOS */}
                                {["CATEGORY_SPOTLIGHT", "VIDEO_BANNER", "SHOP_THE_LOOK"].includes(selected.type) && (
                                    <CategorySelector />
                                )}

                                {/* === HERO === */}
                                {selected.type === "HERO" && (
                                    <>
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Textos Principales")}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Título Principal</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                        placeholder="Ej: Nueva Colección"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Subtítulo (Opcional)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium bg-slate-50 focus:bg-white"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<LinkIcon className="w-4 h-4 text-slate-400" />, "Botón de Acción (CTA)")}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Texto del Botón</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.ctaText ?? ""}
                                                        onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                        placeholder="Ej: Ver Colección"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Enlace del Botón (URL)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.ctaHref ?? ""}
                                                        onChange={(e) => updateSelectedContent({ ctaHref: e.target.value })}
                                                        placeholder="Ej: /tienda/catalogo"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<ImageIcon className="w-4 h-4 text-slate-400" />, "Estilo Visual")}
                                            <UploaderImage
                                                modulo="home-secciones"
                                                label="Imagen de Fondo (Desktop & Mobile)"
                                                url={selected.content?.imageUrl || null}
                                                onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                            />
                                            <div className="space-y-2 pt-2 border-t border-slate-100 mt-4">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Filtro Oscurecedor (0 al 1)</label>
                                                <p className="text-[10px] text-slate-400 ml-1 mb-2">Ayuda a que el texto blanco se lea mejor sobre fotos claras.</p>
                                                <input
                                                    type="number" step="0.05" min={0} max={1}
                                                    className="w-full max-w-[200px] px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900"
                                                    value={selected.content?.overlayOpacity ?? 0.25}
                                                    onChange={(e) => updateSelectedContent({ overlayOpacity: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* === BEST_SELLERS === */}
                                {selected.type === "BEST_SELLERS" && (
                                    <>
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Textos de Pestañas")}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Pestaña Principal (Recientes)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                        placeholder="Ej: Novedades"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Pestaña Secundaria</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                        placeholder="Ej: Más Vendidos"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<ShoppingBag className="w-4 h-4 text-slate-400" />, "Gestión de Productos")}
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Modo de Visualización</label>
                                                <div className="flex gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-fit">
                                                    {["automático", "manual"].map((m) => (
                                                        <button
                                                            key={m}
                                                            type="button"
                                                            onClick={() => updateSelectedContent({ mode: m })}
                                                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                                                (selected.content?.mode || "automático") === m
                                                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                                                                    : "text-slate-500 hover:text-slate-900"
                                                            }`}
                                                        >
                                                            {m}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[11px] text-slate-500 ml-1 bg-slate-50 p-3 rounded-lg border border-slate-100 inline-block mt-2">
                                                    {(selected.content?.mode || "automático") === "automático"
                                                        ? "🪄 El sistema buscará automáticamente los productos más recientes y más vendidos de tu tienda."
                                                        : "✍️ Modo Curador: Tú decides exactamente qué productos mostrar en el grid."}
                                                </p>
                                            </div>

                                            {(selected.content?.mode || "automático") === "manual" && (
                                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Seleccionar Productos (Máximo 8 recomendados)</label>
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
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                            <p className="w-full text-[10px] text-slate-500 font-bold uppercase mb-3">
                                                                Productos seleccionados ({selected.content.manualProductIds.length})
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selected.content.manualProductIds.map((id: string) => (
                                                                    <div key={id} className="bg-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200 shadow-sm">
                                                                        <span className="text-slate-400">ID:</span> {id.slice(-6)}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const next = selected.content.manualProductIds.filter((x: string) => x !== id);
                                                                                updateSelectedContent({ manualProductIds: next });
                                                                            }}
                                                                            className="hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* === PROMO_CAMPAIGN === */}
                                {selected.type === "PROMO_CAMPAIGN" && (
                                    <>
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<ShoppingBag className="w-4 h-4 text-slate-400" />, "Vincular Descuento Activo")}
                                            
                                            <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl">
                                                <p className="text-xs text-amber-800 font-medium">
                                                    💡 La fecha, porcentaje de descuento y portada se tomarán automáticamente de la campaña que elijas.
                                                </p>
                                            </div>

                                            <div className="pt-2">
                                                <label className="text-xs font-bold text-slate-600 ml-1 block mb-3">Selecciona la campaña de la base de datos</label>
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
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Textos Promocionales (Opcional)")}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Título Visual (Reemplaza al original)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                        placeholder="Ej: Gran Oportunidad!"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Mensaje de Urgencia</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                        placeholder="Ej: Solo por este fin de semana"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* === VIDEO BANNER === */}
                                {selected.type === "VIDEO_BANNER" && (
                                    <>
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<ImageIcon className="w-4 h-4 text-slate-400" />, "Contenido Multimedia")}
                                            
                                            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner mb-2">
                                                <p className="text-xs font-medium text-slate-300">
                                                    ⚡ Ingresa la URL directa de un archivo de video <strong className="text-white">.mp4</strong>.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600 ml-1">URL del Video</label>
                                                <input
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all font-mono"
                                                    value={selected.content?.videoUrl ?? ""}
                                                    onChange={(e) => updateSelectedContent({ videoUrl: e.target.value })}
                                                    placeholder="https://.../mi-video-campana.mp4"
                                                />
                                            </div>

                                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                                <label className="text-xs font-bold text-slate-600 ml-1">Opacidad de Fondo Oscuro (0 al 1)</label>
                                                <input
                                                    type="number" step="0.1" min={0} max={1}
                                                    className="w-full max-w-[200px] px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900"
                                                    value={selected.content?.overlayOpacity ?? 0.3}
                                                    onChange={(e) => updateSelectedContent({ overlayOpacity: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Textos & CTA")}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Título</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Subtítulo Corto</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Texto del Botón</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.ctaText ?? ""}
                                                        onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Enlace del Botón</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.ctaHref ?? ""}
                                                        onChange={(e) => updateSelectedContent({ ctaHref: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* === CATEGORY SPOTLIGHT === */}
                                {selected.type === "CATEGORY_SPOTLIGHT" && (
                                    <>
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Enfoque de Colección")}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Título (Ej: Vestidos de Noche)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Etiqueta Superior (Subtítulo)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                                {renderSectionHeader(<ImageIcon className="w-4 h-4 text-slate-400" />, "Fotografía Editorial")}
                                                <UploaderImage
                                                    modulo="home-secciones"
                                                    label="Subir Imagen Vertical"
                                                    url={selected.content?.imageUrl || null}
                                                    onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                                />
                                            </div>
                                            
                                            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                                {renderSectionHeader(<LinkIcon className="w-4 h-4 text-slate-400" />, "Botón (CTA)")}
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-600 ml-1">Texto del Botón</label>
                                                        <input
                                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                            value={selected.content?.ctaText ?? ""}
                                                            onChange={(e) => updateSelectedContent({ ctaText: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* === SHOP THE LOOK === */}
                                {selected.type === "SHOP_THE_LOOK" && (
                                    <>
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Identidad del Look")}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Título del Look</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.title ?? ""}
                                                        onChange={(e) => updateSelectedContent({ title: e.target.value })}
                                                        placeholder="Ej: Elegancia Urbana"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-600 ml-1">Etiqueta Superior (Subtítulo)</label>
                                                    <input
                                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 transition-all"
                                                        value={selected.content?.subtitle ?? ""}
                                                        onChange={(e) => updateSelectedContent({ subtitle: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-full">
                                                    {renderSectionHeader(<ImageIcon className="w-4 h-4 text-slate-400" />, "Referencia Visual")}
                                                    <UploaderImage
                                                        modulo="home-secciones"
                                                        label="Fotografía del Outfit"
                                                        url={selected.content?.imageUrl || null}
                                                        onUpload={(url) => updateSelectedContent({ imageUrl: url })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                                {renderSectionHeader(<ShoppingBag className="w-4 h-4 text-slate-400" />, "Prendas que componen el Look")}
                                                <p className="text-[11px] text-slate-500 mb-2">Selecciona las piezas individuales que la modelo lleva puestas en la fotografía.</p>
                                                
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
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">
                                                            {selected.content.manualProductIds.length} prenda(s) en este outfit
                                                        </p>
                                                        <div className="flex flex-col gap-2">
                                                            {selected.content.manualProductIds.map((id: string) => (
                                                                <div key={id} className="bg-slate-50 text-xs font-medium px-3 py-2 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm">
                                                                    <span className="text-slate-500">Prod. ID: <span className="text-slate-900 font-mono">{id.slice(-6)}</span></span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = selected.content.manualProductIds.filter((x: string) => x !== id);
                                                                            updateSelectedContent({ manualProductIds: next });
                                                                        }}
                                                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ========================================================= */}
                                {/* CAMPO TRANSVERSAL: DESCRIPCIÓN EDITORIAL                  */}
                                {/* ========================================================= */}
                                {selected.type !== "BEST_SELLERS" && selected.type !== "PROMO_CAMPAIGN" && selected.type !== "HERO" && (
                                    <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        {renderSectionHeader(<Type className="w-4 h-4 text-slate-400" />, "Storytelling y Contexto")}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-600 ml-1">
                                                Descripción Editorial
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium min-h-[120px] bg-slate-50 focus:bg-white leading-relaxed"
                                                placeholder="Escribe el storytelling para esta sección (Ej: 'Una paleta inspirada en los atardeceres de Ica...') "
                                                value={selected.descripcion ?? ""}
                                                onChange={(e) => updateSelected({ descripcion: e.target.value })}
                                            />
                                            <p className="text-[10px] text-slate-400 ml-1 italic">
                                                Este texto se mostrará en el frontend con una tipografía ligera y elegante, debajo de los títulos principales.
                                            </p>
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