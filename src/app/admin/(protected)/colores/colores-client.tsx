"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import Pagination from "@/components/ui/pagination";
import {
  Palette,
  Search,
  Plus,
  Save,
  Trash2,
  Copy,
  Check,
  Ban,
  Maximize2,
  Image as ImageIcon,
  Upload,
  Pipette,
  X
} from "lucide-react";

type Row = {
  id: string;
  nombre: string;
  hex: string | null;
  usos?: number;
  activo: boolean;
};

// --- UTILS ---
function esHex(v: string) {
  if (!v) return true;
  const parts = v.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return false;
  const hexRegex = /^#([0-9a-fA-F]{6})$/;
  return parts.every(part => hexRegex.test(part));
}

function normalizarHex(v: string) {
  const x = (v ?? "").trim();
  if (!x) return "";
  return x.split(",")
    .map(p => {
      const part = p.trim();
      if (!part) return "";
      return part.startsWith("#") ? part.toUpperCase() : `#${part.toUpperCase()}`;
    })
    .filter(Boolean)
    .join(",");
}

function hexSeguroParaPicker(hex: string) {
  const parts = (hex ?? "").split(",").map(p => p.trim()).filter(Boolean);
  const first = parts[0] || "#000000";
  return /^#([0-9a-fA-F]{6})$/.test(first) ? first : "#000000";
}

function getColorStyle(hex: string | null) {
  if (!hex) return { backgroundColor: 'transparent' };
  const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
  if (codes.length <= 1) return { backgroundColor: codes[0] || 'transparent' };

  const percentage = 100 / codes.length;
  const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
  return { background: `linear-gradient(135deg, ${stops})` };
}

async function copiarAlPortapapeles(text: string) {
  if (!text) return;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}



