"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; nombre: string; orden: number };

export default function TallasClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);

  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canCreate = useMemo(() => nombre.trim().length > 0, [nombre]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canCreate) return;

    const ord = Number.parseInt(orden || "0", 10);
    const ordenInt = Number.isFinite(ord) ? ord : 0;

    setBusy(true);
    const r = await fetch("/api/admin/tallas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), orden: ordenInt }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error creando talla");
      return;
    }

    setNombre("");
    setOrden("0");
    showSuccess("Talla creada correctamente");

    router.refresh();
  }

  async function actualizar(id: string, patch: { nombre: string; orden: number }) {
    setError(null);
    // setBusy(true); // No bloqueamos todo para edición inline
    const r = await fetch(`/api/admin/tallas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    // setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error actualizando talla");
      return;
    }
    showSuccess("Talla actualizada");
    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    if (!confirm("¿Estás seguro de eliminar esta talla? Si está en uso, podría fallar.")) return;

    setBusy(true);
    const r = await fetch(`/api/admin/tallas/${id}`, { method: "DELETE" });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error eliminando talla (puede estar en uso)");
      return;
    }

    showSuccess("Talla eliminada");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
      
      {/* TOAST NOTIFICATION */}
      {successMsg && (
         <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            ✅ {successMsg}
         </div>
      )}

      {/* FORMULARIO DE CREACIÓN */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Agregar Nueva Talla</h2>
          
          <form onSubmit={crear} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Etiqueta</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-300"
                placeholder="Ej. XL, 42, Standar"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Orden de visualización</label>
              <input
                type="number"
                step={1}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              />
              <p className="text-[10px] text-gray-400">Menor número aparece primero (1, 2, 3...)</p>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
              disabled={busy || !canCreate}
            >
              {busy ? "Guardando..." : "Guardar Talla"}
            </button>
          </form>
        </div>
      </div>

      {/* LISTA DE TALLAS */}
      <div className="lg:col-span-2">
         <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Listado Actual</span>
            </div>
            
            {initialRows.length === 0 ? (
               <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <span className="text-4xl mb-2">📏</span>
                  <p>No hay tallas registradas aún.</p>
               </div>
            ) : (
               <div className="divide-y divide-gray-100">
                  {initialRows.map((r) => (
                    <Fila
                      key={r.id}
                      row={r}
                      disabled={busy}
                      onSave={(patch) => actualizar(r.id, patch)}
                      onDelete={() => eliminar(r.id)}
                    />
                  ))}
               </div>
            )}
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
}: {
  row: { id: string; nombre: string; orden: number };
  disabled: boolean;
  onSave: (patch: { nombre: string; orden: number }) => void;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [orden, setOrden] = useState(String(row.orden));

  const changed = nombre.trim() !== row.nombre || Number(orden || 0) !== row.orden;

  return (
    <div className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-4">
       <div className="flex-1 grid grid-cols-2 gap-4 items-center">
          
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-mono font-bold text-gray-500 border border-gray-200">
                {row.orden}
             </div>
             <input
               className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:ring-0 outline-none px-2 py-1 font-medium text-gray-900 transition-colors"
               value={nombre}
               onChange={(e) => setNombre(e.target.value)}
               placeholder="Nombre"
             />
          </div>

          <div className="flex items-center gap-2">
             <span className="text-xs text-gray-400 uppercase">Orden:</span>
             <input
               type="number"
               step={1}
               className="w-20 bg-transparent border border-transparent hover:border-gray-300 focus:border-black rounded px-2 py-1 text-sm text-gray-700 text-center transition-all"
               value={orden}
               onChange={(e) => setOrden(e.target.value)}
             />
          </div>
       </div>

       <div className="flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
          {changed && (
             <button
               type="button"
               className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-full font-medium hover:bg-green-700 transition-colors shadow-sm animate-in zoom-in"
               disabled={disabled || !nombre.trim()}
               onClick={() => onSave({ nombre: nombre.trim(), orden: Number.parseInt(orden || "0", 10) || 0 })}
             >
               Guardar
             </button>
          )}
          
          <button 
             type="button" 
             className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors" 
             disabled={disabled} 
             onClick={onDelete}
             title="Eliminar talla"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
       </div>
    </div>
  );
}