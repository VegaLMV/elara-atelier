"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================================
// TIPOS DE DATOS
// ============================================================================

type DescuentoItem = {
  id: string;
  tipo: "PORCENTAJE" | "MONTO";
  valor: string;
  startsAt: string;
  endsAt: string;
  estado: string;
};

type Data = {
  producto: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: string;
    estado: "ACTIVO" | "INACTIVO";
    destacado: boolean;
    categoriaId: string;

    descuentoActivo: boolean;
    descuentoTipo: "PORCENTAJE" | "MONTO";
    descuentoValor: string;
    descuentoInicio: string;
    descuentoFin: string;
  };

  descuentosHistorial: DescuentoItem[];

  variantes: Array<{
    id: string;
    tallaId: string;
    colorId: string;
    talla: string;
    color: string;
    colorHex: string | null;
    stockActual: number;
    activa: boolean;
  }>;

  referencias: {
    categorias: Array<{ id: string; nombre: string }>;
    tallas: Array<{ id: string; nombre: string }>;
    colores: Array<{ id: string; nombre: string; hex: string | null }>;
  };

  imagenes: Array<{
    id: string;
    url: string;
    esPortada: boolean;
    orden: number;
  }>;

  imagenesColor: Array<{
    id: string;
    url: string;
    colorId: string;
    colorNombre: string;
    colorHex: string | null;
  }>;
};

