"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Data = {
  producto: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: string;
    estado: "ACTIVO" | "INACTIVO";
    destacado: boolean;
    categoriaId: string;

    // ✅ descuentos
    descuentoActivo: boolean;
    descuentoTipo: "PORCENTAJE" | "MONTO";
    descuentoValor: string;
    descuentoInicio: string; // YYYY-MM-DD
    descuentoFin: string; // YYYY-MM-DD
  };

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

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (!Number.isFinite(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function ProductoEditor({ initialData }: { initialData: Data }) {
  const router = useRouter();

  // ====== FORM PRODUCTO ======
  const [nombre, setNombre] = useState(initialData.producto.nombre);
  const [descripcion, setDescripcion] = useState(initialData.producto.descripcion);
  const [precio, setPrecio] = useState(initialData.producto.precio);
  const [estado, setEstado] = useState<Data["producto"]["estado"]>(initialData.producto.estado);
  const [destacado, setDestacado] = useState(initialData.producto.destacado);
  const [categoriaId, setCategoriaId] = useState(initialData.producto.categoriaId);

  // ✅ descuentos
  const [descuentoActivo, setDescuentoActivo] = useState(initialData.producto.descuentoActivo);
  const [descuentoTipo, setDescuentoTipo] = useState<Data["producto"]["descuentoTipo"]>(
    initialData.producto.descuentoTipo ?? "PORCENTAJE"
  );
  const [descuentoValor, setDescuentoValor] = useState(initialData.producto.descuentoValor ?? "");
  const [descuentoInicio, setDescuentoInicio] = useState(initialData.producto.descuentoInicio ?? "");
  const [descuentoFin, setDescuentoFin] = useState(initialData.producto.descuentoFin ?? "");

  // ====== UI STATE ======
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  // Selecciones para crear variantes
  const [tallasSel, setTallasSel] = useState<string[]>([]);
  const [coloresSel, setColoresSel] = useState<string[]>([]);
  const [qColor, setQColor] = useState("");

  // Orden tabla variantes
  const [ordenVar, setOrdenVar] = useState<"TALLA" | "COLOR" | "STOCK" | "ESTADO">("TALLA");

  // Data dinámica
  const [variantes, setVariantes] = useState(initialData.variantes);
  const [imagenes, setImagenes] = useState(initialData.imagenes);
  const [imagenesColor, setImagenesColor] = useState(initialData.imagenesColor);

  useEffect(() => setVariantes(initialData.variantes), [initialData.variantes]);
  useEffect(() => setImagenes(initialData.imagenes), [initialData.imagenes]);
  useEffect(() => setImagenesColor(initialData.imagenesColor), [initialData.imagenesColor]);

  // ====== HELPERS / MEMOS ======
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

  // Orden de tallas XS - S - Standar - M - L - XL
  const tallaRank: Record<string, number> = {
    XS: 1,
    S: 2,
    Standar: 3,
    M: 4,
    L: 5,
    XL: 6,
  };

  const tallasOrdenadas = useMemo(() => {
    return [...initialData.referencias.tallas].sort((a, b) => {
      const ra = tallaRank[a.nombre] ?? 99;
      const rb = tallaRank[b.nombre] ?? 99;
      return ra - rb || a.nombre.localeCompare(b.nombre);
    });
  }, [initialData.referencias.tallas]);

  const coloresAll = initialData.referencias.colores;

  // Colores seleccionados (siempre visibles)
  const coloresSeleccionados = useMemo(() => {
    const sel = new Set(coloresSel);
    return coloresAll.filter((c) => sel.has(c.id));
  }, [coloresAll, coloresSel]);

  // Colores no seleccionados filtrados (búsqueda por nombre o hex)
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

    return base
      .filter((c) => !sel.has(c.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [coloresAll, coloresSel, qColor]);

  // Vista previa combinaciones a crear
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

  // Variantes ordenadas (selector)
  const variantesOrdenadas = useMemo(() => {
    const arr = [...variantes];

    arr.sort((a, b) => {
      const ra = tallaRank[a.talla] ?? 99;
      const rb = tallaRank[b.talla] ?? 99;

      if (ordenVar === "TALLA") {
        return ra - rb || a.color.localeCompare(b.color);
      }

      if (ordenVar === "COLOR") {
        return a.color.localeCompare(b.color) || ra - rb;
      }

      if (ordenVar === "STOCK") {
        return b.stockActual - a.stockActual || ra - rb || a.color.localeCompare(b.color);
      }

      // ESTADO
      return Number(b.activa) - Number(a.activa) || ra - rb || a.color.localeCompare(b.color);
    });

    return arr;
  }, [variantes, ordenVar]);

  // ✅ Colores usados SOLO por variantes del producto (para Producto-Color)
  const coloresUsados = useMemo(() => {
    const byId = new Map(coloresAll.map((c) => [c.id, c]));
    const usados = new Map<string, { id: string; nombre: string; hex: string | null }>();

    for (const v of variantes) {
      const c = byId.get(v.colorId);
      if (c) usados.set(c.id, c);
    }

    return Array.from(usados.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [variantes, coloresAll]);

  function Swatch({ hex, size = 14 }: { hex: string | null; size?: number }) {
  const valido = typeof hex === "string" && /^#([0-9a-fA-F]{6})$/.test(hex.trim());
  const bg = valido ? hex!.trim() : null;

  return (
    <span
      className="inline-block rounded border"
      style={{
        width: size,
        height: size,
        backgroundColor: bg ?? "transparent",
        borderColor: "rgba(255,255,255,.25)",
      }}
      title={bg ? bg : "Sin HEX"}
    />
  );
}

type GrupoTalla = {
  talla: string;
  tallaOrden: number;
  totalVariantes: number;
  totalStock: number;
  totalStockActivo: number;
  items: Array<{
    id: string;
    color: string;
    hex: string | null;
    stockActual: number;
    activa: boolean;
  }>;
};

const gruposPorTalla = useMemo(() => {
  const map = new Map<string, GrupoTalla>();

  // si quieres que el orden responda al selector (TALLA/COLOR/etc), usa variantesOrdenadas
  const base = variantesOrdenadas;

  for (const v of base) {
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

    g.items.push({
      id: v.id,
      color: v.color,
      hex: v.colorHex ?? null,
      stockActual: v.stockActual,
      activa: v.activa,
    });
  }

  // ordenar tallas por tu ranking
  const tallas = [...map.values()].sort((a, b) => {
    return a.tallaOrden - b.tallaOrden || a.talla.localeCompare(b.talla);
  });

  // ordenar colores dentro de cada talla
  for (const t of tallas) {
    t.items.sort((a, b) => a.color.localeCompare(b.color));
  }

  return tallas;
}, [variantesOrdenadas, tallaRank]);


  // ====== API HELPERS ======
  async function leerJson(r: Response) {
    return await r.json().catch(() => ({}));
  }

  // ====== ACTIONS ======
  async function guardarProducto(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        descripcion,
        precio,
        estado,
        destacado,
        categoriaId: categoriaId || null,

        descuentoActivo,
        descuentoTipo: descuentoActivo ? descuentoTipo : null,
        descuentoValor: descuentoActivo ? descuentoValor : null,
        descuentoInicio: descuentoActivo ? descuentoInicio : null,
        descuentoFin: descuentoActivo ? descuentoFin : null,
      }),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error al guardar");
      return;
    }

    router.push("/admin/productos");
  }

  async function crearVariantes() {
    setError(null);

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tallaIds: tallasSel, colorIds: coloresSel }),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error al crear variantes");
      return;
    }

    // limpiar selección
    setTallasSel([]);
    setColoresSel([]);

    // refrescar variantes y asegurar colorHex
    const r2 = await fetch(`/api/admin/productos/${initialData.producto.id}/variantes`);
    const nuevasRaw = await r2.json().catch(() => []);

    const mapHex = new Map(coloresAll.map((c) => [c.id, c.hex ?? null]));

    const nuevas = (Array.isArray(nuevasRaw) ? nuevasRaw : []).map((v: any) => ({
      ...v,
      colorHex: v.colorHex ?? mapHex.get(v.colorId) ?? null,
    }));

    setVariantes(nuevas);
  }

  async function ajustarStock(varianteId: string, cambioCantidad: number, nota?: string) {
    setError(null);

    const r = await fetch(`/api/admin/variantes/${varianteId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cambioCantidad, nota }),
    });

    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error al ajustar stock");
      return;
    }

    setVariantes((prev) => prev.map((v) => (v.id === varianteId ? { ...v, stockActual: d.stockActual } : v)));
  }

  async function cambiarActiva(varianteId: string, activa: boolean) {
    setError(null);

    const r = await fetch(`/api/admin/variantes/${varianteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa }),
    });

    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error al cambiar estado");
      return;
    }

    setVariantes((prev) => prev.map((v) => (v.id === varianteId ? { ...v, activa: d.activa } : v)));
  }

  // IMÁGENES PRODUCTO
  async function subirImagen(file: File) {
    setError(null);
    setSubiendo(true);

    const fd = new FormData();
    fd.append("file", file);

    const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes`, {
      method: "POST",
      body: fd,
    });

    const d = await leerJson(r);
    setSubiendo(false);

    if (!r.ok) {
      setError(d?.error ?? "Error subiendo imagen");
      return;
    }

    setImagenes((prev) => [...prev, { id: d.id, url: d.url, esPortada: d.esPortada, orden: d.orden }]);
  }

  async function eliminarImagen(id: string) {
    setError(null);

    const r = await fetch(`/api/admin/imagenes/${id}`, { method: "DELETE" });
    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error eliminando imagen");
      return;
    }

    setImagenes((prev) => prev.filter((x) => x.id !== id));
  }

  async function ponerPortada(id: string) {
    setError(null);

    const r = await fetch(`/api/admin/imagenes/${id}/portada`, { method: "PATCH" });
    const d = await leerJson(r);

    if (!r.ok) {
      setError(d?.error ?? "Error marcando portada");
      return;
    }

    setImagenes((prev) => prev.map((x) => ({ ...x, esPortada: x.id === id })));
  }

  // ====== RENDER ======
  const combinaciones = tallasSel.length * coloresSel.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">EDITAR PRODUCTO</h1>
        <p className="text-sm opacity-80">
          STOCK TOTAL - ACTIVO: <b>{stockTotalActivo}</b>
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* FORM PRODUCTO */}
      <form onSubmit={guardarProducto} className="border rounded-xl p-4 space-y-4 max-w-2xl">
        <div className="space-y-1">
          <label className="text-sm">Nombre</label>
          <input className="w-full border rounded-md px-3 py-2" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Descripción</label>
          <textarea className="w-full border rounded-md px-3 py-2" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Precio (S/)</label>
            <input className="w-full border rounded-md px-3 py-2" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Estado</label>
            <select className="w-full border rounded-md px-3 py-2" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Categoría</label>
            <select className="w-full border rounded-md px-3 py-2" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sin categoría</option>
              {initialData.referencias.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
          Destacado
        </label>

        {/* ✅ DESCUENTOS */}
        <div className="border rounded-xl p-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={descuentoActivo} onChange={(e) => setDescuentoActivo(e.target.checked)} />
            Activar descuento
          </label>

          {descuentoActivo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-sm">Tipo</label>
                <select className="w-full border rounded-md px-3 py-2" value={descuentoTipo} onChange={(e) => setDescuentoTipo(e.target.value as any)}>
                  <option value="PORCENTAJE">PORCENTAJE</option>
                  <option value="MONTO">MONTO</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm">Valor</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={descuentoValor}
                  onChange={(e) => setDescuentoValor(e.target.value)}
                  placeholder={descuentoTipo === "PORCENTAJE" ? "Ej: 10" : "Ej: 5.00"}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Inicio</label>
                <input type="date" className="w-full border rounded-md px-3 py-2" value={descuentoInicio} onChange={(e) => setDescuentoInicio(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Fin</label>
                <input type="date" className="w-full border rounded-md px-3 py-2" value={descuentoFin} onChange={(e) => setDescuentoFin(e.target.value)} />
              </div>
            </div>
          )}

          <p className="text-sm opacity-80">
            Precio final: <b>{precioFinal === null ? "—" : soles(precioFinal)}</b>
          </p>
        </div>

        <button className="bg-black text-white rounded-md px-4 py-2">Guardar</button>
      </form>

      {/* IMÁGENES */}
      <div className="border rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold">IMÁGENES</h2>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirImagen(f);
              e.currentTarget.value = "";
            }}
          />
          {subiendo && <span className="text-sm opacity-80">Subiendo...</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {imagenes
            .slice()
            .sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden)
            .map((img) => (
              <div key={img.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-square bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="imagen" className="w-full h-full object-cover" />
                </div>
                <div className="p-2 flex items-center justify-between text-sm">
                  <button className="underline" type="button" onClick={() => ponerPortada(img.id)}>
                    {img.esPortada ? "Portada" : "Hacer portada"}
                  </button>
                  <button className="underline" type="button" onClick={() => eliminarImagen(img.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
        </div>

        {imagenes.length === 0 && <p className="text-sm opacity-80">Aún no hay imágenes. Sube una portada.</p>}
      </div>

      {/* CREAR VARIANTES */}
      <div className="border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">CREAR VARIANTES</h2>
            <p className="text-sm opacity-70">Selecciona tallas y colores para generar combinaciones.</p>
          </div>

          <div className="text-right">
            <div className="text-sm opacity-80">
              Seleccionadas: <b>{tallasSel.length}</b> tallas · <b>{coloresSel.length}</b> colores
            </div>
            <div className="text-sm opacity-80">
              Combinaciones: <b>{combinaciones}</b>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TALLAS */}
          <div className="border rounded-xl p-3 space-y-2">
            <p className="text-sm font-semibold">Tallas</p>

            <div className="flex flex-wrap gap-2">
              {tallasOrdenadas.map((t) => {
                const selected = tallasSel.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTallasSel((s) => toggle(s, t.id))}
                    aria-pressed={selected}
                    className={[
                      "px-3 py-1.5 rounded-full border text-sm transition flex items-center gap-2",
                      "hover:border-white/70 hover:bg-white/5",
                      selected
                        ? "bg-white text-black border-white ring-2 ring-white/60 ring-offset-2 ring-offset-black shadow"
                        : "border-white/30 text-white",
                    ].join(" ")}
                  >
                    <span className="font-medium">{t.nombre}</span>
                    {selected ? <span className="text-[10px] font-bold bg-black text-white rounded-full px-1">✓</span> : null}
                  </button>
                );
              })}
            </div>

            {tallasSel.length > 0 && (
              <button type="button" className="text-xs underline opacity-80 hover:opacity-100" onClick={() => setTallasSel([])}>
                Limpiar tallas
              </button>
            )}
          </div>

          {/* COLORES */}
          <div className="border rounded-xl p-3 space-y-2">
            {/* Header compacto */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Colores</p>
              <span className="text-xs opacity-60">
                ({coloresSel.length} sel · {coloresNoSeleccionadosFiltrados.length + coloresSeleccionados.length} visibles)
              </span>

              <div className="ml-auto w-56">
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent outline-none
                            focus:border-white/70 focus:ring-2 focus:ring-white/20"
                  placeholder="Buscar color o HEX..."
                  value={qColor}
                  onChange={(e) => setQColor(e.target.value)}
                />
              </div>
            </div>

            {/* Seleccionados */}
            {coloresSeleccionados.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide opacity-60">Seleccionados</p>
                <div className="flex flex-wrap gap-2">
                  {coloresSeleccionados
                    .slice()
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColoresSel((s) => toggle(s, c.id))}
                        className="px-3 py-1.5 rounded-full border text-sm flex items-center gap-2 transition
                                  bg-white text-black border-white ring-2 ring-white/60 ring-offset-2 ring-offset-black shadow"
                        title={c.hex ?? ""}
                      >
                        <span className="w-4 h-4 rounded-md border border-black/20" style={{ backgroundColor: c.hex ?? "#ffffff" }} />
                        <span className="font-medium">{c.nombre}</span>
                        {c.hex ? <span className="text-xs text-black/60">{c.hex}</span> : null}
                        <span className="text-[10px] font-bold bg-black text-white rounded-full px-1">✓</span>
                      </button>
                    ))}
                </div>

                <button type="button" className="text-xs underline opacity-80 hover:opacity-100" onClick={() => setColoresSel([])}>
                  Limpiar colores
                </button>
              </div>
            )}

            {/* Resultados */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Resultados {qColor.trim() ? "del filtro" : "disponibles"}</p>

              <div className="flex flex-wrap gap-2">
                {coloresNoSeleccionadosFiltrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColoresSel((s) => toggle(s, c.id))}
                    className="px-3 py-1.5 rounded-full border text-sm flex items-center gap-2 transition
                              border-white/30 text-white hover:border-white/70 hover:bg-white/5"
                    title={c.hex ?? ""}
                  >
                    <span className="w-4 h-4 rounded-md border border-white/30" style={{ backgroundColor: c.hex ?? "#ffffff" }} />
                    <span className="font-medium">{c.nombre}</span>
                    {c.hex ? <span className="text-xs text-white/60">{c.hex}</span> : null}
                  </button>
                ))}

                {coloresNoSeleccionadosFiltrados.length === 0 && <p className="text-sm opacity-70">No hay resultados para “{qColor}”.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="border rounded-xl p-3 bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Vista previa</p>
            <p className="text-sm opacity-80">
              Total a crear: <b>{previewCombos.total}</b>
              {previewCombos.total > previewCombos.limit ? <span className="opacity-70"> · mostrando {previewCombos.limit}</span> : null}
            </p>
          </div>

          {previewCombos.total === 0 ? (
            <p className="text-sm opacity-70 mt-2">Selecciona al menos 1 talla y 1 color.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewCombos.items.map((x, idx) => (
                <span key={`${x.talla}-${x.color}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-sm">
                  <span className="font-medium">{x.talla}</span>
                  <span className="opacity-60">·</span>
                  <span className="w-3.5 h-3.5 rounded border border-white/30" style={{ backgroundColor: x.hex ?? "#ffffff" }} title={x.hex ?? ""} />
                  <span>{x.color}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={crearVariantes}
          className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-60"
          disabled={combinaciones === 0}
        >
          Crear combinaciones
        </button>
      </div>

      {/* TABLA VARIANTES */}
      {/* TABLA VARIANTES (Agrupado por talla) */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Variantes</h2>
            <p className="text-sm opacity-70">Desglosado por talla → colores</p>
          </div>
        </div>

        {gruposPorTalla.length === 0 ? (
          <div className="p-4 text-sm opacity-80">Aún no hay variantes. Crea combinaciones arriba.</div>
        ) : (
          <div className="p-4 space-y-3">
            {gruposPorTalla.map((g, idx) => (
              <details
                key={g.talla}
                className="border rounded-xl overflow-hidden"
                open={idx === 0}
              >
                <summary className="list-none cursor-pointer select-none p-4 border-b flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">Talla {g.talla}</div>

                    <div className="text-sm opacity-80 mt-1">
                      Variantes: <b>{g.totalVariantes}</b> · Stock total: <b>{g.totalStock}</b> · Stock activo:{" "}
                      <b>{g.totalStockActivo}</b>
                    </div>

                    {/* mini vista de colores */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.items.slice(0, 10).map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-2 text-xs opacity-80">
                          <Swatch hex={c.hex} size={14} />
                          <span className="max-w-[140px] truncate">{c.color}</span>
                        </span>
                      ))}
                      {g.items.length > 10 ? (
                        <span className="text-xs opacity-60">+{g.items.length - 10} más</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-sm opacity-70 flex items-center gap-2 shrink-0">
                    <span>Ver colores</span>
                    <span className="opacity-60">▾</span>
                  </div>
                </summary>

                <div className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="text-left p-3">Color</th>
                        <th className="text-left p-3">Stock</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Ajuste</th>
                        <th className="text-left p-3">Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {g.items.map((c) => (
                        <FilaVarianteAgrupada
                          key={c.id}
                          row={c}
                          onAjustar={ajustarStock}
                          onCambiarActiva={cambiarActiva}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* IMÁGENES POR COLOR */}
      <div className="border rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Producto - Color</h2>

        <p className="text-sm opacity-80">
          Sube una imagen referencia del producto por color. Solo verás los colores que existen en variantes de este producto.
        </p>

        {coloresUsados.length === 0 ? (
          <div className="border rounded-xl p-4 text-sm opacity-80">
            Primero crea variantes (talla × color) para habilitar imágenes por color.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {coloresUsados.map((c) => {
              const img = imagenesColor.find((x) => x.colorId === c.id);

              return (
                <div key={c.id} className="border rounded-xl overflow-hidden">
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded border" style={{ backgroundColor: c.hex ?? "#ffffff" }} title={c.hex ?? ""} />
                      <span className="text-sm font-medium">{c.nombre}</span>
                      {c.hex ? <span className="text-xs opacity-70">{c.hex}</span> : null}
                    </div>

                    {img ? <span className="text-xs px-2 py-1 rounded-full border">Cargada</span> : <span className="text-xs px-2 py-1 rounded-full border opacity-70">Sin imagen</span>}
                  </div>

                  <div className="p-3 space-y-3">
                    <div className="aspect-square bg-black rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img?.url ? (
                        <img src={img.url} alt={`${nombre} ${c.nombre}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white/80">Sin imagen</div>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.currentTarget.value = "";
                        if (!f) return;

                        setError(null);

                        const fd = new FormData();
                        fd.append("colorId", c.id);
                        fd.append("file", f);

                        const r = await fetch(`/api/admin/productos/${initialData.producto.id}/imagenes-color`, {
                          method: "POST",
                          body: fd,
                        });

                        const d = await r.json().catch(() => ({}));
                        if (!r.ok) {
                          setError(d?.error ?? "Error subiendo imagen por color");
                          return;
                        }

                        setImagenesColor((prev) => {
                          const idx = prev.findIndex((x) => x.colorId === c.id);
                          if (idx >= 0) {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], url: d.url };
                            return copy;
                          }

                          return [...prev, { id: d.id, url: d.url, colorId: c.id, colorNombre: c.nombre, colorHex: c.hex ?? null }];
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilaVarianteAgrupada({
  row,
  onAjustar,
  onCambiarActiva,
}: {
  row: {
    id: string;
    color: string;
    hex: string | null;
    stockActual: number;
    activa: boolean;
  };
  onAjustar: (id: string, cambioCantidad: number, nota?: string) => Promise<void>;
  onCambiarActiva: (id: string, activa: boolean) => Promise<void>;
}) {
  const [cambio, setCambio] = useState("0");
  const [nota, setNota] = useState("");

  return (
    <tr className="border-t">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3.5 h-3.5 rounded border"
            style={{
              backgroundColor: row.hex ?? "#ffffff",
              borderColor: "rgba(255,255,255,.25)",
            }}
            title={row.hex ?? "Sin HEX"}
          />
          <span>{row.color}</span>
          {row.hex ? <span className="text-xs opacity-60">{row.hex}</span> : null}
        </div>
      </td>

      <td className="p-3">{row.stockActual}</td>

      <td className="p-3">
        <span className="text-sm">{row.activa ? "Activa" : "Inactiva"}</span>
      </td>

      <td className="p-3">
        <div className="flex gap-2 items-center">
          <input
            className="w-20 border rounded-md px-2 py-1"
            value={cambio}
            onChange={(e) => setCambio(e.target.value)}
          />
          <input
            className="w-40 border rounded-md px-2 py-1"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="nota (opcional)"
          />
          <button
            type="button"
            className="underline"
            onClick={() => onAjustar(row.id, Number(cambio), nota)}
          >
            Aplicar
          </button>
        </div>
      </td>

      <td className="p-3">
        <button
          type="button"
          className="underline"
          onClick={() => onCambiarActiva(row.id, !row.activa)}
        >
          {row.activa ? "Desactivar" : "Activar"}
        </button>
      </td>
    </tr>
  );
}

function FilaVariante({
  v,
  onAjustar,
  onCambiarActiva,
}: {
  v: {
    id: string;
    talla: string;
    color: string;
    colorHex: string | null;
    stockActual: number;
    activa: boolean;
  };
  onAjustar: (id: string, cambioCantidad: number, nota?: string) => Promise<void>;
  onCambiarActiva: (id: string, activa: boolean) => Promise<void>;
}) {
  const [cambio, setCambio] = useState("0");
  const [nota, setNota] = useState("");

  return (
    <tr className="border-t">
      <td className="p-3">{v.talla}</td>

      <td className="p-3">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border" style={{ backgroundColor: v.colorHex ?? "#ffffff" }} title={v.colorHex ?? ""} />
          <span>{v.color}</span>
          {v.colorHex ? <span className="text-xs opacity-70">{v.colorHex}</span> : null}
        </div>
      </td>

      <td className="p-3">{v.stockActual}</td>
      <td className="p-3">{v.activa ? "Activa" : "Inactiva"}</td>

      <td className="p-3">
        <div className="flex gap-2 items-center">
          <input className="w-20 border rounded-md px-2 py-1" value={cambio} onChange={(e) => setCambio(e.target.value)} />
          <input className="w-40 border rounded-md px-2 py-1" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="nota (opcional)" />
          <button type="button" className="underline" onClick={() => onAjustar(v.id, Number(cambio), nota)}>
            Aplicar
          </button>
        </div>
      </td>

      <td className="p-3">
        <button type="button" className="underline" onClick={() => onCambiarActiva(v.id, !v.activa)}>
          {v.activa ? "Desactivar" : "Activar"}
        </button>
      </td>
    </tr>
  );
}
