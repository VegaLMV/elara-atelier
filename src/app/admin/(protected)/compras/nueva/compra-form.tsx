"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    Trash2,
    Package,
    Shirt,
    Calendar,
    FileText,
    DollarSign,
    Truck,
    Box,
    Check,
    ShoppingCart // <--- FALTABA ESTE IMPORT
} from "lucide-react";
import { toast } from "sonner"; // Aseguramos usar sonner para notificaciones

// --- TIPOS ---
type Proveedor = {
    id: string;
    nombre: string;
    ruc?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    razonSocial?: string | null;
};

type ProductoRaw = {
    id: string;
    nombre: string;
    precio: number;
    estado: string;
    variantes: any[];
    proveedorSugerido?: any;
    imagenes?: { url: string; esPortada: boolean }[];
    imagenesColor?: { url: string; colorId: string }[];
};

type Empaque = {
    id: string;
    nombre: string;
    stock: number;
    costoUnitario: any;
};

type EditData = {
    id: string;
    proveedorId: string;
    fechaCompra: string;
    notas: string;
    costoEnvio: string;
    otrosCostos: string;
    items: ItemCarrito[];
};

type Props = {
    proveedores: Proveedor[];
    productos: ProductoRaw[];
    empaques: Empaque[];
    prefill?: {
        productoId?: string;
        varianteId?: string;
        empaqueId?: string;
    };
    editData?: EditData;
};

type ItemCarrito = {
    id: string;
    tipo: "PRODUCTO" | "EMPAQUE";
    titulo: string;
    stockActual: number;
    cantidad: number;
    costoUnitario: string;
    precioVenta?: string;
    imagenUrl?: string | null;
    hexColor?: string | null;
    productoEstado?: string;
};

// Helpers
function soles(v: any) {
    const n = Number(v?.toString?.() ?? v);
    if (Number.isNaN(n)) return `S/ ${String(v)}`;
    return `S/ ${n.toFixed(2)}`;
}

function hoyLocalYYYYMMDD() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getColorStyle(hex: string | null) {
    if (!hex) return { backgroundColor: '#fff' };
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };

    const percentage = 100 / codes.length;
    const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
    return { background: `linear-gradient(135deg, ${stops})` };
}