// ============================================================================
// HELPERS
// ============================================================================

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (!Number.isFinite(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

async function leerJson(r: Response) {
  return await r.json().catch(() => ({}));
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProductoEditor({ initialData }: { initialData: Data }) {
  const router = useRouter();

  // ------ ESTADO DEL FORMULARIO PRINCIPAL ------
  const [nombre, setNombre] = useState(initialData.producto.nombre);
  const [descripcion, setDescripcion] = useState(initialData.producto.descripcion);
  const [precio, setPrecio] = useState(initialData.producto.precio);
  const [estado, setEstado] = useState<Data["producto"]["estado"]>(initialData.producto.estado);
  const [destacado, setDestacado] = useState(initialData.producto.destacado);
  const [categoriaId, setCategoriaId] = useState(initialData.producto.categoriaId);

  // ------ ESTADOS DE UI (Toast & Modales) ------
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [previewColor, setPreviewColor] = useState<{ nombre: string; hex: string | null } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ------ LÓGICA DE DESCUENTO VIGENTE ------
  const descuentoVigente = useMemo(() => {
    const ahora = new Date();
    return initialData.descuentosHistorial.find(d => {
      if (d.estado === 'CANCELADO') return false;
      const inicio = new Date(d.startsAt);
      const fin = new Date(d.endsAt);
      fin.setHours(23, 59, 59, 999); 
      return ahora >= inicio && ahora <= fin;
    });
  }, [initialData.descuentosHistorial]);

  // ------ ESTADOS DE DESCUENTO MANUAL ------
  const [descuentoActivo, setDescuentoActivo] = useState(!!descuentoVigente || initialData.producto.descuentoActivo);
  const [descuentoTipo, setDescuentoTipo] = useState<Data["producto"]["descuentoTipo"]>(
    (descuentoVigente?.tipo as any) ?? initialData.producto.descuentoTipo ?? "PORCENTAJE"
  );
  const [descuentoValor, setDescuentoValor] = useState(
    descuentoVigente?.valor ?? initialData.producto.descuentoValor ?? ""
  );
  
  const [descuentoInicio, setDescuentoInicio] = useState(
    descuentoVigente ? new Date(descuentoVigente.startsAt).toISOString().split('T')[0] : (initialData.producto.descuentoInicio ?? "")
  );
  const [descuentoFin, setDescuentoFin] = useState(
    descuentoVigente ? new Date(descuentoVigente.endsAt).toISOString().split('T')[0] : (initialData.producto.descuentoFin ?? "")
  );

  useEffect(() => {
    if (descuentoVigente) {
      setDescuentoActivo(true);
      setDescuentoTipo(descuentoVigente.tipo);
      setDescuentoValor(descuentoVigente.valor);
      setDescuentoInicio(new Date(descuentoVigente.startsAt).toISOString().split('T')[0]);
      setDescuentoFin(new Date(descuentoVigente.endsAt).toISOString().split('T')[0]);
    }
  }, [descuentoVigente]);

  // ------ OTROS ESTADOS ------
  const [subiendo, setSubiendo] = useState(false);
  const [tallasSel, setTallasSel] = useState<string[]>([]);
  const [coloresSel, setColoresSel] = useState<string[]>([]);
  const [qColor, setQColor] = useState("");
  const [ordenVar, setOrdenVar] = useState<"TALLA" | "COLOR" | "STOCK" | "ESTADO">("TALLA");

  const [variantes, setVariantes] = useState(initialData.variantes);
  const [imagenes, setImagenes] = useState(initialData.imagenes);
  const [imagenesColor, setImagenesColor] = useState(initialData.imagenesColor);

  useEffect(() => setVariantes(initialData.variantes), [initialData.variantes]);
  useEffect(() => setImagenes(initialData.imagenes), [initialData.imagenes]);
  useEffect(() => setImagenesColor(initialData.imagenesColor), [initialData.imagenesColor]);

  // ------ MEMOS ------
  const stockTotalActivo = useMemo(
    () => variantes.reduce((acc, v) => acc + (v.activa ? v.stockActual : 0), 0),
    [variantes]
  );

  const precioFinal = useMemo(() => {
    const p = Number(precio || 0);
    const d = Number(descuentoValor || 0);
    if (!descuentoActivo || !Number.isFinite(p) || !Number.isFinite(d)) return null;

    let fin = p;
    if (descuentoTipo === "PORCENTAJE") fin = p * (1 - d / 100);
    if (descuentoTipo === "MONTO") fin = p - d;
    fin = Math.max(0, fin);
    return fin;
  }, [precio, descuentoActivo, descuentoTipo, descuentoValor]);

  // Rankings
  const tallaRank: Record<string, number> = { XS: 1, S: 2, Standar: 3, M: 4, L: 5, XL: 6 };
  const tallasOrdenadas = useMemo(() => {
    return [...initialData.referencias.tallas].sort((a, b) => {
      const ra = tallaRank[a.nombre] ?? 99;
      const rb = tallaRank[b.nombre] ?? 99;
      return ra - rb || a.nombre.localeCompare(b.nombre);
    });
  }, [initialData.referencias.tallas]);

  const coloresAll = initialData.referencias.colores;
  const coloresSeleccionados = useMemo(() => {
    const sel = new Set(coloresSel);
    return coloresAll.filter((c) => sel.has(c.id));
  }, [coloresAll, coloresSel]);

  const coloresNoSeleccionadosFiltrados = useMemo(() => {
    const q = qColor.trim().toLowerCase();
    const sel = new Set(coloresSel);
    const base = q
      ? coloresAll.filter((c) => {
          const n = c.nombre.toLowerCase();
          const h = (c.hex ?? "").toLowerCase();
          return n.includes(q) || h.includes(q);
        })
      : coloresAll;
    return base.filter((c) => !sel.has(c.id)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [coloresAll, coloresSel, qColor]);

  const previewCombos = useMemo(() => {
    const tallasSelRows = tallasOrdenadas.filter((t) => tallasSel.includes(t.id));
    const coloresSelRows = coloresSeleccionados;
    const total = tallasSelRows.length * coloresSelRows.length;
    const limit = 24;
    const items: Array<{ talla: string; color: string; hex: string | null }> = [];
    for (const t of tallasSelRows) {
      for (const c of coloresSelRows) {
        items.push({ talla: t.nombre, color: c.nombre, hex: c.hex ?? null });
        if (items.length >= limit) break;
      }
      if (items.length >= limit) break;
    }
    return { total, items, limit };
  }, [tallasSel, coloresSeleccionados, tallasOrdenadas]);

  const variantesOrdenadas = useMemo(() => {
    const arr = [...variantes];
    arr.sort((a, b) => {
      const ra = tallaRank[a.talla] ?? 99;
      const rb = tallaRank[b.talla] ?? 99;
      if (ordenVar === "TALLA") return ra - rb || a.color.localeCompare(b.color);
      if (ordenVar === "COLOR") return a.color.localeCompare(b.color) || ra - rb;
      if (ordenVar === "STOCK") return b.stockActual - a.stockActual || ra - rb;
      return Number(b.activa) - Number(a.activa) || ra - rb;
    });
    return arr;
  }, [variantes, ordenVar]);

  const coloresUsados = useMemo(() => {
    const byId = new Map(coloresAll.map((c) => [c.id, c]));
    const usados = new Map<string, { id: string; nombre: string; hex: string | null }>();
    for (const v of variantes) {
      const c = byId.get(v.colorId);
      if (c) usados.set(c.id, c);
    }
    return Array.from(usados.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [variantes, coloresAll]);

  const gruposPorTalla = useMemo(() => {
    type GrupoTalla = {
      talla: string;
      tallaOrden: number;
      totalVariantes: number;
      totalStock: number;
      totalStockActivo: number;
      items: typeof variantes;
    };
    const map = new Map<string, GrupoTalla>();
    for (const v of variantesOrdenadas) {
      const tallaNombre = v.talla;
      const tallaOrden = tallaRank[tallaNombre] ?? 99;
      if (!map.has(tallaNombre)) {
        map.set(tallaNombre, {
          talla: tallaNombre,
          tallaOrden,
          totalVariantes: 0,
          totalStock: 0,
          totalStockActivo: 0,
          items: [],
        });
      }
      const g = map.get(tallaNombre)!;
      g.totalVariantes += 1;
      g.totalStock += v.stockActual;
      if (v.activa) g.totalStockActivo += v.stockActual;
      g.items.push(v);
    }
    const tallas = [...map.values()].sort((a, b) => a.tallaOrden - b.tallaOrden || a.talla.localeCompare(b.talla));
    for (const t of tallas) t.items.sort((a, b) => a.color.localeCompare(b.color));
    return tallas;
  }, [variantesOrdenadas, tallaRank]);

  // ------ API ACTIONS ------

  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault();
    
    // Validación de conflicto
    if (!descuentoVigente && descuentoActivo) {
       if (!descuentoInicio || !descuentoFin) {
           showToast("Ingresa fechas para el descuento.", "error");
           return;
       }
       const manualStart = descuentoInicio;
       const manualEnd = descuentoFin;
       const conflicto = initialData.descuentosHistorial.find(d => {
           if (d.estado === 'CANCELADO') return false;
           const progStart = new Date(d.startsAt).toISOString().split('T')[0];
           const progEnd = new Date(d.endsAt).toISOString().split('T')[0];
           return manualStart <= progEnd && manualEnd >= progStart;
       });
       if (conflicto) {
           showToast(`Conflicto con campaña del ${new Date(conflicto.startsAt).toLocaleDateString()}`, "error");
           return;
       }
    }

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre, descripcion, precio, estado, destacado, categoriaId: categoriaId || null,
        descuentoActivo: !descuentoVigente && descuentoActivo,
        descuentoTipo: !descuentoVigente && descuentoActivo ? descuentoTipo : null,
        descuentoValor: !descuentoVigente && descuentoActivo ? descuentoValor : null,
        descuentoInicio: !descuentoVigente && descuentoActivo ? descuentoInicio : null,
        descuentoFin: !descuentoVigente && descuentoActivo ? descuentoFin : null,
      }),
    });

    if (!r.ok) {
      const d = await leerJson(r);
      showToast(d?.error ?? "Error al guardar", "error");
      return;
    }
    router.refresh(); 
    showToast("Producto guardado correctamente");
  }

  // ✅ Función para eliminar descuento (Ahora disponible para el formulario superior)
  async function eliminarDescuento(id: string) {
    if (!confirm("¿Deseas cancelar o eliminar este descuento?")) return;
    try {
      const res = await fetch(`/api/admin/descuentos/${id}`, { method: "DELETE" });
      if (res.ok) {
          router.refresh();
          showToast("Descuento eliminado/cancelado");
      }
      else showToast("Error al eliminar", "error");
    } catch { showToast("Error", "error"); }
  }

  async function crearVariantes() {
    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tallaIds: tallasSel, colorIds: coloresSel }),
    });
    if (!r.ok) { const d = await leerJson(r); showToast(d?.error ?? "Error al crear variantes", "error"); return; }
    
    setTallasSel([]); setColoresSel([]);
    const r2 = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`);
    const nuevasRaw = await r2.json().catch(() => []);
    const mapHex = new Map(coloresAll.map((c) => [c.id, c.hex ?? null]));
    const nuevas = (Array.isArray(nuevasRaw) ? nuevasRaw : []).map((v: any) => ({
      ...v,
      colorHex: v.colorHex ?? mapHex.get(v.colorId) ?? null,
    }));
    setVariantes(nuevas);
    showToast("Variantes creadas");
  }

  async function ajustarStock(varianteId: string, cambioCantidad: number, nota?: string) {
    const r = await fetch(`/api/admin/variantes/${varianteId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cambioCantidad, nota }),
    });
    if (!r.ok) { showToast("Error al ajustar stock", "error"); return; }
    setVariantes((prev) => prev.map((v) => (v.id === varianteId ? { ...v, stockActual: v.stockActual + cambioCantidad } : v)));
    router.refresh();
    showToast("Stock actualizado");
  }

  async function cambiarActiva(varianteId: string, activa: boolean) {
    const r = await fetch(`/api/admin/variantes/${varianteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa }),
    });
    if (r.ok) {
        setVariantes((prev) => prev.map((v) => (v.id === varianteId ? { ...v, activa } : v)));
        showToast(activa ? "Variante visible" : "Variante ocultada");
    } else {
        showToast("Error al cambiar estado", "error");
    }
  }

  async function subirImagen(file: File) {
    setSubiendo(true);
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes`, { method: "POST", body: fd });
    const d = await leerJson(r);
    setSubiendo(false);
    if (r.ok) {
        setImagenes((prev) => [...prev, { id: d.id, url: d.url, esPortada: d.esPortada, orden: d.orden }]);
        showToast("Imagen subida");
    } else {
        showToast("Error al subir imagen", "error");
    }
  }

  async function eliminarImagen(id: string) {
    const r = await fetch(`/api/admin/imagenes/${id}`, { method: "DELETE" });
    if (r.ok) {
        setImagenes((prev) => prev.filter((x) => x.id !== id));
        showToast("Imagen eliminada");
    } else {
        showToast("Error al eliminar imagen", "error");
    }
  }

  async function ponerPortada(id: string) {
    const r = await fetch(`/api/admin/imagenes/${id}/portada`, { method: "PATCH" });
    if (r.ok) {
        setImagenes((prev) => prev.map((x) => ({ ...x, esPortada: x.id === id })));
        showToast("Portada actualizada");
    } else {
        showToast("Error al cambiar portada", "error");
    }
  }

  const combinaciones = tallasSel.length * coloresSel.length;

  // ✅ Filtramos el historial para NO mostrar la campaña activa (ya que está arriba)
  const historialFiltrado = initialData.descuentosHistorial.filter(d => 
    !descuentoVigente || d.id !== descuentoVigente.id
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto relative">
      {/* ✅ TOAST NOTIFICATION */}
      {toast && (
          <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-2xl text-white font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999] flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
              <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
              {toast.msg}
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">EDITAR PRODUCTO</h1>
            {descuentoVigente && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200 animate-pulse">
                🏷️ Oferta Activa
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
             SKU: <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{initialData.producto.id}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Stock Total</p>
          <p className="text-3xl font-bold text-gray-900">{stockTotalActivo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA */}
        <div className="xl:col-span-2 space-y-8">
          <form onSubmit={guardarProducto} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="font-semibold text-lg border-b pb-2 text-gray-800">Detalles Generales</h2>
            
            <div className="space-y-4">
              {/* ... Campos básicos ... */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input className="w-full border rounded-md px-3 py-2 text-gray-900 focus:ring-black/5 outline-none" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea className="w-full border rounded-md px-3 py-2 h-24 text-gray-900 focus:ring-black/5 outline-none" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Precio Base (S/)</label>
                  <input type="number" step="0.01" className="w-full border rounded-md px-3 py-2 text-gray-900" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <select className="w-full border rounded-md px-3 py-2 text-gray-900 bg-white" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Categoría</label>
                  <select className="w-full border rounded-md px-3 py-2 text-gray-900 bg-white" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                    <option value="">Sin categoría</option>
                    {initialData.referencias.categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="destacado" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} className="rounded border-gray-300 text-black focus:ring-black" />
                <label htmlFor="destacado" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Destacado en portada</label>
              </div>

              {/* SECCIÓN DESCUENTO MANUAL */}
              <div className={`p-4 rounded-lg border space-y-3 mt-2 ${descuentoVigente ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                 <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={descuentoActivo} 
                        onChange={(e) => !descuentoVigente && setDescuentoActivo(e.target.checked)} 
                        disabled={!!descuentoVigente}
                        className="rounded border-gray-300 text-black focus:ring-black disabled:opacity-50" 
                      />
                      {descuentoVigente ? "Oferta Programada ACTIVA (Modo Lectura)" : "Aplicar Descuento Manual"}
                    </label>
                    {precioFinal !== null && (
                       <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                         Final: {soles(precioFinal)}
                       </span>
                    )}
                 </div>

                 {/* ✅ Mensaje + Botón de Cancelar para la campaña activa (que hemos ocultado de la lista) */}
                 {descuentoVigente && (
                   <div className="flex items-center justify-between text-xs text-blue-700 mb-2 bg-blue-100/50 p-2 rounded">
                     <span>ℹ️ Hay una campaña activa gestionada desde el módulo <b>Descuentos</b>.</span>
                     <button 
                        type="button" 
                        onClick={() => eliminarDescuento(descuentoVigente.id)}
                        className="text-red-600 hover:text-red-800 font-bold underline px-2"
                     >
                        Cancelar Campaña
                     </button>
                   </div>
                 )}

                {descuentoActivo && (
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${descuentoVigente ? 'opacity-70 pointer-events-none' : ''}`}>
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">Tipo</label>
                      <select className="w-full border rounded text-sm p-2 bg-white" value={descuentoTipo} onChange={(e) => setDescuentoTipo(e.target.value as any)}>
                        <option value="PORCENTAJE">Porcentaje</option>
                        <option value="MONTO">Monto Fijo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">Valor</label>
                      <input className="w-full border rounded text-sm p-2" value={descuentoValor} onChange={(e) => setDescuentoValor(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">Inicio</label>
                      <input type="date" className="w-full border rounded text-sm p-2 bg-white" value={descuentoInicio} onChange={(e) => setDescuentoInicio(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">Fin</label>
                      <input type="date" className="w-full border rounded text-sm p-2 bg-white" value={descuentoFin} onChange={(e) => setDescuentoFin(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button type="submit" className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition shadow-sm">
                Guardar Cambios
              </button>
            </div>
          </form>

          {/* ✅ Pasamos el historial filtrado y la función de eliminar */}
          <HistorialDescuentos 
             historial={historialFiltrado} 
             onEliminar={eliminarDescuento} 
          />

          {/* GESTIÓN DE VARIANTES (Igual) */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="font-semibold text-lg text-gray-800">Variantes y Stock</h2>
               <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {tallasSel.length} tallas · {coloresSel.length} colores seleccionados
               </div>
            </div>
            {/* ... Selectores ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">1. Selecciona Tallas</p>
                  <div className="flex flex-wrap gap-2">
                     {tallasOrdenadas.map((t) => {
                        const selected = tallasSel.includes(t.id);
                        return <button key={t.id} type="button" onClick={() => setTallasSel((s) => toggle(s, t.id))} className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${selected ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>{t.nombre}</button>;
                     })}
                  </div>
               </div>
               <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">2. Selecciona Colores</p>
                  <input className="text-xs border rounded-md px-2 py-1 focus:ring-1 focus:ring-black outline-none w-32" placeholder="Filtrar..." value={qColor} onChange={e => setQColor(e.target.value)} />
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 pr-2 custom-scrollbar">
                     {coloresSeleccionados.map((c) => <button key={c.id} type="button" onClick={() => setColoresSel((s) => toggle(s, c.id))} className="pl-1 pr-3 py-1 rounded-full border text-xs flex items-center gap-2 bg-black text-white border-black shadow-sm"><span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: c.hex ?? '#fff' }} />{c.nombre}</button>)}
                     {coloresNoSeleccionadosFiltrados.map((c) => <button key={c.id} type="button" onClick={() => setColoresSel((s) => toggle(s, c.id))} className="pl-1 pr-3 py-1 rounded-full border text-xs flex items-center gap-2 bg-white text-gray-700 border-gray-200 hover:bg-gray-50"><span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.hex ?? '#fff' }} />{c.nombre}</button>)}
                  </div>
               </div>
            </div>
            <div className="flex items-center justify-between border-t pt-5 mt-2">
               <button type="button" onClick={crearVariantes} disabled={combinaciones === 0} className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-gray-800 disabled:opacity-50 transition-all">Generar Combinaciones</button>
            </div>
            <div className="border rounded-xl overflow-hidden bg-gray-50/50">
               {gruposPorTalla.length === 0 ? <div className="p-10 text-center text-gray-400 text-sm">No hay variantes creadas.</div> : 
                  <div className="divide-y divide-gray-200">
                     {gruposPorTalla.map((grupo) => (
                        <details key={grupo.talla} className="group bg-white" open>
                           <summary className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors list-none">
                              <span className="font-semibold text-gray-900">Talla {grupo.talla}</span>
                           </summary>
                           <div className="border-t border-gray-100">
                              <table className="w-full text-sm text-left">
                                 <tbody className="divide-y divide-gray-50">
                                    {grupo.items.map((variante) => (
                                        <FilaVarianteAgrupada 
                                            key={variante.id} 
                                            row={variante} 
                                            onAjustar={ajustarStock} 
                                            onCambiarActiva={cambiarActiva} 
                                            onPreviewColor={setPreviewColor}
                                        />
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </details>
                     ))}
                  </div>
               }
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (Media) */}
        <div className="space-y-8">
           {/* ... Galería General (código existente) ... */}
           <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold border-b pb-2 text-gray-800">Galería General</h3>
              <div className="grid grid-cols-2 gap-3">
                 {imagenes.sort((a,b) => Number(b.esPortada) - Number(a.esPortada)).map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-50">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={img.url} alt="" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setPreviewImage(img.url)} />
                       {img.esPortada && <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm pointer-events-none">Portada</span>}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px] pointer-events-none">
                          <div className="pointer-events-auto flex flex-col gap-2">
                             {!img.esPortada && <button onClick={() => ponerPortada(img.id)} className="text-xs bg-white text-black font-medium px-3 py-1.5 rounded-full hover:bg-gray-100">Hacer Portada</button>}
                             <button onClick={() => eliminarImagen(img.id)} className="text-xs bg-red-500 text-white font-medium px-3 py-1.5 rounded-full hover:bg-red-600">Eliminar</button>
                          </div>
                       </div>
                    </div>
                 ))}
                 <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all group">
                    <span className="text-xs font-medium text-gray-400 group-hover:text-black">{subiendo ? '...' : 'Añadir Foto'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; subirImagen(f); }}} />
                 </label>
              </div>
           </div>

           {/* ... Fotos por Color (código existente) ... */}
           <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold border-b pb-2 text-gray-800">Fotos por Color</h3>
              <div className="space-y-3">
                 {coloresUsados.length === 0 && <div className="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded-lg">Crea variantes con color primero.</div>}
                 {coloresUsados.map((c) => {
                    const img = imagenesColor.find(x => x.colorId === c.id);
                    return (
                       <div key={c.id} className="flex items-center gap-3 p-2 border rounded-lg hover:border-gray-300 transition-colors bg-gray-50/30">
                          <div className={`w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0 relative border shadow-sm ${img ? 'cursor-zoom-in hover:opacity-90' : ''}`} onClick={() => img && setPreviewImage(img.url)}>
                             {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img.url} className="w-full h-full object-cover" alt="" />
                             ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50"><span className="text-[10px]">Sin foto</span></div>
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: c.hex ?? '#fff' }} />
                                <span className="text-sm font-semibold text-gray-900 truncate">{c.nombre}</span>
                             </div>
                             <label className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1">
                                {img ? '↺ Cambiar' : '+ Subir'}
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                   const f = e.target.files?.[0]; if (!f) return;
                                   const fd = new FormData(); fd.append("colorId", c.id); fd.append("file", f);
                                   const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes-color`, { method: "POST", body: fd });
                                   if (r.ok) { const d = await r.json(); setImagenesColor(prev => { const idx = prev.findIndex(x => x.colorId === c.id); if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], url: d.url }; return copy; } return [...prev, { id: d.id, url: d.url, colorId: c.id, colorNombre: c.nombre, colorHex: c.hex ?? null }]; }); showToast("Imagen actualizada");}
                                }} />
                             </label>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      </div>

      {/* ✅ MODAL DE VISTA PREVIA DE IMAGEN */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
           <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full" onClick={() => setPreviewImage(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={previewImage} alt="Vista previa" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ✅ MODAL DE VISTA PREVIA DE COLOR */}
      {previewColor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewColor(null)}>
           <div 
             className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 flex flex-col items-center gap-4 relative"
             onClick={(e) => e.stopPropagation()}
           >
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-2" onClick={() => setPreviewColor(null)}>✕</button>
              
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg ring-1 ring-gray-100" style={{ backgroundColor: previewColor.hex ?? '#fff' }} />
              
              <div className="text-center">
                 <h3 className="text-xl font-bold text-gray-900">{previewColor.nombre}</h3>
                 <p className="text-sm text-gray-500 font-mono mt-1 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest border">
                   {previewColor.hex || "Sin Hex"}
                 </p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function FilaVarianteAgrupada({ row, onAjustar, onCambiarActiva, onPreviewColor }: any) {
  const [ajuste, setAjuste] = useState("");
  return (
    <tr className="hover:bg-blue-50/50 transition-colors group">
      <td className="px-6 py-3">
         <div className="flex items-center gap-3">
            {/* ✅ Botón para ver color */}
            <button 
                type="button"
                onClick={() => onPreviewColor({ nombre: row.color, hex: row.colorHex })}
                className="w-6 h-6 rounded-full border shadow-sm ring-2 ring-transparent hover:ring-black/20 hover:scale-110 transition-all cursor-zoom-in" 
                style={{ backgroundColor: row.colorHex ?? '#fff' }} 
                title="Ver color"
            />
            <span 
                className="text-gray-900 font-medium cursor-pointer hover:underline hover:text-blue-600"
                onClick={() => onPreviewColor({ nombre: row.color, hex: row.colorHex })}
            >
                {row.color}
            </span>
         </div>
      </td>
      <td className="px-6 py-3 text-center">{row.stockActual}</td>
      <td className="px-6 py-3 text-right">
         <div className="flex items-center justify-end gap-2">
            <input className="w-16 border rounded-md text-xs px-2 py-1.5 text-center" placeholder="+/-" value={ajuste} onChange={e => setAjuste(e.target.value)} />
            <button onClick={() => { onAjustar(row.id, Number(ajuste)); setAjuste(""); }} className="text-xs bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!ajuste}>Ajustar</button>
         </div>
      </td>
      <td className="px-6 py-3 text-center">
         {/* ✅ Switch Visual para Activar/Desactivar */}
         <button 
             onClick={() => onCambiarActiva(row.id, !row.activa)}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${row.activa ? 'bg-green-500' : 'bg-gray-200'}`}
             title={row.activa ? "Visible en catálogo" : "Oculto en catálogo"}
         >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${row.activa ? 'translate-x-6' : 'translate-x-1'}`} />
         </button>
      </td>
    </tr>
  );
}

// ✅ SOLO MUESTRA HISTORIAL (Eliminada la opción de crear)
function HistorialDescuentos({ historial, onEliminar }: { historial: DescuentoItem[], onEliminar: (id: string) => void }) {
  const listaOrdenada = [...historial].sort((a,b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  if (listaOrdenada.length === 0) return null;

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-4 mb-4">Historial de Campañas Pasadas</h4>
      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {listaOrdenada.map((desc) => {
          const now = new Date();
          const start = new Date(desc.startsAt);
          const end = new Date(desc.endsAt);
          end.setHours(23, 59, 59, 999);
          
          const isActive = now >= start && now <= end && desc.estado !== 'CANCELADO';
          const isFuture = now < start && desc.estado !== 'CANCELADO';
          const isCancelled = desc.estado === 'CANCELADO';

          // Estilo condicional
          let borderClass = 'border-gray-200';
          let bgClass = 'bg-white';
          
          if (isActive) { borderClass = 'border-green-200'; bgClass = 'bg-green-50'; }
          if (isCancelled) { borderClass = 'border-red-100'; bgClass = 'bg-red-50/50 opacity-70'; }
          
          return (
            <div key={desc.id} className={`flex items-center justify-between p-4 rounded-xl border ${borderClass} ${bgClass}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-white text-xs ${isActive ? 'bg-green-600' : isFuture ? 'bg-blue-500' : isCancelled ? 'bg-red-400' : 'bg-gray-400'}`}>
                   {desc.tipo === "PORCENTAJE" ? "%" : "S/"}
                </div>
                <div>
                   <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isCancelled ? 'line-through text-gray-500' : 'text-gray-900'}`}>{desc.tipo === "PORCENTAJE" ? `-${desc.valor}%` : `-S/ ${desc.valor}`}</span>
                      {isActive && <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded-full font-bold">ACTIVO</span>}
                      {isFuture && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 rounded-full font-bold">PROGRAMADO</span>}
                      {isCancelled && <span className="text-[10px] bg-red-100 text-red-700 px-2 rounded-full font-bold">CANCELADO</span>}
                   </div>
                   <div className="text-xs text-gray-500 mt-1">
                     {start.toLocaleDateString()} ➜ {end.toLocaleDateString()}
                   </div>
                </div>
              </div>
              {!isCancelled && (
                 <button onClick={() => onEliminar(desc.id)} className="text-gray-400 hover:text-red-600 p-2" title="Cancelar/Eliminar">🗑️</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}