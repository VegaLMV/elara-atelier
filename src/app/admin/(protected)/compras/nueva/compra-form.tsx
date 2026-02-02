"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

type Data = {
  proveedores: Array<{ id: string; nombre: string }>;
  variantes: Array<{
    id: string;
    productoId: string;
    productoNombre: string;
    productoPrecio: string; // precio venta
    talla: string;
    tallaOrden: number;
    color: string;
    sku: string;
    stockActual: number;
    activa: boolean;
  }>;
};

type Item = {
  varianteId: string;
  titulo: string;
  stockActual: number;
  cantidad: number;
  costoUnitario: string;
  precioVenta: string; 
};

function hoyLocalYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function CompraForm({ initialData }: { initialData: Data }) {
  const router = useRouter();

  const [proveedorId, setProveedorId] = useState<string>("");
  const [fechaCompra, setFechaCompra] = useState<string>(hoyLocalYYYYMMDD());
  const [notas, setNotas] = useState<string>("");

  const [costoEnvio, setCostoEnvio] = useState<string>("");
  const [otrosCostos, setOtrosCostos] = useState<string>("");

  // modo VARIANTE
  const [qVar, setQVar] = useState<string>("");
  const [varSel, setVarSel] = useState<string>("");

  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // SUGERENCIA PROVEEDOR
  const [proveedorManual, setProveedorManual] = useState(false);
  const [proveedorSugerido, setProveedorSugerido] = useState<{ id: string; nombre: string } | null>(null);
  const [origenSugerencia, setOrigenSugerencia] = useState<"VARIANTE" | "PRODUCTO" | null>(null);

  // MODO PRODUCTO
  const [modoAgregar, setModoAgregar] = useState<"VARIANTE" | "PRODUCTO">("VARIANTE");
  const [qProd, setQProd] = useState("");
  const [prodSel, setProdSel] = useState("");
  const [cantidadTotalProd, setCantidadTotalProd] = useState("0");
  const [costoDefaultProd, setCostoDefaultProd] = useState("");
  const [dist, setDist] = useState<Record<string, { cantidad: number; costoUnitario: string }>>({});

  // ---------------------------
  // LOGICA (Sin cambios funcionales, solo UI en el return)
  // ---------------------------
  const variantesFiltradas = useMemo(() => {
    const q = qVar.trim().toLowerCase();
    const base = initialData.variantes;
    if (!q) return base.slice(0, 50);
    return base
      .filter((v) => {
        const txt = `${v.productoNombre} ${v.talla} ${v.color} ${v.sku}`.toLowerCase();
        return txt.includes(q);
      })
      .slice(0, 50);
  }, [qVar, initialData.variantes]);

  const varianteElegida = useMemo(() => {
    return initialData.variantes.find((v) => v.id === varSel) ?? null;
  }, [varSel, initialData.variantes]);

  const productos = useMemo(() => {
    const m = new Map<string, { id: string; nombre: string; precioVenta: string }>();
    for (const v of initialData.variantes) {
      if (!v.productoId) continue;
      if (!m.has(v.productoId)) {
        m.set(v.productoId, { id: v.productoId, nombre: v.productoNombre, precioVenta: v.productoPrecio });
      }
    }
    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [initialData.variantes]);

  const productosFiltrados = useMemo(() => {
    const q = qProd.trim().toLowerCase();
    if (!q) return productos.slice(0, 50);
    return productos.filter((p) => p.nombre.toLowerCase().includes(q)).slice(0, 50);
  }, [qProd, productos]);

  const productoSeleccionado = useMemo(() => {
    if (!prodSel) return null;
    return productos.find((p) => p.id === prodSel) ?? null;
  }, [prodSel, productos]);

  const variantesDelProducto = useMemo(() => {
    if (!prodSel) return [];
    return initialData.variantes
      .filter((v) => v.productoId === prodSel)
      .slice()
      .sort((a, b) => a.tallaOrden - b.tallaOrden || a.color.localeCompare(b.color));
  }, [prodSel, initialData.variantes]);

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
      const ids = variantesDelProducto
        .map((v) => v.id)
        .sort((a, b) => Number(prev[b]?.cantidad || 0) - Number(prev[a]?.cantidad || 0));
      const copy: typeof prev = { ...prev };
      for (const id of ids) {
        const actual = Number(copy[id]?.cantidad || 0);
        if (actual <= 0) continue;
        const quitar = Math.min(actual, exceso);
        copy[id] = { ...copy[id], cantidad: actual - quitar };
        exceso -= quitar;
        if (exceso <= 0) break;
      }
      if (exceso > 0) {
        for (const k of Object.keys(copy)) {
          copy[k] = { ...copy[k], cantidad: 0 };
        }
      }
      return copy;
    });
  }, [totalObjetivo, variantesDelProducto]);

  function setCantidadDistribuida(varianteId: string, value: string) {
    const raw = Number.parseInt(value || "0", 10);
    const cantidadDeseada = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    setDist((prev) => {
      const otros = Object.entries(prev).reduce((acc, [id, v]) => {
        if (id === varianteId) return acc;
        return acc + (Number(v?.cantidad || 0) || 0);
      }, 0);
      const maxParaEsta = Math.max(0, totalObjetivo - otros);
      const cantidad = Math.min(cantidadDeseada, maxParaEsta);
      return { ...prev, [varianteId]: { ...prev[varianteId], cantidad } };
    });
  }

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (modoAgregar !== "VARIANTE") return;
      setProveedorSugerido(null);
      setOrigenSugerencia(null);
      if (!varSel) return;
      const r = await fetch(`/api/admin/variantes/${varSel}/proveedor-sugerido`);
      const d = await r.json().catch(() => null);
      if (cancel) return;
      if (!r.ok) return;
      if (d?.proveedorId) {
        const sug = { id: String(d.proveedorId), nombre: String(d.proveedorNombre ?? "") };
        setProveedorSugerido(sug);
        setOrigenSugerencia("VARIANTE");
        if (!proveedorManual && !proveedorId) {
          setProveedorId(sug.id);
        }
      }
    }
    run();
    return () => { cancel = true; };
  }, [varSel, modoAgregar, proveedorManual, proveedorId]);

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (modoAgregar !== "PRODUCTO") return;
      setProveedorSugerido(null);
      setOrigenSugerencia(null);
      if (!prodSel) return;
      const r = await fetch(`/api/admin/productos/${prodSel}/proveedor-sugerido`);
      const d = await r.json().catch(() => null);
      if (cancel) return;
      if (!r.ok) return;
      if (d?.proveedorId) {
        const sug = { id: String(d.proveedorId), nombre: String(d.proveedorNombre ?? "") };
        setProveedorSugerido(sug);
        setOrigenSugerencia("PRODUCTO");
        if (!proveedorManual && !proveedorId) {
          setProveedorId(sug.id);
        }
      }
    }
    run();
    return () => { cancel = true; };
  }, [prodSel, modoAgregar, proveedorManual, proveedorId]);

  useEffect(() => {
    if (!prodSel) {
      setDist({});
      setCantidadTotalProd("0");
      setCostoDefaultProd("");
      return;
    }
    const init: Record<string, { cantidad: number; costoUnitario: string }> = {};
    for (const v of variantesDelProducto) {
      init[v.id] = { cantidad: 0, costoUnitario: "" };
    }
    setDist(init);
    setCantidadTotalProd("0");
    setCostoDefaultProd("");
  }, [prodSel, variantesDelProducto]);

  function agregarItem() {
    setError(null);
    setOkMsg(null);
    if (!varianteElegida) { setError("Selecciona una variante."); return; }
    const titulo = `${varianteElegida.productoNombre} · ${varianteElegida.talla} · ${varianteElegida.color}`;
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.varianteId === varianteElegida.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }
      return [...prev, { varianteId: varianteElegida.id, titulo, stockActual: varianteElegida.stockActual, cantidad: 1, costoUnitario: "", precioVenta: varianteElegida.productoPrecio }];
    });
  }

  function quitarItem(varianteId: string) {
    setItems((prev) => prev.filter((x) => x.varianteId !== varianteId));
  }

  function aplicarCostoATodas() {
    setError(null);
    if (costoDefaultProd === "" || isNaN(Number(costoDefaultProd)) || Number(costoDefaultProd) < 0) {
      setError("Costo unitario inválido para aplicar.");
      return;
    }
    setDist((prev) => {
      const copy: typeof prev = { ...prev };
      for (const k of Object.keys(copy)) {
        copy[k] = { ...copy[k], costoUnitario: costoDefaultProd };
      }
      return copy;
    });
  }

  function agregarProductoDistribuido() {
    setError(null);
    setOkMsg(null);
    if (!prodSel) return setError("Selecciona un producto.");
    if (!Number.isFinite(totalObjetivo) || totalObjetivo <= 0) return setError("Cantidad total inválida.");
    if (sumaAsignada !== totalObjetivo) return setError(`La suma por variantes (${sumaAsignada}) debe ser igual al total (${totalObjetivo}).`);
    for (const v of variantesDelProducto) {
      const d = dist[v.id];
      const cant = Number(d?.cantidad || 0);
      if (cant <= 0) continue;
      if (d.costoUnitario === "" || isNaN(Number(d.costoUnitario)) || Number(d.costoUnitario) < 0) return setError(`Completa costo unitario para: ${v.productoNombre} · ${v.talla} · ${v.color}`);
      const ya = items.find((x) => x.varianteId === v.id);
      if (ya && ya.costoUnitario && ya.costoUnitario !== d.costoUnitario) return setError(`La variante "${ya.titulo}" ya está en el detalle con otro costo unitario. Quita esa línea o usa el mismo costo.`);
    }
    setItems((prev) => {
      const copy = [...prev];
      for (const v of variantesDelProducto) {
        const d = dist[v.id];
        const cant = Number(d?.cantidad || 0);
        if (cant <= 0) continue;
        const titulo = `${v.productoNombre} · ${v.talla} · ${v.color}`;
        const idx = copy.findIndex((x) => x.varianteId === v.id);
        if (idx >= 0) {
          const old = copy[idx];
          copy[idx] = { ...old, cantidad: old.cantidad + cant, costoUnitario: old.costoUnitario || d.costoUnitario };
        } else {
          copy.push({ varianteId: v.id, titulo, stockActual: v.stockActual, cantidad: cant, costoUnitario: d.costoUnitario, precioVenta: v.productoPrecio });
        }
      }
      return copy;
    });
    setProdSel(""); setQProd(""); setCantidadTotalProd("0"); setCostoDefaultProd(""); setDist({});
  }

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const cu = Number(it.costoUnitario || 0);
      const c = Number(it.cantidad || 0);
      return acc + c * (Number.isNaN(cu) ? 0 : cu);
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    const envio = Number(costoEnvio || 0);
    const otros = Number(otrosCostos || 0);
    return subtotal + (Number.isNaN(envio) ? 0 : envio) + (Number.isNaN(otros) ? 0 : otros);
  }, [subtotal, costoEnvio, otrosCostos]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (items.length === 0) { setError("Agrega al menos 1 ítem."); return; }
    for (const it of items) {
      if (!Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0) { setError("Hay un ítem con cantidad inválida."); return; }
      if (it.costoUnitario === "" || isNaN(Number(it.costoUnitario)) || Number(it.costoUnitario) < 0) { setError("Completa el costo unitario en todos los ítems."); return; }
    }
    setGuardando(true);
    const body = {
      estado: "RECIBIDO",
      proveedorId: proveedorId || null,
      fechaCompra: fechaCompra ? new Date(`${fechaCompra}T12:00:00`).toISOString() : undefined,
      notas: notas || null,
      costoEnvio: costoEnvio === "" ? null : costoEnvio,
      otrosCostos: otrosCostos === "" ? null : otrosCostos,
      items: items.map((it) => ({ varianteId: it.varianteId, cantidad: Number(it.cantidad), costoUnitario: it.costoUnitario })),
    };
    const r = await fetch("/api/admin/compras", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setGuardando(false);
    if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d?.error ?? "Error creando compra"); return; }
    setOkMsg("Compra registrada (RECIBIDO). Stock actualizado.");
    router.push("/admin/compras");
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Registrar Compra</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresa mercadería al inventario.</p>
        </div>
        <button 
            className="text-gray-600 hover:text-gray-900 px-4 py-2.5 text-sm font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
            type="button" 
            onClick={() => router.push("/admin/compras")}
        >
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl text-sm mb-6 flex items-center gap-3 shadow-sm">
            <span className="text-lg">⚠️</span> {error}
        </div>
      )}
      {okMsg && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-5 py-4 rounded-xl text-sm mb-6 flex items-center gap-3 shadow-sm">
            <span className="text-lg">✅</span> {okMsg}
        </div>
      )}

      <form onSubmit={guardar} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
        <div className="lg:col-span-1 space-y-6">
             <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Datos de Compra</h2>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</label>
                    <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        value={fechaCompra}
                        onChange={(e) => setFechaCompra(e.target.value)}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proveedor</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-white"
                        value={proveedorId}
                        onChange={(e) => {
                            const val = e.target.value;
                            setProveedorId(val);
                            setProveedorManual(val !== "");
                        }}
                    >
                        <option value="">Seleccionar...</option>
                        {initialData.proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.nombre}
                        </option>
                        ))}
                    </select>
                    {proveedorSugerido && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex flex-col gap-1">
                            <span>💡 Sugerido por historial: <b>{proveedorSugerido.nombre}</b></span>
                            {proveedorId !== proveedorSugerido.id && (
                                <button
                                    type="button"
                                    className="text-left underline font-medium hover:text-blue-900"
                                    onClick={() => {
                                        setProveedorId(proveedorSugerido.id);
                                        setProveedorManual(true);
                                    }}
                                >
                                    Usar este proveedor
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notas</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all h-24 text-sm"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Detalles adicionales..."
                    />
                </div>
             </div>

             <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Costos Adicionales</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Envío</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="0.00"
                            value={costoEnvio}
                            onChange={(e) => setCostoEnvio(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Otros</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="0.00"
                            value={otrosCostos}
                            onChange={(e) => setOtrosCostos(e.target.value)}
                        />
                    </div>
                </div>
             </div>

             {/* RESUMEN FLOTANTE EN DESKTOP */}
             <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg sticky top-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Total a Pagar</h3>
                <div className="flex justify-between items-end">
                    <span className="text-slate-400 text-sm">Monto Final</span>
                    <span className="text-3xl font-bold tracking-tight">{soles(total)}</span>
                </div>
                <button 
                    disabled={guardando} 
                    className="w-full mt-6 bg-white text-slate-900 rounded-xl px-4 py-3 font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
                >
                    {guardando ? "Procesando..." : "Confirmar Compra"}
                </button>
             </div>
        </div>

        {/* COLUMNA DERECHA: SELECCIÓN DE ITEMS */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* SELECTOR */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Agregar Ítems</h2>
                    <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
                        <button
                            type="button"
                            className={`px-3 py-1.5 rounded-md transition-all ${modoAgregar === "VARIANTE" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                            onClick={() => setModoAgregar("VARIANTE")}
                        >
                            Individual
                        </button>
                        <button
                            type="button"
                            className={`px-3 py-1.5 rounded-md transition-all ${modoAgregar === "PRODUCTO" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                            onClick={() => setModoAgregar("PRODUCTO")}
                        >
                            Por Lote (Producto)
                        </button>
                    </div>
                </div>

                {modoAgregar === "VARIANTE" && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in">
                        <div className="md:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buscar Variante</label>
                            <div className="relative">
                                <input
                                    className="w-full border border-gray-300 rounded-lg pl-3 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                                    placeholder="Escribe para buscar..."
                                    value={qVar}
                                    onChange={(e) => setQVar(e.target.value)}
                                />
                                {qVar && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1">
                                        {variantesFiltradas.length === 0 ? (
                                            <div className="p-3 text-sm text-gray-400 text-center">No encontrado</div>
                                        ) : (
                                            variantesFiltradas.map(v => (
                                                <div 
                                                    key={v.id}
                                                    className="px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm flex justify-between items-center group"
                                                    onClick={() => {
                                                        setVarSel(v.id);
                                                        setQVar(`${v.productoNombre} · ${v.talla} · ${v.color}`);
                                                    }}
                                                >
                                                    <span className="font-medium text-gray-900">{v.productoNombre} <span className="text-gray-500 font-normal">({v.talla} / {v.color})</span></span>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 group-hover:bg-white border border-transparent group-hover:border-gray-200">Stock: {v.stockActual}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button type="button" className="bg-black text-white rounded-lg px-4 py-2.5 font-bold text-sm hover:bg-gray-800 transition-colors h-11" onClick={agregarItem}>
                            + Agregar
                        </button>
                    </div>
                )}

                {modoAgregar === "PRODUCTO" && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="space-y-1.5">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buscar Producto</label>
                             <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all bg-white"
                                value={prodSel}
                                onChange={(e) => setProdSel(e.target.value)}
                             >
                                <option value="">Seleccionar producto...</option>
                                {productosFiltrados.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                                ))}
                             </select>
                        </div>

                        {prodSel && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad Total a Repartir</label>
                                        <input
                                            type="number" min={0} step={1}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-bold text-lg"
                                            value={cantidadTotalProd}
                                            onChange={(e) => {
                                                const n = Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0);
                                                setCantidadTotalProd(String(n));
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Costo Unitario (Global)</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                                                placeholder="0.00"
                                                value={costoDefaultProd}
                                                onChange={(e) => setCostoDefaultProd(e.target.value)}
                                            />
                                            <button type="button" className="bg-white border border-gray-300 px-3 rounded-lg text-sm font-medium hover:bg-gray-50" onClick={aplicarCostoATodas}>
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-500 font-bold text-xs uppercase">
                                            <tr>
                                                <th className="px-4 py-2">Variante</th>
                                                <th className="px-4 py-2 text-center">Stock</th>
                                                <th className="px-4 py-2 w-24">Cant.</th>
                                                <th className="px-4 py-2 w-28">Costo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {variantesDelProducto.map((v) => (
                                                <tr key={v.id}>
                                                    <td className="px-4 py-2 font-medium text-gray-900">{v.talla} · {v.color}</td>
                                                    <td className="px-4 py-2 text-center text-gray-500">{v.stockActual}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number" min={0} step={1}
                                                            className="w-full border rounded px-2 py-1 text-center bg-gray-50 focus:bg-white transition-colors"
                                                            value={dist[v.id]?.cantidad ?? 0}
                                                            onChange={(e) => setCantidadDistribuida(v.id, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            className="w-full border rounded px-2 py-1 text-center bg-gray-50 focus:bg-white transition-colors"
                                                            placeholder="0.00"
                                                            value={dist[v.id]?.costoUnitario ?? ""}
                                                            onChange={(e) => setDist((prev) => ({...prev, [v.id]: { ...prev[v.id], costoUnitario: e.target.value }}))}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-sm font-medium">
                                        Asignado: <span className={sumaAsignada === totalObjetivo ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{sumaAsignada}</span> / {totalObjetivo}
                                    </div>
                                    <button
                                        type="button"
                                        className="bg-black text-white rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={agregarProductoDistribuido}
                                        disabled={variantesDelProducto.length === 0 || sumaAsignada !== totalObjetivo || totalObjetivo <= 0}
                                    >
                                        Confirmar Lote
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LISTA DETALLE */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detalle de Compra</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-400 font-bold text-xs uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Ítem</th>
                                <th className="px-6 py-3 text-right">Precio Venta</th>
                                <th className="px-6 py-3 w-24">Cant.</th>
                                <th className="px-6 py-3 w-28">Costo U.</th>
                                <th className="px-6 py-3 text-right">Subtotal</th>
                                <th className="px-6 py-3 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((it) => {
                                const cu = Number(it.costoUnitario || 0);
                                const line = it.cantidad * (Number.isNaN(cu) ? 0 : cu);

                                return (
                                    <tr key={it.varianteId} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-3 font-medium text-gray-900">{it.titulo}</td>
                                        <td className="px-6 py-3 text-right text-gray-500">{soles(it.precioVenta)}</td>
                                        <td className="px-6 py-3">
                                            <input
                                                className="w-full border rounded px-2 py-1 text-center font-bold"
                                                value={it.cantidad}
                                                onChange={(e) => setItems((prev) => prev.map((x) => x.varianteId === it.varianteId ? { ...x, cantidad: Number(e.target.value || 0) } : x))}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                className="w-full border rounded px-2 py-1 text-center"
                                                value={it.costoUnitario}
                                                onChange={(e) => setItems((prev) => prev.map((x) => x.varianteId === it.varianteId ? { ...x, costoUnitario: e.target.value } : x))}
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-900">{soles(line)}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button type="button" className="text-gray-400 hover:text-red-600 transition-colors" onClick={() => quitarItem(it.varianteId)}>
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td className="p-8 text-center text-gray-400 italic" colSpan={6}>
                                        No hay ítems agregados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

      </form>
    </div>
  );
}