export default function CompraForm({ proveedores, productos: productosRaw, empaques, prefill, editData }: Props) {
    const router = useRouter();

    // Estados Formulario
    const [proveedorId, setProveedorId] = useState<string>(editData?.proveedorId || "");
    const [fechaCompra, setFechaCompra] = useState<string>(editData?.fechaCompra || hoyLocalYYYYMMDD());
    const [notas, setNotas] = useState<string>(editData?.notas || "");
    const [costoEnvio, setCostoEnvio] = useState<string>(editData?.costoEnvio || "");
    const [otrosCostos, setOtrosCostos] = useState<string>(editData?.otrosCostos || "");

    // UI
    const [qProv, setQProv] = useState(proveedores.find(p => p.id === (editData?.proveedorId || ""))?.nombre || "");
    const [provMenuOpen, setProvMenuOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Carrito
    const [items, setItems] = useState<ItemCarrito[]>(editData?.items || []);
    const [modoItem, setModoItem] = useState<"PRODUCTO" | "EMPAQUE">("PRODUCTO");

    // Buscadores
    const [qVar, setQVar] = useState<string>("");
    const [varSel, setVarSel] = useState<string>("");
    const [prodSel, setProdSel] = useState("");
    const [qProd, setQProd] = useState("");
    const [qEmp, setQEmp] = useState("");

    // Lote
    const [cantidadTotalProd, setCantidadTotalProd] = useState("0");
    const [costoDefaultProd, setCostoDefaultProd] = useState("");
    const [dist, setDist] = useState<Record<string, { cantidad: number; costoUnitario: string }>>({});

    // Status
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    // --- MEMOS & LOGICA ---
    const todasLasVariantes = useMemo(() => {
        return productosRaw.flatMap(p =>
            p.variantes.map((v: any) => {
                const imgColor = p.imagenesColor?.find((ic: any) => ic.colorId === v.colorId);
                const imgGeneral = p.imagenes?.[0];
                return {
                    id: v.id,
                    productoId: p.id,
                    productoNombre: p.nombre,
                    productoPrecio: String(p.precio ?? 0),
                    talla: v.talla?.nombre ?? "U",
                    tallaOrden: v.talla?.orden ?? 0,
                    color: v.color?.nombre ?? "U",
                    colorHex: v.color?.hex ?? null,
                    sku: v.sku ?? "",
                    stockActual: v.stockActual ?? 0,
                    activa: v.activa,
                    productoEstado: p.estado,
                    imagenUrl: imgColor?.url || imgGeneral?.url || null
                };
            })
        );
    }, [productosRaw]);

    const proveedoresFiltrados = useMemo(() => {
        const q = qProv.toLowerCase().trim();
        if (!q) return proveedores.slice(0, 10);
        return proveedores.filter(p =>
            p.nombre.toLowerCase().includes(q) ||
            (p.ruc && p.ruc.includes(q)) ||
            (p.telefono && p.telefono.includes(q))
        ).slice(0, 10);
    }, [proveedores, qProv]);

    const proveedorElegido = useMemo(() =>
        proveedores.find(p => p.id === proveedorId),
        [proveedorId, proveedores]
    );

    const variantesFiltradas = useMemo(() => {
        const q = qVar.trim().toLowerCase();
        if (!q) return [];
        return todasLasVariantes
            .filter((v) => {
                const txt = `${v.productoNombre} ${v.talla} ${v.color} ${v.sku}`.toLowerCase();
                return txt.includes(q);
            })
            .slice(0, 20);
    }, [qVar, todasLasVariantes]);

    const productosFiltrados = useMemo(() => {
        const q = qProd.trim().toLowerCase();
        if (!q) return productosRaw.slice(0, 20);
        return productosRaw.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 20);
    }, [qProd, productosRaw]);

    const empaquesFiltrados = useMemo(() => {
        if (!qEmp) return empaques;
        return empaques.filter(e => e.nombre.toLowerCase().includes(qEmp.toLowerCase()));
    }, [empaques, qEmp]);

    const varianteElegida = useMemo(() => todasLasVariantes.find((v) => v.id === varSel) ?? null, [varSel, todasLasVariantes]);
    const variantesDelProducto = useMemo(() => {
        if (!prodSel) return [];
        return todasLasVariantes
            .filter((v) => v.productoId === prodSel)
            .sort((a, b) => a.tallaOrden - b.tallaOrden || a.color.localeCompare(b.color));
    }, [prodSel, todasLasVariantes]);

    // --- PREFILL ---
    useEffect(() => {
        if (prefill?.empaqueId) {
            const emp = empaques.find(e => e.id === prefill.empaqueId);
            if (emp) {
                setModoItem("EMPAQUE");
                agregarItemDirecto({
                    id: emp.id, tipo: "EMPAQUE", titulo: `📦 ${emp.nombre}`,
                    stockActual: emp.stock, cantidad: 50, costoUnitario: String(emp.costoUnitario || "")
                });
            }
        } else if (prefill?.productoId) {
            setModoItem("PRODUCTO");
            const prod = productosRaw.find(p => p.id === prefill.productoId);
            if (!prod) return;

            if (prefill.varianteId) {
                const v = todasLasVariantes.find(tv => tv.id === prefill.varianteId);
                if (v) {
                    agregarItemDirecto({
                        id: v.id, tipo: "PRODUCTO", titulo: `${v.productoNombre} · ${v.talla} · ${v.color}`,
                        stockActual: v.stockActual, cantidad: 10, costoUnitario: "", precioVenta: v.productoPrecio,
                        imagenUrl: v.imagenUrl, hexColor: v.colorHex, productoEstado: v.productoEstado
                    });
                }
            } else {
                setProdSel(prod.id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefill, productosRaw, empaques]);

    // --- LÓGICA LOTE ---
    const totalObjetivo = useMemo(() => {
        const n = Number(cantidadTotalProd || 0);
        return Number.isNaN(n) ? 0 : n;
    }, [cantidadTotalProd]);

    const sumaAsignada = useMemo(() => {
        return Object.values(dist).reduce((acc, x) => acc + Number(x?.cantidad || 0), 0);
    }, [dist]);

    useEffect(() => {
        setDist((prev) => {
            const total = Math.max(0, Number.isFinite(totalObjetivo) ? totalObjetivo : 0);
            const suma = Object.values(prev).reduce((acc, x) => acc + Number(x?.cantidad || 0), 0);
            if (suma <= total) return prev;
            let exceso = suma - total;
            const ids = variantesDelProducto.map((v) => v.id).sort((a, b) => Number(prev[b]?.cantidad || 0) - Number(prev[a]?.cantidad || 0));
            const copy: typeof prev = { ...prev };
            for (const id of ids) {
                const actual = Number(copy[id]?.cantidad || 0);
                if (actual <= 0) continue;
                const quitar = Math.min(actual, exceso);
                copy[id] = { ...copy[id], cantidad: actual - quitar };
                exceso -= quitar;
                if (exceso <= 0) break;
            }
            return copy;
        });
    }, [totalObjetivo, variantesDelProducto]);

    useEffect(() => {
        if (!prodSel) { setDist({}); setCantidadTotalProd("0"); setCostoDefaultProd(""); return; }
        const init: Record<string, { cantidad: number; costoUnitario: string }> = {};
        for (const v of variantesDelProducto) init[v.id] = { cantidad: 0, costoUnitario: "" };
        setDist(init);
        setCantidadTotalProd("0");
        setCostoDefaultProd("");
    }, [prodSel, variantesDelProducto]);

    // --- ACCIONES ---
    function agregarItemDirecto(item: ItemCarrito) {
        setError(null);
        setItems(prev => {
            const existe = prev.find(x => x.id === item.id && x.tipo === item.tipo);
            if (existe) return prev.map(x => x.id === item.id && x.tipo === item.tipo ? { ...x, cantidad: x.cantidad + item.cantidad } : x);
            return [...prev, item];
        });
    }

    function agregarVarianteIndividual() {
        if (!varianteElegida) { setError("Selecciona una variante."); return; }
        agregarItemDirecto({
            id: varianteElegida.id,
            tipo: "PRODUCTO",
            titulo: `${varianteElegida.productoNombre} · ${varianteElegida.talla} · ${varianteElegida.color}`,
            stockActual: varianteElegida.stockActual,
            cantidad: 1,
            costoUnitario: "",
            precioVenta: varianteElegida.productoPrecio,
            imagenUrl: varianteElegida.imagenUrl,
            hexColor: varianteElegida.colorHex,
            productoEstado: varianteElegida.productoEstado
        });
        setQVar(""); setVarSel("");
    }

    function agregarEmpaque(empId: string) {
        const e = empaques.find(x => x.id === empId);
        if (!e) return;
        agregarItemDirecto({
            id: e.id, tipo: "EMPAQUE", titulo: `📦 ${e.nombre}`,
            stockActual: e.stock, cantidad: 10, costoUnitario: String(e.costoUnitario || "")
        });
        setQEmp("");
    }

    function agregarProductoDistribuido() {
        setError(null);
        if (!prodSel) return setError("Selecciona un producto.");
        if (sumaAsignada !== totalObjetivo || totalObjetivo <= 0) return setError("La cantidad distribuida no coincide con el total.");

        for (const v of variantesDelProducto) {
            const d = dist[v.id];
            if ((d?.cantidad || 0) > 0 && (!d.costoUnitario || isNaN(Number(d.costoUnitario)))) return setError(`Falta costo para ${v.talla} ${v.color}`);
        }

        setItems((prev) => {
            const copy = [...prev];
            for (const v of variantesDelProducto) {
                const d = dist[v.id];
                const cant = Number(d?.cantidad || 0);
                if (cant <= 0) continue;

                const titulo = `${v.productoNombre} · ${v.talla} · ${v.color}`;
                const idx = copy.findIndex((x) => x.id === v.id && x.tipo === "PRODUCTO");

                if (idx >= 0) {
                    const old = copy[idx];
                    copy[idx] = { ...old, cantidad: old.cantidad + cant, costoUnitario: old.costoUnitario || d.costoUnitario };
                } else {
                    copy.push({
                        id: v.id, tipo: "PRODUCTO", titulo, stockActual: v.stockActual,
                        cantidad: cant, costoUnitario: d.costoUnitario, precioVenta: v.productoPrecio,
                        imagenUrl: v.imagenUrl, hexColor: v.colorHex,
                        productoEstado: v.productoEstado
                    });
                }
            }
            return copy;
        });
        setProdSel(""); setQProd(""); setCantidadTotalProd("0"); setCostoDefaultProd(""); setDist({});
    }

    function setCantidadDistribuida(varianteId: string, value: string) {
        const raw = Number.parseInt(value || "0", 10);
        const cantidadDeseada = Math.max(0, raw);
        setDist((prev) => {
            const otros = Object.entries(prev).reduce((acc, [id, v]) => id === varianteId ? acc : acc + (Number(v?.cantidad || 0) || 0), 0);
            const maxParaEsta = Math.max(0, totalObjetivo - otros);
            return { ...prev, [varianteId]: { ...prev[varianteId], cantidad: Math.min(cantidadDeseada, maxParaEsta) } };
        });
    }

    function aplicarCostoATodas() {
        if (!costoDefaultProd) return;
        setDist((prev) => {
            const copy: typeof prev = { ...prev };
            for (const k of Object.keys(copy)) copy[k] = { ...copy[k], costoUnitario: costoDefaultProd };
            return copy;
        });
    }

    function quitarItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (items.length === 0) { setError("El carrito está vacío."); return; }

        for (const it of items) {
            if (it.cantidad <= 0) { setError("Cantidades deben ser mayores a 0"); return; }
            if (!it.costoUnitario) { setError("Falta costo unitario en algún ítem"); return; }
        }

        setGuardando(true);
        const body = {
            estado: "RECIBIDO",
            proveedorId: proveedorId || null,
            fechaCompra: fechaCompra ? new Date(`${fechaCompra}T12:00:00`).toISOString() : undefined,
            notas: notas || null,
            costoEnvio: costoEnvio || null,
            otrosCostos: otrosCostos || null,
            items: items
        };

        try {
            const url = editData ? `/api/admin/compras/${editData.id}` : "/api/admin/compras";
            const method = editData ? "PUT" : "POST";

            const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

            if (!r.ok) {
                const d = await r.json().catch(() => ({}));
                setError(d?.error ?? `Error al ${editData ? 'actualizar' : 'registrar'} la compra`);
                return;
            }

            toast.success(editData ? "Compra actualizada correctamente" : "Compra registrada correctamente");
            router.push(editData ? `/admin/compras/${editData.id}` : "/admin/compras");
            router.refresh();
        } catch (e) {
            setError("Error de conexión");
        } finally {
            setGuardando(false);
        }
    }

    const total = useMemo(() => {
        const sub = items.reduce((acc, it) => acc + (it.cantidad * Number(it.costoUnitario || 0)), 0);
        return sub + Number(costoEnvio || 0) + Number(otrosCostos || 0);
    }, [items, costoEnvio, otrosCostos]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32 relative">

            {/* --- MODAL ZOOM --- */}
            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                        <span className="text-2xl">✕</span>
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
                </div>
            )}

            {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" /> Datos de Compra
                    </h2>

                    <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Proveedor</label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                            <input
                                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400 font-medium"
                                placeholder="Buscar proveedor..."
                                value={qProv}
                                onChange={e => { setQProv(e.target.value); setProvMenuOpen(true); }}
                                onFocus={() => setProvMenuOpen(true)}
                                onBlur={() => setTimeout(() => setProvMenuOpen(false), 200)}
                            />
                        </div>
                        {provMenuOpen && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl mt-2 max-h-64 overflow-y-auto z-50 p-1">
                                {proveedoresFiltrados.length === 0 ? (
                                    <div className="p-3 text-xs text-gray-400 text-center">Sin resultados</div>
                                ) : (
                                    proveedoresFiltrados.map(p => (
                                        <div key={p.id}
                                            className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors group/item"
                                            onMouseDown={() => { setProveedorId(p.id); setQProv(p.nombre); setProvMenuOpen(false); }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 group-hover/item:text-slate-900">{p.nombre}</span>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-500 font-medium">
                                                    {p.ruc && <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">RUC: {p.ruc}</span>}
                                                    {p.telefono && <span className="flex items-center gap-1">Tel: {p.telefono}</span>}
                                                    {p.direccion && <span className="flex items-center gap-1 opacity-70 truncate max-w-[200px]">{p.direccion}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resumen del Proveedor Seleccionado */}
                    {proveedorElegido && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Detalles del Proveedor</p>
                                <div className="space-y-1">
                                    {proveedorElegido.ruc && (
                                        <p className="text-xs text-gray-600 flex justify-between">
                                            <span className="font-bold text-gray-400">RUC:</span>
                                            <span className="font-mono">{proveedorElegido.ruc}</span>
                                        </p>
                                    )}
                                    {proveedorElegido.razonSocial && (
                                        <p className="text-xs text-gray-600 flex justify-between">
                                            <span className="font-bold text-gray-400">R. Social:</span>
                                            <span>{proveedorElegido.razonSocial}</span>
                                        </p>
                                    )}
                                    {proveedorElegido.telefono && (
                                        <p className="text-xs text-gray-600 flex justify-between">
                                            <span className="font-bold text-gray-400">Teléfono:</span>
                                            <span>{proveedorElegido.telefono}</span>
                                        </p>
                                    )}
                                    {proveedorElegido.direccion && (
                                        <p className="text-xs text-gray-600 leading-relaxed pt-1 border-t border-blue-100/50">
                                            <span className="font-bold text-gray-400 block mb-0.5">Dirección:</span>
                                            {proveedorElegido.direccion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Fecha Emisión</label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                            <input type="date" className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all font-medium text-gray-600" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Notas / Referencia</label>
                        <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all h-24 resize-none placeholder:text-gray-300" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Factura F001-234..." />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-600" /> Costos Adicionales
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Envío</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">S/</span>
                                <input className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 outline-none" placeholder="0.00" value={costoEnvio} onChange={e => setCostoEnvio(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Otros</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">S/</span>
                                <input className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 outline-none" placeholder="0.00" value={otrosCostos} onChange={e => setOtrosCostos(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUMNA DERECHA: SELECCIÓN */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                            <Plus className="w-4 h-4 text-emerald-500" /> Agregar Ítems
                        </h2>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setModoItem("PRODUCTO")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${modoItem === 'PRODUCTO' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-slate-900'}`}>
                                <Shirt className="w-3.5 h-3.5" /> Ropa
                            </button>
                            <button onClick={() => setModoItem("EMPAQUE")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${modoItem === 'EMPAQUE' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-slate-900'}`}>
                                <Box className="w-3.5 h-3.5" /> Empaques
                            </button>
                        </div>
                    </div>

                    {/* MODO ROPA */}
                    {modoItem === "PRODUCTO" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            {/* Selector Tipo Carga */}
                            <div className="flex gap-6 text-sm pb-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!prodSel ? 'border-slate-900 bg-slate-900' : 'border-gray-300'}`}>
                                        {!prodSel && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <input type="radio" checked={!prodSel} onChange={() => setProdSel("")} className="hidden" />
                                    <span className={`font-medium ${!prodSel ? 'text-slate-900' : 'text-gray-500 group-hover:text-gray-700'}`}>Unitario</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${prodSel ? 'border-slate-900 bg-slate-900' : 'border-gray-300'}`}>
                                        {prodSel && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <input type="radio" checked={!!prodSel} onChange={() => { }} className="hidden" disabled />
                                    <span className={`font-medium ${prodSel ? 'text-slate-900' : 'text-gray-500'}`}>Lote Completo</span>
                                </label>
                            </div>

                            {/* BÚSQUEDA UNITARIA */}
                            {!prodSel && (
                                <div className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-slate-900 transition-colors" />
                                        <input
                                            className="w-full border border-gray-200 rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
                                            placeholder="Buscar por nombre, SKU, color..."
                                            value={qVar} onChange={e => setQVar(e.target.value)}
                                        />
                                        {qVar && !varSel && (
                                            <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl mt-2 max-h-80 overflow-y-auto z-20 p-1">
                                                {variantesFiltradas.length === 0 ? <div className="p-4 text-xs text-gray-400 text-center">No encontrado</div> :
                                                    variantesFiltradas.map(v => (
                                                        <div key={v.id} className="p-2 hover:bg-gray-50 cursor-pointer rounded-lg flex items-center justify-between group transition-colors"
                                                            onClick={() => { setVarSel(v.id); setQVar(`${v.productoNombre} · ${v.talla} · ${v.color}`); }}>

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg border border-gray-100 bg-white overflow-hidden shrink-0 relative">
                                                                    {v.imagenUrl ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={v.imagenUrl} className="w-full h-full object-cover" alt="" />
                                                                    ) : <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">IMG</div>}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-gray-800 text-sm">{v.productoNombre}</span>
                                                                        {v.productoEstado === 'INACTIVO' && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-black border">INACTIVO</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">{v.talla}</span>
                                                                        {v.colorHex && (
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="w-3 h-3 rounded-full border border-gray-300 shadow-sm" style={getColorStyle(v.colorHex)}></span>
                                                                                <span>{v.color}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Stock</span>
                                                                <span className="text-xs font-mono font-medium text-slate-700">{v.stockActual}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={agregarVarianteIndividual} className="bg-slate-900 text-white px-5 rounded-xl font-bold hover:bg-slate-800 shadow-lg hover:shadow-xl active:scale-95 transition-all">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* MODO LOTE */}
                            <div className="space-y-4 pt-2">
                                {!prodSel && <p className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">O carga masiva</p>}

                                <div className="relative group">
                                    <Package className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-slate-900 transition-colors pointer-events-none" />
                                    <select
                                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all cursor-pointer appearance-none font-medium text-gray-700"
                                        value={prodSel}
                                        onChange={e => { setProdSel(e.target.value); setQProd(""); }}
                                    >
                                        <option value="">-- Seleccionar producto para lote --</option>
                                        {productosFiltrados.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombre} {p.estado === 'INACTIVO' ? '(INACTIVO)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {prodSel && (
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-5 animate-in zoom-in-95">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider ml-1">Cantidad Total</label>
                                                <input type="number" className="w-full border border-blue-200 rounded-xl p-2.5 font-bold text-blue-900 focus:ring-2 focus:ring-blue-200 outline-none" value={cantidadTotalProd} onChange={e => setCantidadTotalProd(e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider ml-1">Costo Unitario Global</label>
                                                <div className="flex gap-2">
                                                    <input className="w-full border border-blue-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-200 outline-none" value={costoDefaultProd} onChange={e => setCostoDefaultProd(e.target.value)} placeholder="0.00" />
                                                    <button onClick={aplicarCostoATodas} className="bg-white border border-blue-200 px-4 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors">Aplicar</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-sm">
                                                <thead className="bg-blue-50/50 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">Variante</th>
                                                        <th className="px-2 py-2 w-24 text-center">Cant.</th>
                                                        <th className="px-2 py-2 w-28 text-center">Costo U.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-blue-50">
                                                    {variantesDelProducto.map(v => (
                                                        <tr key={v.id} className="hover:bg-blue-50/20 transition-colors">
                                                            <td className="px-4 py-2">
                                                                <div className="flex items-center gap-3">
                                                                    {v.colorHex && <span className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={getColorStyle(v.colorHex)}></span>}
                                                                    <span className="font-medium text-gray-700">{v.talla} · {v.color}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input type="number" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none" value={dist[v.id]?.cantidad || 0} onChange={e => setCantidadDistribuida(v.id, e.target.value)} />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={dist[v.id]?.costoUnitario || ""} onChange={e => setDist(p => ({ ...p, [v.id]: { ...p[v.id], costoUnitario: e.target.value } }))} placeholder="0.00" />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${sumaAsignada !== totalObjetivo ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                Asignado: {sumaAsignada} / {totalObjetivo}
                                            </div>
                                            <button onClick={agregarProductoDistribuido} disabled={sumaAsignada !== totalObjetivo || totalObjetivo <= 0} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2">
                                                <Check className="w-4 h-4" /> Confirmar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MODO EMPAQUES */}
                    {modoItem === "EMPAQUE" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                <input
                                    className="w-full border border-gray-200 rounded-xl pl-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                                    placeholder="Buscar empaque..."
                                    value={qEmp} onChange={e => setQEmp(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                                {empaquesFiltrados.map(e => (
                                    <button key={e.id} onClick={() => agregarEmpaque(e.id)} className="text-left p-3 border border-gray-200 rounded-xl hover:border-slate-900 hover:shadow-md transition-all group bg-white">
                                        <div className="font-bold text-sm text-gray-900 group-hover:text-slate-900">{e.nombre}</div>
                                        <div className="text-xs text-gray-500 mt-2 flex justify-between items-center pt-2 border-t border-gray-50">
                                            <span className="bg-gray-100 px-1.5 rounded text-[10px] font-bold">Stock: {e.stock}</span>
                                            <span className="font-medium">S/ {Number(e.costoUnitario).toFixed(2)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* TABLA DETALLE */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" /> Resumen del Pedido
                        </h2>
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center">Img</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-2 py-3 w-20 text-center">Cant.</th>
                                <th className="px-2 py-3 w-24 text-center">Costo</th>
                                <th className="px-4 py-3 w-24 text-right">Subtotal</th>
                                <th className="px-2 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.map((it, idx) => {
                                const cu = Number(it.costoUnitario || 0);
                                const sub = it.cantidad * (isNaN(cu) ? 0 : cu);
                                return (
                                    <tr key={`${it.id}-${idx}`} className="hover:bg-gray-50/50 group">

                                        <td className="px-4 py-3 text-center">
                                            {it.imagenUrl ? (
                                                <div className="w-9 h-9 rounded-lg border border-gray-200 overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-slate-900 transition-all mx-auto bg-white"
                                                    onClick={() => setPreviewImage(it.imagenUrl || null)}>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={it.imagenUrl} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 mx-auto">IMG</div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-xs line-clamp-1" title={it.titulo}>{it.titulo}</span>
                                                    {it.productoEstado === 'INACTIVO' && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-black border">INACTIVO</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${it.tipo === 'PRODUCTO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                        {it.tipo === 'PRODUCTO' ? 'Ropa' : 'Empaque'}
                                                    </span>
                                                    {it.hexColor && <span className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={getColorStyle(it.hexColor)}></span>}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-2 py-3">
                                            <input className="w-full border border-gray-200 rounded-lg text-center py-1.5 text-xs font-bold text-slate-700 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none transition-all" type="number" value={it.cantidad} onChange={e => setItems(prev => prev.map((x, i) => i === idx ? { ...x, cantidad: Number(e.target.value) } : x))} />
                                        </td>

                                        <td className="px-2 py-3">
                                            <input className="w-full border border-gray-200 rounded-lg text-center py-1.5 text-xs font-medium bg-gray-50 focus:bg-white focus:ring-1 focus:ring-slate-900 outline-none transition-all" value={it.costoUnitario} onChange={e => setItems(prev => prev.map((x, i) => i === idx ? { ...x, costoUnitario: e.target.value } : x))} placeholder="0.00" />
                                        </td>

                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-xs">{soles(sub)}</td>

                                        <td className="px-2 py-3 text-center">
                                            <button onClick={() => quitarItem(idx)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-400 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <ShoppingCart className="w-8 h-8 text-gray-200" />
                                            <span className="text-xs">Tu carrito de compra está vacío</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FOOTER TOTAL FLOTANTE */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 z-40 lg:hidden">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Estimado</p>
                        <p className="text-2xl font-bold text-slate-900">{soles(total)}</p>
                    </div>
                    <button onClick={guardar} disabled={guardando} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-70">
                        {guardando ? "Procesando..." : "Finalizar"}
                    </button>
                </div>
            </div>

            {/* TOTAL DESKTOP */}
            <div className="hidden lg:block fixed bottom-8 right-8 z-40">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl w-80 border border-slate-700">
                    <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-4">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total a Pagar</span>
                        <span className="text-3xl font-bold tracking-tight">{soles(total)}</span>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-xs font-medium flex items-center gap-2">
                            <span className="text-lg">⚠️</span> {error}
                        </div>
                    )}

                    <button
                        onClick={guardar}
                        disabled={guardando || items.length === 0}
                        className="w-full bg-white text-slate-900 rounded-xl py-3.5 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        {guardando ? "Guardando..." : "Confirmar Compra"}
                    </button>
                </div>
            </div>

        </div>
    );
}