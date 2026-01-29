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
  precioVenta: string; // mostrar en tabla detalle
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

  // SUGERENCIA PROVEEDOR POR HISTORIAL
  const [proveedorManual, setProveedorManual] = useState(false);
  const [proveedorSugerido, setProveedorSugerido] = useState<{ id: string; nombre: string } | null>(null);
  const [origenSugerencia, setOrigenSugerencia] = useState<"VARIANTE" | "PRODUCTO" | null>(null);

  // ✅ MODO PRODUCTO (total -> distribuir en variantes)
  const [modoAgregar, setModoAgregar] = useState<"VARIANTE" | "PRODUCTO">("VARIANTE");
  const [qProd, setQProd] = useState("");
  const [prodSel, setProdSel] = useState("");
  const [cantidadTotalProd, setCantidadTotalProd] = useState("0");
  const [costoDefaultProd, setCostoDefaultProd] = useState("");
  const [dist, setDist] = useState<Record<string, { cantidad: number; costoUnitario: string }>>({});

  // ---------------------------
  // FILTROS / SELECTS
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

  // ✅ recorte automático si excede totalObjetivo
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

  // ---------------------------
  // SUGERENCIA PROVEEDOR (por VARIANTE)
  // ---------------------------
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
    return () => {
      cancel = true;
    };
  }, [varSel, modoAgregar, proveedorManual, proveedorId]);

  // ---------------------------
  // ✅ SUGERENCIA PROVEEDOR (por PRODUCTO)
  // ---------------------------
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
    return () => {
      cancel = true;
    };
  }, [prodSel, modoAgregar, proveedorManual, proveedorId]);

  // ---------------------------
  // INIT DISTRIBUCIÓN (modo PRODUCTO)
  // ---------------------------
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

  // ---------------------------
  // ITEMS: agregar/quitar (modo VARIANTE)
  // ---------------------------
  function agregarItem() {
    setError(null);
    setOkMsg(null);

    if (!varianteElegida) {
      setError("Selecciona una variante.");
      return;
    }

    const titulo = `${varianteElegida.productoNombre} · ${varianteElegida.talla} · ${varianteElegida.color}`;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.varianteId === varianteElegida.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          varianteId: varianteElegida.id,
          titulo,
          stockActual: varianteElegida.stockActual,
          cantidad: 1,
          costoUnitario: "",
          precioVenta: varianteElegida.productoPrecio,
        },
      ];
    });
  }

  function quitarItem(varianteId: string) {
    setItems((prev) => prev.filter((x) => x.varianteId !== varianteId));
  }

  // ---------------------------
  // MODO PRODUCTO: helpers
  // ---------------------------
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

    if (sumaAsignada !== totalObjetivo) {
      return setError(`La suma por variantes (${sumaAsignada}) debe ser igual al total (${totalObjetivo}).`);
    }

    for (const v of variantesDelProducto) {
      const d = dist[v.id];
      const cant = Number(d?.cantidad || 0);
      if (cant <= 0) continue;

      if (d.costoUnitario === "" || isNaN(Number(d.costoUnitario)) || Number(d.costoUnitario) < 0) {
        return setError(`Completa costo unitario para: ${v.productoNombre} · ${v.talla} · ${v.color}`);
      }

      const ya = items.find((x) => x.varianteId === v.id);
      if (ya && ya.costoUnitario && ya.costoUnitario !== d.costoUnitario) {
        return setError(
          `La variante "${ya.titulo}" ya está en el detalle con otro costo unitario. Quita esa línea o usa el mismo costo.`
        );
      }
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
          copy[idx] = {
            ...old,
            cantidad: old.cantidad + cant,
            costoUnitario: old.costoUnitario || d.costoUnitario,
          };
        } else {
          copy.push({
            varianteId: v.id,
            titulo,
            stockActual: v.stockActual,
            cantidad: cant,
            costoUnitario: d.costoUnitario,
            precioVenta: v.productoPrecio,
          });
        }
      }

      return copy;
    });

    setProdSel("");
    setQProd("");
    setCantidadTotalProd("0");
    setCostoDefaultProd("");
    setDist({});
  }

  // ---------------------------
  // TOTALES
  // ---------------------------
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

  // ---------------------------
  // GUARDAR COMPRA
  // ---------------------------
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);

    if (items.length === 0) {
      setError("Agrega al menos 1 ítem.");
      return;
    }

    for (const it of items) {
      if (!Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0) {
        setError("Hay un ítem con cantidad inválida.");
        return;
      }
      if (it.costoUnitario === "" || isNaN(Number(it.costoUnitario)) || Number(it.costoUnitario) < 0) {
        setError("Completa el costo unitario en todos los ítems.");
        return;
      }
    }

    setGuardando(true);

    const body = {
      estado: "RECIBIDO",
      proveedorId: proveedorId || null,
      fechaCompra: fechaCompra ? new Date(`${fechaCompra}T12:00:00`).toISOString() : undefined,
      notas: notas || null,
      costoEnvio: costoEnvio === "" ? null : costoEnvio,
      otrosCostos: otrosCostos === "" ? null : otrosCostos,
      items: items.map((it) => ({
        varianteId: it.varianteId,
        cantidad: Number(it.cantidad),
        costoUnitario: it.costoUnitario,
      })),
    };

    const r = await fetch("/api/admin/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setGuardando(false);

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error creando compra");
      return;
    }

    setOkMsg("Compra registrada (RECIBIDO). Stock actualizado.");
    router.push("/admin/compras");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Nueva compra</h1>
          <p className="text-sm opacity-80">Al guardar: sube stock y registra movimientos COMPRA.</p>
        </div>

        <button className="border rounded-md px-3 py-2" type="button" onClick={() => router.push("/admin/compras")}>
          ← Volver
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {okMsg && <p className="text-sm text-green-700">{okMsg}</p>}

      <form onSubmit={guardar} className="space-y-4">
        {/* DATOS COMPRA */}
        <div className="border rounded-xl p-4 space-y-3">
          <h2 className="text-lg font-semibold">Datos de compra</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Proveedor (opcional)</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={proveedorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setProveedorId(val);
                  setProveedorManual(val !== "");
                }}
              >
                <option value="">Sin proveedor</option>
                {initialData.proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>

              {proveedorSugerido && (
                <p className="text-sm opacity-80 mt-2">
                  Sugerido por historial ({origenSugerencia === "PRODUCTO" ? "producto" : "variante"}):{" "}
                  <b>{proveedorSugerido.nombre}</b>
                  {proveedorId && proveedorId !== proveedorSugerido.id && (
                    <button
                      type="button"
                      className="underline ml-2"
                      onClick={() => {
                        setProveedorId(proveedorSugerido.id);
                        setProveedorManual(true);
                      }}
                    >
                      Usar sugerido
                    </button>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm">Fecha</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Costos extra</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Envío"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                />
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Otros"
                  value={otrosCostos}
                  onChange={(e) => setOtrosCostos(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Notas</label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Ingreso por campaña, proveedor X, etc."
            />
          </div>
        </div>

        {/* AGREGAR ITEMS */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Agregar ítems</h2>

            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded-md border text-sm ${modoAgregar === "VARIANTE" ? "bg-black text-white" : ""}`}
                onClick={() => setModoAgregar("VARIANTE")}
              >
                Por variante
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md border text-sm ${modoAgregar === "PRODUCTO" ? "bg-black text-white" : ""}`}
                onClick={() => setModoAgregar("PRODUCTO")}
              >
                Por producto (distribuir)
              </button>
            </div>
          </div>

          {/* MODO VARIANTE */}
          {modoAgregar === "VARIANTE" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1 md:col-span-1">
                  <label className="text-sm">Buscar</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Ej: vestido M negro / SKU"
                    value={qVar}
                    onChange={(e) => setQVar(e.target.value)}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm">Variante</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={varSel}
                    onChange={(e) => setVarSel(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {variantesFiltradas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.productoNombre} · {v.talla} · {v.color} (stock: {v.stockActual}) · Precio:{" "}
                        {soles(v.productoPrecio)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="button" className="bg-black text-white rounded-md px-4 py-2" onClick={agregarItem}>
                + Agregar ítem
              </button>
            </>
          )}

          {/* MODO PRODUCTO */}
          {modoAgregar === "PRODUCTO" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1 md:col-span-1">
                  <label className="text-sm">Buscar producto</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Ej: vestido / polo..."
                    value={qProd}
                    onChange={(e) => setQProd(e.target.value)}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm">Producto</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={prodSel}
                    onChange={(e) => setProdSel(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {productosFiltrados.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} · {soles(p.precioVenta)}
                      </option>
                    ))}
                  </select>

                  {productoSeleccionado && (
                    <p className="text-sm opacity-80 mt-2">
                      Precio de venta: <b>{soles(productoSeleccionado.precioVenta)}</b>
                    </p>
                  )}
                </div>
              </div>

              {prodSel && (
                <div className="border rounded-xl p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-sm">Cantidad total comprada (este producto)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="w-full border rounded-md px-3 py-2"
                        value={cantidadTotalProd}
                        onChange={(e) => {
                          const n = Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0);
                          setCantidadTotalProd(String(n));
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm">Costo unitario (opcional para todas)</label>
                      <input
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="0.00"
                        value={costoDefaultProd}
                        onChange={(e) => setCostoDefaultProd(e.target.value)}
                      />
                    </div>

                    <button type="button" className="border rounded-md px-4 py-2" onClick={aplicarCostoATodas}>
                      Aplicar costo a todas
                    </button>
                  </div>

                  <p className="text-sm opacity-80">
                    Asignado: <b>{sumaAsignada}</b> / Total: <b>{totalObjetivo}</b>{" "}
                    {sumaAsignada === totalObjetivo ? (
                      <span className="text-green-700">OK</span>
                    ) : (
                      <span className="text-red-600">Falta/cuadra</span>
                    )}
                  </p>

                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-black text-white">
                        <tr>
                          <th className="text-left p-3">Talla</th>
                          <th className="text-left p-3">Color</th>
                          <th className="text-left p-3">Stock actual</th>
                          <th className="text-left p-3">Cantidad</th>
                          <th className="text-left p-3">Costo unit.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantesDelProducto.map((v) => (
                          <tr key={v.id} className="border-t">
                            <td className="p-3">{v.talla}</td>
                            <td className="p-3">{v.color}</td>
                            <td className="p-3">{v.stockActual}</td>
                            <td className="p-3">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="w-24 border rounded-md px-2 py-1"
                                value={dist[v.id]?.cantidad ?? 0}
                                onChange={(e) => setCantidadDistribuida(v.id, e.target.value)}
                              />
                            </td>
                            <td className="p-3">
                              <input
                                className="w-28 border rounded-md px-2 py-1"
                                placeholder="0.00"
                                value={dist[v.id]?.costoUnitario ?? ""}
                                onChange={(e) =>
                                  setDist((prev) => ({
                                    ...prev,
                                    [v.id]: { ...prev[v.id], costoUnitario: e.target.value },
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}

                        {variantesDelProducto.length === 0 && (
                          <tr>
                            <td className="p-3" colSpan={5}>
                              Este producto no tiene variantes.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    className="bg-black text-white rounded-md px-4 py-2"
                    onClick={agregarProductoDistribuido}
                    disabled={variantesDelProducto.length === 0 || sumaAsignada !== totalObjetivo || totalObjetivo <= 0}
                  >
                    + Agregar producto distribuido al detalle
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* DETALLE */}
        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Detalle</h2>
            <div className="text-sm opacity-80">
              Subtotal: <b>{soles(subtotal)}</b> · Total: <b>{soles(total)}</b>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left p-3">Variante</th>
                <th className="text-left p-3">Precio venta</th>
                <th className="text-left p-3">Stock actual</th>
                <th className="text-left p-3">Cantidad</th>
                <th className="text-left p-3">Costo unit.</th>
                <th className="text-left p-3">Total línea</th>
                <th className="text-left p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const cu = Number(it.costoUnitario || 0);
                const line = it.cantidad * (Number.isNaN(cu) ? 0 : cu);

                return (
                  <tr key={it.varianteId} className="border-t">
                    <td className="p-3">{it.titulo}</td>
                    <td className="p-3">{soles(it.precioVenta)}</td>
                    <td className="p-3">{it.stockActual}</td>
                    <td className="p-3">
                      <input
                        className="w-24 border rounded-md px-2 py-1"
                        value={it.cantidad}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x) =>
                              x.varianteId === it.varianteId ? { ...x, cantidad: Number(e.target.value || 0) } : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className="w-28 border rounded-md px-2 py-1"
                        placeholder="0.00"
                        value={it.costoUnitario}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((x) =>
                              x.varianteId === it.varianteId ? { ...x, costoUnitario: e.target.value } : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="p-3">{soles(line)}</td>
                    <td className="p-3">
                      <button type="button" className="underline" onClick={() => quitarItem(it.varianteId)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Aún no hay ítems. Agrega variantes arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button disabled={guardando} className="bg-black text-white rounded-md px-4 py-2">
          {guardando ? "Guardando..." : "Registrar compra"}
        </button>
      </form>
    </div>
  );
}
