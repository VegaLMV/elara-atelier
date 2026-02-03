"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// --- TIPOS ---
type Proveedor = { id: string; nombre: string };

type ProductoRaw = {
  id: string;
  nombre: string;
  precio: number; 
  variantes: any[];
  proveedorSugerido?: any;
  imagenes?: { url: string; esPortada: boolean }[]; // Agregamos imágenes
  imagenesColor?: { url: string; colorId: string }[]; // Agregamos imágenes por color
};

type Empaque = {
  id: string;
  nombre: string;
  stock: number;
  costoUnitario: any;
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
};

type ItemCarrito = {
  id: string; 
  tipo: "PRODUCTO" | "EMPAQUE";
  titulo: string;
  stockActual: number;
  cantidad: number;
  costoUnitario: string;
  precioVenta?: string;
  imagenUrl?: string | null; // Para mostrar en tabla detalle
  hexColor?: string | null;  // Para mostrar en tabla detalle
};

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

export default function CompraForm({ proveedores, productos: productosRaw, empaques, prefill }: Props) {
  const router = useRouter();

  // Estados Generales
  const [proveedorId, setProveedorId] = useState<string>("");
  const [fechaCompra, setFechaCompra] = useState<string>(hoyLocalYYYYMMDD());
  const [notas, setNotas] = useState<string>("");
  const [costoEnvio, setCostoEnvio] = useState<string>("");
  const [otrosCostos, setOtrosCostos] = useState<string>("");

  // Estados UI
  const [qProv, setQProv] = useState("");
  const [provMenuOpen, setProvMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // MODAL ZOOM

  // Estados Items
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [modoItem, setModoItem] = useState<"PRODUCTO" | "EMPAQUE">("PRODUCTO");
  
  // Buscadores
  const [qVar, setQVar] = useState<string>("");
  const [varSel, setVarSel] = useState<string>("");
  const [prodSel, setProdSel] = useState(""); 
  const [qProd, setQProd] = useState(""); 
  const [qEmp, setQEmp] = useState("");

  // Distribución Lote
  const [cantidadTotalProd, setCantidadTotalProd] = useState("0");
  const [costoDefaultProd, setCostoDefaultProd] = useState("");
  const [dist, setDist] = useState<Record<string, { cantidad: number; costoUnitario: string }>>({});

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // ---------------------------------------------
  // 1. MEMOS: Aplanar Data con Imágenes y Colores
  // ---------------------------------------------
  const todasLasVariantes = useMemo(() => {
    return productosRaw.flatMap(p => 
      p.variantes.map((v: any) => {
        const imgColor = p.imagenesColor?.find((ic: any) => ic.colorId === v.colorId);
        const imgGeneral = p.imagenes?.[0];
        const finalImg = imgColor?.url || imgGeneral?.url || null;

        return {
            id: v.id,
            productoId: p.id,
            productoNombre: p.nombre,
            productoPrecio: String(p.precio ?? 0),
            talla: v.talla?.nombre ?? "U",
            tallaOrden: v.talla?.orden ?? 0,
            color: v.color?.nombre ?? "U",
            colorHex: v.color?.hex ?? null, // Hex del color
            sku: v.sku ?? "",
            stockActual: v.stockActual ?? 0,
            activa: v.activa,
            imagenUrl: finalImg // URL imagen
        };
      })
    );
  }, [productosRaw]);

  // Filtros
  const proveedoresFiltrados = useMemo(() => {
     if (!qProv) return proveedores.slice(0, 10);
     return proveedores.filter(p => p.nombre.toLowerCase().includes(qProv.toLowerCase())).slice(0, 10);
  }, [proveedores, qProv]);

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

  // Selecciones
  const varianteElegida = useMemo(() => todasLasVariantes.find((v) => v.id === varSel) ?? null, [varSel, todasLasVariantes]);
  const productoSeleccionado = useMemo(() => productosRaw.find((p) => p.id === prodSel) ?? null, [prodSel, productosRaw]);
  
  const variantesDelProducto = useMemo(() => {
    if (!prodSel) return [];
    return todasLasVariantes
      .filter((v) => v.productoId === prodSel)
      .sort((a, b) => a.tallaOrden - b.tallaOrden || a.color.localeCompare(b.color));
  }, [prodSel, todasLasVariantes]);

  // ---------------------------------------------
  // 2. PREFILL
  // ---------------------------------------------
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
    }
    else if (prefill?.productoId) {
        setModoItem("PRODUCTO");
        const prod = productosRaw.find(p => p.id === prefill.productoId);
        if (!prod) return;

        if (prefill.varianteId) {
            const v = todasLasVariantes.find(tv => tv.id === prefill.varianteId);
            if (v) {
                agregarItemDirecto({
                    id: v.id, tipo: "PRODUCTO", titulo: `${v.productoNombre} · ${v.talla} · ${v.color}`,
                    stockActual: v.stockActual, cantidad: 10, costoUnitario: "", precioVenta: v.productoPrecio,
                    imagenUrl: v.imagenUrl, hexColor: v.colorHex
                });
            }
        } else {
            setProdSel(prod.id);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, productosRaw, empaques]);

  // ---------------------------------------------
  // 3. LOGICA LOTE
  // ---------------------------------------------
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
        for (const k of Object.keys(copy)) copy[k] = { ...copy[k], cantidad: 0 };
      }
      return copy;
    });
  }, [totalObjetivo, variantesDelProducto]);

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

  // ---------------------------------------------
  // 4. ACCIONES
  // ---------------------------------------------
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
        imagenUrl: varianteElegida.imagenUrl, // Pasamos img
        hexColor: varianteElegida.colorHex     // Pasamos color
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
      if ((d?.cantidad || 0) > 0) {
          if (!d.costoUnitario || isNaN(Number(d.costoUnitario))) return setError(`Falta costo para ${v.talla} ${v.color}`);
      }
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
            imagenUrl: v.imagenUrl, hexColor: v.colorHex
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
      const cantidad = Math.min(cantidadDeseada, maxParaEsta);
      return { ...prev, [varianteId]: { ...prev[varianteId], cantidad } };
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
    setOkMsg(null);
    if (items.length === 0) { setError("Agrega al menos 1 ítem."); return; }
    
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

    const r = await fetch("/api/admin/compras", { 
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) 
    });
    setGuardando(false);

    if (!r.ok) { 
        const d = await r.json().catch(() => ({})); 
        setError(d?.error ?? "Error creando compra"); 
        return; 
    }

    setOkMsg("Compra registrada.");
    router.push("/admin/compras");
    router.refresh();
  }

  const total = useMemo(() => {
      const sub = items.reduce((acc, it) => acc + (it.cantidad * Number(it.costoUnitario || 0)), 0);
      return sub + Number(costoEnvio || 0) + Number(otrosCostos || 0);
  }, [items, costoEnvio, otrosCostos]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 relative">
       
       {/* --- MODAL ZOOM --- */}
       {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
           <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={previewImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
        </div>
       )}

       {/* COLUMNA IZQUIERDA: DATOS */}
       <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Datos de Compra</h2>
              
              <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proveedor</label>
                  <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                      placeholder="Buscar proveedor..."
                      value={qProv}
                      onChange={e => { setQProv(e.target.value); setProvMenuOpen(true); }}
                      onFocus={() => setProvMenuOpen(true)}
                      onBlur={() => setTimeout(() => setProvMenuOpen(false), 200)}
                  />
                  {provMenuOpen && (
                      <div className="absolute top-full left-0 w-full bg-white border shadow-xl rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
                          {proveedoresFiltrados.length === 0 ? (
                              <div className="p-3 text-xs text-gray-400">Sin resultados</div>
                          ) : (
                              proveedoresFiltrados.map(p => (
                                  <div key={p.id} 
                                       className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                       onMouseDown={() => { setProveedorId(p.id); setQProv(p.nombre); setProvMenuOpen(false); }}
                                  >
                                      {p.nombre}
                                  </div>
                              ))
                          )}
                      </div>
                  )}
                  <input type="hidden" value={proveedorId} />
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notas</label>
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm h-20 resize-none" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Detalles..." />
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Costos Extra</h2>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-bold">Envío</label>
                      <input className="w-full border rounded-lg px-2 py-2 text-sm" placeholder="0.00" value={costoEnvio} onChange={e => setCostoEnvio(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-bold">Otros</label>
                      <input className="w-full border rounded-lg px-2 py-2 text-sm" placeholder="0.00" value={otrosCostos} onChange={e => setOtrosCostos(e.target.value)} />
                  </div>
              </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg sticky top-6">
              <div className="flex justify-between items-end mb-4">
                  <span className="text-slate-400 text-sm">Total a Pagar</span>
                  <span className="text-3xl font-bold tracking-tight">{soles(total)}</span>
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/20 rounded text-red-200 text-xs">⚠️ {error}</div>}
              <button onClick={guardar} disabled={guardando} className="w-full bg-white text-slate-900 rounded-xl px-4 py-3 font-bold hover:bg-gray-100 disabled:opacity-50">
                  {guardando ? "Guardando..." : "Confirmar Compra"}
              </button>
          </div>
       </div>

       {/* COLUMNA DERECHA: SELECCIÓN */}
       <div className="lg:col-span-2 space-y-6">
           <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                   <h2 className="text-lg font-bold text-gray-900">Agregar Ítems</h2>
                   <div className="flex bg-gray-100 p-1 rounded-lg">
                       <button onClick={() => setModoItem("PRODUCTO")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${modoItem === 'PRODUCTO' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>👕 Ropa</button>
                       <button onClick={() => setModoItem("EMPAQUE")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${modoItem === 'EMPAQUE' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>📦 Empaques</button>
                   </div>
               </div>

               {/* MODO ROPA */}
               {modoItem === "PRODUCTO" && (
                   <div className="space-y-6 animate-in fade-in">
                       <div className="flex gap-4 text-sm">
                           <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" checked={!prodSel} onChange={() => setProdSel("")} className="text-black focus:ring-black" />
                               <span>Variante Individual</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" checked={!!prodSel} onChange={() => {}} className="text-black focus:ring-black" disabled />
                               <span className="text-gray-400">Por Lote (Selecciona abajo)</span>
                           </label>
                       </div>

                       {/* BÚSQUEDA INDIVIDUAL MEJORADA */}
                       {!prodSel && (
                           <div className="flex gap-2">
                               <div className="relative flex-1">
                                   <input 
                                      className="w-full border rounded-lg pl-3 py-2.5 text-sm" 
                                      placeholder="Buscar variante (Ej: Blusa Roja)..." 
                                      value={qVar} onChange={e => setQVar(e.target.value)} 
                                   />
                                   {qVar && !varSel && (
                                       <div className="absolute top-full left-0 w-full bg-white border shadow-xl rounded-lg mt-1 max-h-72 overflow-y-auto z-10">
                                           {variantesFiltradas.length === 0 ? <div className="p-3 text-xs text-gray-400">No encontrado</div> : 
                                               variantesFiltradas.map(v => (
                                                   <div key={v.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center group border-b border-gray-50 last:border-0" 
                                                        onClick={() => { setVarSel(v.id); setQVar(`${v.productoNombre} · ${v.talla} · ${v.color}`); }}>
                                                        
                                                        {/* Lado Izquierdo: Info + Imagen */}
                                                        <div className="flex items-center gap-3">
                                                            {/* Imagen Mini */}
                                                            <div className="w-8 h-8 rounded border bg-gray-50 overflow-hidden shrink-0">
                                                                {v.imagenUrl ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={v.imagenUrl} className="w-full h-full object-cover" alt="" />
                                                                ) : <div className="w-full h-full flex items-center justify-center text-[10px]">📷</div>}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-gray-800">{v.productoNombre}</span>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <span className="bg-gray-100 px-1.5 rounded">{v.talla}</span>
                                                                    {/* Círculo Color */}
                                                                    {v.colorHex && (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="w-3 h-3 rounded-full border border-gray-300" style={{backgroundColor: v.colorHex}}></span>
                                                                            <span>{v.color}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Lado Derecho: Stock */}
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 group-hover:bg-white group-hover:border group-hover:border-gray-300 transition-all">Stock: {v.stockActual}</span>
                                                   </div>
                                               ))
                                           }
                                       </div>
                                   )}
                               </div>
                               <button onClick={agregarVarianteIndividual} className="bg-black text-white px-4 rounded-lg font-bold hover:bg-gray-800">+</button>
                           </div>
                       )}

                       {/* MODO LOTE */}
                       <div className="space-y-4 pt-4 border-t border-gray-100">
                           <div className="space-y-1">
                               <label className="text-xs font-bold text-gray-500 uppercase">O buscar producto entero (Lote)</label>
                               <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={prodSel} onChange={e => { setProdSel(e.target.value); setQProd(""); }}>
                                   <option value="">-- Seleccionar producto --</option>
                                   {productosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                               </select>
                           </div>

                           {prodSel && (
                               <div className="bg-gray-50 border rounded-xl p-4 space-y-4">
                                   <div className="grid grid-cols-2 gap-4">
                                       <div>
                                           <label className="text-xs font-bold text-gray-500">Cantidad Total</label>
                                           <input type="number" className="w-full border rounded-lg p-2 font-bold" value={cantidadTotalProd} onChange={e => setCantidadTotalProd(e.target.value)} />
                                       </div>
                                       <div>
                                           <label className="text-xs font-bold text-gray-500">Costo Global</label>
                                           <div className="flex gap-2">
                                               <input className="w-full border rounded-lg p-2" value={costoDefaultProd} onChange={e => setCostoDefaultProd(e.target.value)} placeholder="0.00" />
                                               <button onClick={aplicarCostoATodas} className="bg-white border px-3 rounded text-xs hover:bg-gray-100">Aplicar</button>
                                           </div>
                                       </div>
                                   </div>
                                   <div className="bg-white rounded-lg border overflow-hidden">
                                       <table className="w-full text-sm">
                                           <thead className="bg-gray-100 text-xs uppercase">
                                               <tr><th className="px-3 py-2 text-left">Variante</th><th className="px-3 py-2 w-20">Cant.</th><th className="px-3 py-2 w-24">Costo</th></tr>
                                           </thead>
                                           <tbody className="divide-y">
                                               {variantesDelProducto.map(v => (
                                                   <tr key={v.id}>
                                                       <td className="px-3 py-2">
                                                           <div className="flex items-center gap-2">
                                                               {v.colorHex && <span className="w-3 h-3 rounded-full border" style={{backgroundColor: v.colorHex}}></span>}
                                                               <span>{v.talla} · {v.color}</span>
                                                           </div>
                                                       </td>
                                                       <td className="px-3 py-2"><input type="number" className="w-full border rounded px-1 text-center" value={dist[v.id]?.cantidad || 0} onChange={e => setCantidadDistribuida(v.id, e.target.value)} /></td>
                                                       <td className="px-3 py-2"><input className="w-full border rounded px-1 text-center" value={dist[v.id]?.costoUnitario || ""} onChange={e => setDist(p => ({...p, [v.id]: {...p[v.id], costoUnitario: e.target.value}}))} placeholder="0.00"/></td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                                   <div className="flex justify-between items-center">
                                       <span className={`text-sm font-bold ${sumaAsignada !== totalObjetivo ? 'text-red-500' : 'text-green-600'}`}>Asignado: {sumaAsignada} / {totalObjetivo}</span>
                                       <button onClick={agregarProductoDistribuido} disabled={sumaAsignada !== totalObjetivo || totalObjetivo <= 0} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">Confirmar Lote</button>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               )}

               {/* MODO EMPAQUES */}
               {modoItem === "EMPAQUE" && (
                   <div className="space-y-4 animate-in fade-in">
                       <input 
                           className="w-full border rounded-lg p-2 text-sm" 
                           placeholder="Buscar empaque..." 
                           value={qEmp} onChange={e => setQEmp(e.target.value)} 
                       />
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                           {empaquesFiltrados.slice(0, 9).map(e => (
                               <button key={e.id} onClick={() => agregarEmpaque(e.id)} className="text-left p-3 border rounded-xl hover:border-black hover:shadow-md transition-all group">
                                   <div className="font-bold text-sm text-gray-900 group-hover:text-black">{e.nombre}</div>
                                   <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                       <span>Stock: {e.stock}</span>
                                       <span>S/ {e.costoUnitario}</span>
                                   </div>
                               </button>
                           ))}
                       </div>
                   </div>
               )}
           </div>

           {/* TABLA DETALLE (MIXTA) */}
           <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                   Detalle ({items.length} ítems)
               </div>
               <table className="w-full text-sm text-left">
                   <thead className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase">
                       <tr>
                           <th className="px-6 py-3 w-12">Img</th>
                           <th className="px-6 py-3">Descripción</th>
                           <th className="px-6 py-3 text-center">Tipo</th>
                           <th className="px-6 py-3 w-24 text-center">Cant.</th>
                           <th className="px-6 py-3 w-28 text-center">Costo</th>
                           <th className="px-6 py-3 w-28 text-right">Subtotal</th>
                           <th className="px-6 py-3 w-10"></th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                       {items.map((it, idx) => {
                           const cu = Number(it.costoUnitario || 0);
                           const sub = it.cantidad * (isNaN(cu) ? 0 : cu);
                           return (
                               <tr key={`${it.id}-${idx}`} className="hover:bg-gray-50">
                                   
                                   {/* COLUMNA IMAGEN (CON ZOOM) */}
                                   <td className="px-6 py-3">
                                       {it.imagenUrl ? (
                                           <div className="w-8 h-8 rounded border overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-slate-300 transition-all"
                                                onClick={() => setPreviewImage(it.imagenUrl || null)}>
                                               {/* eslint-disable-next-line @next/next/no-img-element */}
                                               <img src={it.imagenUrl} className="w-full h-full object-cover" alt="" />
                                           </div>
                                       ) : (
                                           <div className="w-8 h-8 rounded border bg-gray-50 flex items-center justify-center text-[10px] text-gray-300">📷</div>
                                       )}
                                   </td>

                                   <td className="px-6 py-3">
                                       <div className="flex items-center gap-2">
                                           {it.hexColor && <span className="w-3 h-3 rounded-full border shadow-sm shrink-0" style={{backgroundColor: it.hexColor}}></span>}
                                           <span className="font-medium text-gray-900 truncate max-w-[200px]" title={it.titulo}>{it.titulo}</span>
                                       </div>
                                   </td>
                                   <td className="px-6 py-3 text-center">
                                       <span className={`px-2 py-1 rounded text-[10px] font-bold ${it.tipo === 'PRODUCTO' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                           {it.tipo === 'PRODUCTO' ? 'ROPA' : 'EMP.'}
                                       </span>
                                   </td>
                                   <td className="px-6 py-3">
                                       <input className="w-full border rounded text-center py-1" type="number" value={it.cantidad} onChange={e => setItems(prev => prev.map((x, i) => i === idx ? { ...x, cantidad: Number(e.target.value) } : x))} />
                                   </td>
                                   <td className="px-6 py-3">
                                       <input className="w-full border rounded text-center py-1" value={it.costoUnitario} onChange={e => setItems(prev => prev.map((x, i) => i === idx ? { ...x, costoUnitario: e.target.value } : x))} />
                                   </td>
                                   <td className="px-6 py-3 text-right font-mono font-medium">{soles(sub)}</td>
                                   <td className="px-6 py-3 text-center">
                                       <button onClick={() => quitarItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                                   </td>
                               </tr>
                           )
                       })}
                       {items.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400 italic">Carrito vacío</td></tr>}
                   </tbody>
               </table>
           </div>
           
       </div>
    </div>
  );
}