export default function ColoresClient({
  initialRows,
  totalPages,
  initialFilters
}: {
  initialRows: Row[],
  totalPages: number,
  initialFilters: { q: string, estado: "todos" | "activos" | "inactivos" }
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 🔎 Filtros (Sincronizados con URL)
  // Estado local para input inmediato, effect para URL
  const [buscar, setBuscar] = useState(initialFilters.q);
  const [filtroEstado, setFiltroEstado] = useState(initialFilters.estado);

  // Debounce URL updates
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("q", term);
    else params.delete("q");

    // Reset page on search
    params.set("page", "1");

    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleEstadoChange = (estado: "todos" | "activos" | "inactivos") => {
    setFiltroEstado(estado);
    const params = new URLSearchParams(searchParams);
    if (estado !== "todos") params.set("estado", estado);
    else params.delete("estado");

    params.set("page", "1"); // Reset page
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Sync Input if URL changes externally
  useEffect(() => {
    setBuscar(searchParams.get("q") ?? "");
    setFiltroEstado((searchParams.get("estado") as any) ?? "todos");
  }, [searchParams]);


  // Form
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warning" } | null>(null);

  // Modal Preview
  const [previewColor, setPreviewColor] = useState<{ nombre: string; hex: string | null; activo: boolean } | null>(null);
  const [zoomImg, setZoomImg] = useState(false);

  // 📸 Imagen de Referencia
  const [imgRef, setImgRef] = useState<string | null>(null);
  const [esSoportado, setEsSoportado] = useState(false);

  // Verificar soporte de EyeDropper al montar
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).EyeDropper) {
      setEsSoportado(true);
    }
  }, []);

  const handleImgen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImgRef(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const abrirGotero = async () => {
    if (!esSoportado) {
      showToast("Gotero no soportado en este navegador", "warning");
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      setHex(normalizarHex(result.sRGBHex));
    } catch (e) {
      // Usuario canceló o error
    }
  };

  const hexNorm = useMemo(() => normalizarHex(hex), [hex]);

  const canCreate = useMemo(
    () => nombre.trim().length > 0 && esHex(hexNorm),
    [nombre, hexNorm]
  );

  // Use initialRows directly as they are now paginated/filtered from server
  const rowsFiltradas = initialRows;

  const showToast = (msg: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canCreate) return;

    setBusy(true);
    const r = await fetch("/api/admin/colores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), hex: hexNorm || null }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error creando color");
      return;
    }

    setNombre("");
    setHex("");
    showToast("Color añadido a la paleta");
    router.refresh();
  }

  async function actualizar(id: string, patch: { nombre: string; hex: string | null }) {
    const nombreTrim = patch.nombre.trim();
    // No normalizamos agresivamente si hay comas, permitimos la estructura manual
    const rawHex = patch.hex ?? "";

    if (!nombreTrim) { showToast("Nombre inválido", "error"); return; }
    if (!esHex(rawHex)) { showToast("HEX inválido o mal formado (ej: #FF0000,#000000)", "error"); return; }

    const r = await fetch(`/api/admin/colores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreTrim, hex: rawHex || null }),
    });

    if (!r.ok) {
      showToast("Error actualizando color", "error");
      return;
    }
    showToast("Color actualizado");
    router.refresh();
  }

  async function toggleActivo(id: string, activo: boolean) {
    const r = await fetch(`/api/admin/colores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });

    if (!r.ok) {
      showToast("Error cambiando estado", "error");
      return;
    }
    showToast(activo ? "Color activado" : "Color desactivado");
    router.refresh();
  }

  async function eliminar(row: Row) {
    if (!row.activo) {
      showToast(`El color ya se encuentra ARCHIVADO.`, "warning");
      return;
    }

    const mensaje = (row.usos ?? 0) > 0
      ? `⚠️ ATENCIÓN: Este color está en uso en ${row.usos} productos.\n\n` +
      `Si lo archivas, no se borrará de los productos existentes, pero NO podrás seleccionarlo para nuevos productos.\n\n` +
      `¿Deseas archivar "${row.nombre}"?`
      : `¿Deseas archivar el color "${row.nombre}"?\n\nPasará a estado Inactivo.`;

    if (!confirm(mensaje)) return;

    const r = await fetch(`/api/admin/colores/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: false }),
    });

    if (!r.ok) {
      showToast("Error al archivar color", "error");
      return;
    }
    showToast("Color archivado (Inactivo)", "warning");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999] flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' :
          toast.type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'
          }`}>
          <span>{toast.type === 'error' ? '⚠️' : toast.type === 'warning' ? '🔒' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* MODAL ZOOM */}
      {previewColor && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewColor(null)}
        >
          <div
            className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full relative flex flex-col items-center gap-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
              onClick={() => setPreviewColor(null)}
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            <div
              className="w-32 h-32 rounded-full shadow-lg border-4 border-white ring-1 ring-gray-200 transition-transform hover:scale-105"
              style={getColorStyle(previewColor.hex)}
            />

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">{previewColor.nombre || "Nuevo Color"}</h3>
              <div className="flex justify-center gap-2 mb-2">
                {previewColor.activo ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Activo</span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">Inactivo</span>
                )}
              </div>
              <button
                className="font-mono text-lg text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 w-full"
                onClick={() => {
                  if (previewColor.hex) {
                    copiarAlPortapapeles(previewColor.hex);
                    showToast("Código copiado");
                  }
                }}
              >
                {previewColor.hex || "N/A"}
                <Copy className="w-4 h-4 opacity-50" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMAGE ZOOM */}
      {zoomImg && imgRef && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setZoomImg(false)}
        >
          <div
            className="relative max-w-5xl w-full h-[80vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar Modal */}
            <div className="flex justify-between items-center p-6 bg-slate-900/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Imagen de Referencia</h3>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Vista Ampliada</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={abrirGotero}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 hover:bg-indigo-500 transition-colors"
                >
                  <Pipette className="w-4 h-4" /> Usar Gotero
                </button>
                <button
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                  onClick={() => setZoomImg(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenedor Imagen */}
            <div className="flex-1 w-full relative overflow-auto p-4 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              <img
                src={imgRef}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10 select-none"
                alt="Zoom Referencia"
              />
            </div>

            {/* Tip Gotero */}
            <div className="p-4 bg-slate-900 text-center border-t border-white/5">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                Usa el gotero para capturar el color exacto de cualquier pixel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- COLUMNA IZQUIERDA: FORMULARIO ---------------- */}
      <div className="lg:col-span-4 sticky top-6 space-y-6">

        {/* Card Formulario */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">Nuevo Color</h3>
            </div>
            <p className="text-slate-400 text-xs">Añade variantes cromáticas a tu paleta.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* --- SECCIÓN IMAGEN DE REFERENCIA --- */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto de Referencia</label>
                {imgRef && (
                  <button
                    onClick={() => setImgRef(null)}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                )}
              </div>

              {!imgRef ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-600 mb-2 transition-transform group-hover:-translate-y-1" />
                    <p className="text-xs text-slate-500 font-medium">Sube una foto para usar el gotero</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImgen} />
                </label>
              ) : (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-inner border border-slate-200 group/img">
                  <img src={imgRef} className="w-full h-full object-cover" alt="Referencia" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      onClick={() => setZoomImg(true)}
                      className="bg-white/90 hover:bg-white text-slate-900 p-2 rounded-xl shadow-lg transition-all scale-90 group-hover/img:scale-100"
                      title="Ampliar imagen"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={abrirGotero}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl shadow-lg transition-all scale-90 group-hover/img:scale-100"
                      title="Usar Gotero"
                    >
                      <Pipette className="w-5 h-5" />
                    </button>
                    <label className="bg-slate-900/90 hover:bg-slate-900 text-white p-2 rounded-xl shadow-lg cursor-pointer transition-all scale-90 group-hover/img:scale-100" title="Cambiar imagen">
                      <ImageIcon className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImgen} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-slate-100 w-full" />

            <form onSubmit={crear} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
                <input
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                  placeholder="Ej: Azul Marino"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Selector</label>
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-3 top-3 text-slate-400 font-mono text-sm">#</span>
                    <input
                      className="w-full pl-7 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 font-mono text-sm uppercase"
                      placeholder="Ej: #FF0000 o #FF0000,#FFFFFF"
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                    />
                    <div className="absolute right-12 top-2 pointer-events-none">
                      <Palette className="w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    </div>
                    {/* Selector nativo invisible sobrepuesto al final */}
                    <div className="absolute right-2 top-2 flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                      <div className="relative overflow-hidden w-6 h-6 rounded-md shadow-sm border border-slate-300 group/picker">
                        <input
                          type="color"
                          className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                          value={hexSeguroParaPicker(hexNorm)}
                          onChange={(e) => setHex(normalizarHex(e.target.value))}
                        />
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: hexSeguroParaPicker(hexNorm) }} />
                      </div>

                      {esSoportado && (
                        <button
                          type="button"
                          onClick={abrirGotero}
                          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm transition-all"
                          title="Usar Gotero (EyeDropper)"
                        >
                          <Pipette className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {!esHex(hexNorm) && <p className="text-xs text-red-500 ml-1">Formato inválido.</p>}
              </div>

              {/* Vista Previa en Formulario */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-4 cursor-pointer transition-all hover:shadow-sm ${esHex(hexNorm) && hexNorm ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-300'}`}
                onClick={() => {
                  if (esHex(hexNorm) && hexNorm) {
                    setPreviewColor({ nombre: nombre || "Vista Previa", hex: hexNorm, activo: true });
                  }
                }}
                title="Clic para ampliar"
              >
                <div
                  className="w-12 h-12 rounded-full border border-slate-200 shadow-sm shrink-0"
                  style={getColorStyle(hexNorm)}
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Vista Previa</p>
                  <p className="text-sm font-mono text-slate-500">{hexNorm || "---"}</p>
                </div>
                {esHex(hexNorm) && hexNorm && <Maximize2 className="w-4 h-4 text-slate-400" />}
              </div>

              {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10"
                disabled={busy || !canCreate}
              >
                {busy ? "Guardando..." : "Guardar Color"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ---------------- COLUMNA DERECHA: LISTADO ---------------- */}
      <div className="lg:col-span-8 space-y-6">

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400"
              placeholder="Buscar color..."
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {(['todos', 'activos', 'inactivos'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleEstadoChange(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filtroEstado === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {/* Header Ajustado para 12 columnas */}
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">Muestra</div>
            <div className="col-span-4">Nombre</div>
            <div className="col-span-2">HEX</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-1 text-center">Usos</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
            {rowsFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Palette className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">No se encontraron colores</h3>
                <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros.</p>
              </div>
            ) : (
              rowsFiltradas.map((r) => (
                <Fila
                  key={r.id}
                  row={r}
                  disabled={busy}
                  onSave={(patch) => actualizar(r.id, patch)}
                  onDelete={() => eliminar(r)}
                  onToggle={(act) => toggleActivo(r.id, act)}
                  onCopy={async (value) => {
                    await copiarAlPortapapeles(value);
                    showToast(`Copiado: ${value}`);
                  }}
                  onPreview={() => setPreviewColor(r)}
                />
              ))
            )}
          </div>
        </div>

        {/* Paginación */}
        <div className="flex justify-center pb-8">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}

function Fila({
  row,
  disabled,
  onSave,
  onDelete,
  onToggle,
  onCopy,
  onPreview,
}: {
  row: Row;
  disabled: boolean;
  onSave: (patch: { nombre: string; hex: string | null }) => void;
  onDelete: () => void;
  onToggle: (activo: boolean) => void;
  onCopy: (value: string) => void;
  onPreview: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [hex, setHex] = useState(row.hex ?? "");

  const hexNorm = normalizarHex(hex);
  const baseHex = normalizarHex(row.hex ?? "");
  const changed = nombre.trim() !== row.nombre || (hexNorm || "") !== (baseHex || "");
  const usos = row.usos ?? 0;

  return (
    <div className={`grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50 transition-colors gap-2 group ${!row.activo ? 'opacity-60 bg-slate-50/50' : ''}`}>

      {/* Muestra (col-span-1) */}
      <div className="col-span-1 flex justify-center">
        <div
          className="w-10 h-10 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-slate-100"
          style={getColorStyle(hexNorm)}
          onClick={onPreview}
          title="Ver detalle"
        />
      </div>

      {/* Nombre (col-span-4) */}
      <div className="col-span-4">
        <input
          className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:ring-0 outline-none py-1 font-bold text-slate-700 transition-colors disabled:text-slate-400"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={!row.activo}
        />
      </div>

      {/* HEX + Picker (col-span-2) */}
      <div className="col-span-2 relative group/hex">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">#</span>
          <input
            className="w-20 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:ring-0 outline-none py-1 font-mono text-sm text-slate-600 uppercase disabled:text-slate-400"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            disabled={!row.activo}
          />
        </div>
        {/* Picker flotante */}
        {row.activo && (
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
            value={hexSeguroParaPicker(hexNorm)}
            onChange={(e) => setHex(normalizarHex(e.target.value))}
          />
        )}
        {/* Botón copiar flotante */}
        {hexNorm && (
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(hexNorm); }}
            className="absolute -right-6 top-1 text-slate-400 hover:text-slate-800 opacity-0 group-hover/hex:opacity-100 transition-opacity z-10"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Estado Toggle (col-span-2) */}
      <div className="col-span-2 flex justify-center">
        <button
          disabled={disabled}
          onClick={() => onToggle(!row.activo)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${row.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
          title={row.activo ? "Activar/Desactivar" : "Activar"}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${row.activo ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Usos (col-span-1) */}
      <div className="col-span-1 text-center">
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${usos > 0 ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
          {usos}
        </span>
      </div>

      {/* Acciones (col-span-2) */}
      <div className="col-span-2 flex items-center justify-end gap-2">
        {changed && row.activo && (
          <button
            className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm animate-in zoom-in"
            disabled={disabled || !nombre.trim() || !esHex(hexNorm)}
            onClick={() => onSave({ nombre: nombre.trim(), hex: hexNorm ? hexNorm : null })}
            title="Guardar cambios"
          >
            <Save className="w-4 h-4" />
          </button>
        )}

        <button
          className={`p-2 rounded-lg transition-colors ${row.activo ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 cursor-not-allowed'}`}
          disabled={disabled || !row.activo}
          onClick={onDelete}
          title={row.activo ? "Archivar (Desactivar)" : "Ya está inactivo"}
        >
          {row.activo ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}