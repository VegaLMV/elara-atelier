"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { 
  id: string; 
  nombre: string; 
  costoUnitario: string; 
  activo: boolean; 
  imagenUrl: string | null 
};

export default function EmpaquesClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("");
  const [file, setFile] = useState<File | null>(null); 
  
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  
  // UI States
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const canCreate = useMemo(() => {
    if (!nombre.trim()) return false;
    if (costo === "" || isNaN(Number(costo)) || Number(costo) < 0) return false;
    return true;
  }, [nombre, costo]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canCreate) return;

    setBusy(true);

    // Nota: Aquí se implementaría la subida real si tuvieras el endpoint listo.
    
    const r = await fetch("/api/admin/empaques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), costoUnitario: costo }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      showToast(d?.error ?? "Error creando empaque", "error");
      return;
    }

    setNombre("");
    setCosto("");
    setFile(null);
    showToast("Empaque creado correctamente");
    router.refresh();
  }

  async function actualizar(id: string, patch: { nombre: string; costoUnitario: string }) {
    if (!patch.nombre.trim()) { showToast("Nombre inválido", "error"); return; }
    if (patch.costoUnitario === "" || isNaN(Number(patch.costoUnitario)) || Number(patch.costoUnitario) < 0) {
      showToast("Costo inválido", "error");
      return;
    }

    const r = await fetch(`/api/admin/empaques/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: patch.nombre.trim(), costoUnitario: patch.costoUnitario }),
    });

    if (!r.ok) {
      showToast("Error actualizando empaque", "error");
      return;
    }
    showToast("Empaque actualizado");
    router.refresh();
  }

  async function toggleActivo(id: string, activo: boolean) {
    const r = await fetch(`/api/admin/empaques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });

    if (!r.ok) {
      showToast("Error cambiando estado", "error");
      return;
    }
    showToast(activo ? "Empaque activado" : "Empaque desactivado");
    router.refresh();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar empaque permanentemente?")) return;

    const r = await fetch(`/api/admin/empaques/${id}`, { method: "DELETE" });

    if (!r.ok) {
      showToast("No se puede eliminar (probablemente en uso)", "error");
      return;
    }

    showToast("Empaque eliminado");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
      
      {/* Toast */}
      {toast && (
          <div className={`fixed bottom-5 right-5 px-6 py-4 rounded-xl shadow-2xl text-white font-medium text-sm animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999] flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
              <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
              <span>{toast.msg}</span>
          </div>
      )}

      {/* Modal Zoom */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
           <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={previewImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* FORMULARIO */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
            <span>📦</span> Nuevo Empaque
          </h2>

          <form onSubmit={crear} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400"
                placeholder="Ej: Bolsa Kraft Mediana"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Costo (S/)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                placeholder="0.00"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
              />
            </div>

            {/* Input de imagen simulado (UI) */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Imagen Referencia</label>
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors relative">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <span className="text-xs text-gray-500">{file ? file.name : "Click para subir foto"}</span>
               </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
              disabled={busy || !canCreate}
            >
              {busy ? "Guardando..." : "Guardar Empaque"}
            </button>
          </form>
        </div>
      </div>

      {/* LISTA */}
      <div className="lg:col-span-2">
         <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inventario</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-16 text-center">Foto</th>
                    <th className="px-6 py-4">Descripción</th>
                    <th className="px-6 py-4 text-center">Costo</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {initialRows.map((r) => (
                    <Fila
                      key={r.id}
                      row={r}
                      disabled={busy}
                      onSave={(patch) => actualizar(r.id, patch)}
                      onToggle={(val) => toggleActivo(r.id, val)}
                      onDelete={() => eliminar(r.id)}
                      onPreview={() => r.imagenUrl && setPreviewImage(r.imagenUrl)}
                    />
                  ))}
                  {initialRows.length === 0 && (
                    <tr>
                      <td className="p-12 text-center text-gray-400" colSpan={5}>
                        No hay empaques registrados.
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
  onToggle,
  onDelete,
  onPreview,
}: {
  row: Row;
  disabled: boolean;
  onSave: (patch: { nombre: string; costoUnitario: string }) => void;
  onToggle: (activo: boolean) => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [costo, setCosto] = useState(row.costoUnitario);

  const changed = nombre.trim() !== row.nombre || costo !== row.costoUnitario;

  return (
    <tr className="hover:bg-gray-50/80 transition-colors group">
      <td className="px-6 py-4 text-center">
         <div 
            className={`w-12 h-12 rounded-lg border border-gray-200 overflow-hidden mx-auto relative ${row.imagenUrl ? 'cursor-zoom-in hover:ring-2 hover:ring-slate-200 hover:shadow-md' : 'bg-gray-50' } transition-all`}
            onClick={row.imagenUrl ? onPreview : undefined}
         >
            {row.imagenUrl ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={row.imagenUrl} alt="" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-lg text-gray-300">📦</div>
            )}
         </div>
      </td>

      <td className="px-6 py-4">
        <input
          className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:ring-0 outline-none px-0 py-1 font-medium text-gray-900 transition-colors placeholder:text-gray-300"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del empaque"
        />
      </td>

      <td className="px-6 py-4 text-center">
         <div className="flex items-center justify-center gap-1">
            <span className="text-gray-400 text-xs">S/</span>
            <input
               className="w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:ring-0 outline-none px-0 py-1 text-center font-mono text-gray-700"
               value={costo}
               onChange={(e) => setCosto(e.target.value)}
            />
         </div>
      </td>

      <td className="px-6 py-4 text-center">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggle(!row.activo)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${row.activo ? 'bg-green-500' : 'bg-gray-300'}`}
          title={row.activo ? "Empaque activo" : "Empaque inactivo"}
        >
           <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${row.activo ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
          {changed && (
             <button
               type="button"
               className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md font-medium hover:bg-slate-800 transition-all animate-in zoom-in"
               disabled={disabled || !nombre.trim()}
               onClick={() => onSave({ nombre: nombre.trim(), costoUnitario: costo })}
             >
               Guardar
             </button>
          )}
          
          <button 
             type="button" 
             className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors" 
             disabled={disabled} 
             onClick={onDelete}
             title="Eliminar"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}