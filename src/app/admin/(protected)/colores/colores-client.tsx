"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; nombre: string; hex: string | null; usos?: number };

function esHex(v: string) {
  if (!v) return true;
  return /^#([0-9a-fA-F]{6})$/.test(v.trim());
}

function normalizarHex(v: string) {
  const x = (v ?? "").trim();
  if (!x) return "";
  const withHash = x.startsWith("#") ? x : `#${x}`;
  return withHash.toUpperCase();
}

function hexSeguroParaPicker(hex: string) {
  return esHex(hex) && hex ? normalizarHex(hex) : "#000000";
}

async function copiarAlPortapapeles(text: string) {
  const t = text ?? "";
  if (!t) return;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(t);
  } else {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export default function ColoresClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();

  // 🔎 búsqueda
  const [buscar, setBuscar] = useState("");

  // create
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  // ✅ Estado para la mini ventana (modal) de visualización
  const [previewColor, setPreviewColor] = useState<Row | null>(null);

  const hexNorm = useMemo(() => normalizarHex(hex), [hex]);

  const canCreate = useMemo(
    () => nombre.trim().length > 0 && esHex(hexNorm),
    [nombre, hexNorm]
  );

  const rowsFiltradas = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return initialRows;

    return initialRows.filter((r) => {
      const a = (r.nombre ?? "").toLowerCase();
      const b = normalizarHex(r.hex ?? "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [buscar, initialRows]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
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
    const hexNorm2 = patch.hex ? normalizarHex(patch.hex) : "";

    if (!nombreTrim) { showToast("Nombre inválido", "error"); return; }
    if (!esHex(hexNorm2)) { showToast("HEX inválido (usa #RRGGBB)", "error"); return; }

    const r = await fetch(`/api/admin/colores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreTrim, hex: hexNorm2 || null }),
    });

    if (!r.ok) {
      showToast("Error actualizando color", "error");
      return;
    }

    showToast("Color actualizado");
    router.refresh();
  }

  async function eliminar(row: Row) {
    if ((row.usos ?? 0) > 0) {
      showToast(`No puedes eliminar "${row.nombre}" porque está en uso.`, "error");
      return;
    }

    if (!confirm("¿Eliminar color permanentemente?")) return;

    const r = await fetch(`/api/admin/colores/${row.id}`, { method: "DELETE" });

    if (!r.ok) {
      showToast("Error eliminando color", "error");
      return;
    }

    showToast("Color eliminado");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
          <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999] flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
              <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
              <span>{toast.msg}</span>
          </div>
      )}

      {/* ✅ MINI VENTANA (MODAL) DE VISUALIZACIÓN */}
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
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <div 
                className="w-32 h-32 rounded-full shadow-lg border-4 border-white ring-1 ring-gray-200 transition-transform hover:scale-105"
                style={{ backgroundColor: previewColor.hex ?? '#fff' }}
              />
              
              <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold text-gray-900">{previewColor.nombre}</h3>
                 <p 
                    className="font-mono text-lg text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    onClick={() => {
                        if (previewColor.hex) {
                            copiarAlPortapapeles(previewColor.hex);
                            showToast("Código copiado");
                        }
                    }}
                 >
                    {previewColor.hex || "N/A"}
                    <span className="text-xs opacity-50">📋</span>
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* COLUMNA IZQUIERDA: CREAR Y BUSCAR */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* BUSCADOR */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Filtrar Colores</label>
           <div className="relative">
              <input
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400"
                placeholder="Nombre o #HEX..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
           <p className="text-xs text-gray-400 mt-3 text-right font-medium">
             Mostrando {rowsFiltradas.length} resultados
           </p>
        </div>

        {/* CREAR */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4 flex items-center gap-2">
            <span>🎨</span> Nuevo Color
          </h2>
          
          <form onSubmit={crear} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Color</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-300"
                placeholder="Ej: Azul Marino"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selector & Código</label>
              <div className="flex gap-3">
                 <input
                   type="color"
                   className="h-11 w-14 border border-gray-300 rounded-lg p-1 cursor-pointer bg-white shadow-sm hover:border-gray-400 transition-colors"
                   value={hexSeguroParaPicker(hexNorm)}
                   onChange={(e) => setHex(normalizarHex(e.target.value))}
                   title="Abrir selector de color"
                 />
                 <input
                   className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-300 uppercase font-mono tracking-wider"
                   placeholder="#RRGGBB"
                   value={hex}
                   onChange={(e) => setHex(e.target.value)}
                 />
              </div>
              {!esHex(hexNorm) && <p className="text-xs text-red-500 mt-1 font-medium">Formato inválido. Usa #RRGGBB</p>}
            </div>

            {/* Preview Miniatura en Formulario */}
            <div className={`p-4 rounded-lg flex items-center gap-4 transition-colors ${esHex(hexNorm) && hexNorm ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
               <div 
                  className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" 
                  style={{ background: esHex(hexNorm) && hexNorm ? hexNorm : "transparent" }} 
               />
               <div className="text-xs text-gray-500">
                  <span className="block font-bold text-gray-800 mb-0.5">Vista Previa</span>
                  <span className="font-mono">{hexNorm || "—"}</span>
               </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">⚠️ {error}</div>}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
              disabled={busy || !canCreate}
            >
              {busy ? "Guardando..." : "Guardar Color"}
            </button>
          </form>
        </div>
      </div>

      {/* COLUMNA DERECHA: TABLA */}
      <div className="lg:col-span-2">
         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Listado de Colores</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-20 text-center">Muestra</th>
                      <th className="px-6 py-4">Nombre</th>
                      <th className="px-6 py-4">Código HEX</th>
                      <th className="px-6 py-4 text-center">Usos</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rowsFiltradas.map((r) => (
                      <Fila
                        key={r.id}
                        row={r}
                        disabled={busy}
                        onSave={(patch) => actualizar(r.id, patch)}
                        onDelete={() => eliminar(r)}
                        onCopy={async (value) => {
                          await copiarAlPortapapeles(value);
                          showToast(`Copiado: ${value}`);
                        }}
                        onPreview={() => setPreviewColor(r)}
                      />
                    ))}

                    {rowsFiltradas.length === 0 && (
                      <tr>
                        <td className="p-16 text-center text-gray-400" colSpan={5}>
                          <div className="flex flex-col items-center gap-3">
                             <span className="text-5xl opacity-20">🎨</span>
                             <p className="text-lg font-medium text-gray-500">No se encontraron colores.</p>
                             <p className="text-sm">Intenta crear uno nuevo o ajusta tu búsqueda.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
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
  onCopy,
  onPreview,
}: {
  row: Row;
  disabled: boolean;
  onSave: (patch: { nombre: string; hex: string | null }) => void;
  onDelete: () => void;
  onCopy: (value: string) => void;
  onPreview: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [hex, setHex] = useState(row.hex ?? "");

  const hexNorm = normalizarHex(hex);
  const baseHex = normalizarHex(row.hex ?? "");
  const usos = row.usos ?? 0;

  const changed = nombre.trim() !== row.nombre || (hexNorm || "") !== (baseHex || "");
  const puedeEliminar = usos === 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-4 text-center">
        <div 
            className="w-10 h-10 rounded-full border-2 border-white shadow-md mx-auto cursor-pointer hover:scale-110 transition-transform ring-1 ring-gray-200"
            style={{ background: esHex(hexNorm) && hexNorm ? hexNorm : "transparent" }}
            title="Clic para ver en grande"
            onClick={onPreview}
        />
      </td>

      <td className="px-6 py-4">
        <input
          className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:ring-0 outline-none px-2 py-1 font-semibold text-gray-700 transition-colors placeholder:font-normal"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
        />
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3 group/hex relative">
            <span className="text-gray-400 text-lg">#</span>
            <input
                className="w-24 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:ring-0 outline-none px-0 py-1 font-mono text-sm text-gray-600 transition-colors uppercase"
                value={hex.replace('#', '')}
                onChange={(e) => setHex('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, ''))}
                placeholder="RRGGBB"
            />
            {/* Overlay invisible para el color picker rápido */}
            <input 
                type="color" 
                className="absolute inset-0 opacity-0 w-8 cursor-pointer -left-6"
                value={hexSeguroParaPicker(hexNorm)}
                onChange={(e) => setHex(normalizarHex(e.target.value))}
            />
            
            {hexNorm && (
                <button 
                    onClick={() => onCopy(hexNorm)}
                    className="text-gray-300 hover:text-black opacity-0 group-hover/hex:opacity-100 transition-all transform hover:scale-110"
                    title="Copiar Código"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            )}
        </div>
      </td>

      <td className="px-6 py-4 text-center">
         <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${usos > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
            {usos} {usos === 1 ? 'uso' : 'usos'}
         </span>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
          {changed && (
             <button
               type="button"
               className="bg-green-600 text-white text-xs px-4 py-1.5 rounded-full font-bold hover:bg-green-700 transition-all shadow-sm animate-in zoom-in"
               disabled={disabled || !nombre.trim() || !esHex(hexNorm)}
               onClick={() => onSave({ nombre: nombre.trim(), hex: hexNorm ? hexNorm : null })}
             >
               Guardar
             </button>
          )}

          <button
            type="button"
            className={`p-2 rounded-full transition-colors ${puedeEliminar ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`}
            disabled={disabled || !puedeEliminar}
            onClick={onDelete}
            title={!puedeEliminar ? "En uso por productos" : "Eliminar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}