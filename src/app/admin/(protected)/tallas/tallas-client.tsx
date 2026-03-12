"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Ruler, 
  ListOrdered, 
  Search, 
  Save, 
  Trash2, 
  Plus, 
  ArrowUpDown,
  AlertCircle 
} from "lucide-react";

type Row = { id: string; nombre: string; orden: number };

export default function TallasClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);

  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");
  const [busqueda, setBusqueda] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canCreate = useMemo(() => nombre.trim().length > 0, [nombre]);

  // Lógica de filtrado
  const rowsFiltradas = useMemo(() => {
    return initialRows.filter(r => 
        r.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [initialRows, busqueda]);

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
    const r = await fetch(`/api/admin/tallas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">
      
      {/* TOAST NOTIFICATION */}
      {successMsg && (
         <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-2">
            <span>✅</span>
            <span className="font-medium">{successMsg}</span>
         </div>
      )}

      {/* ---------------- COLUMNA IZQUIERDA: FORMULARIO ---------------- */}
      <div className="lg:col-span-4 lg:sticky lg:top-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          {/* Form Header */}
          <div className="bg-slate-900 p-5 md:p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                 <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">Nueva Talla</h3>
            </div>
            <p className="text-slate-400 text-xs">Define las dimensiones disponibles para tus productos.</p>
          </div>

          <div className="p-5 md:p-6">
            <form onSubmit={crear} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Etiqueta</label>
                <div className="relative group">
                   <input
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                    placeholder="Ej. XL, 42, Standar"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                   />
                   <Ruler className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Orden de Visualización</label>
                <div className="relative group">
                    <input
                      type="number"
                      step={1}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-mono"
                      value={orden}
                      onChange={(e) => setOrden(e.target.value)}
                    />
                    <ListOrdered className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" />
                   Menor número aparece primero (1, 2, 3...)
                </p>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2 items-start">
                   <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                   {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
                disabled={busy || !canCreate}
              >
                {busy ? (
                    <>
                       <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                       Guardando...
                    </>
                ) : (
                    "Guardar Talla"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ---------------- COLUMNA DERECHA: LISTADO ---------------- */}
      <div className="lg:col-span-8">
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px] lg:min-h-[500px]">
            
            {/* Header Listado */}
            <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <span className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-600 shrink-0">
                     <Ruler className="w-4 h-4" />
                  </span>
                  <div>
                     <h2 className="font-bold text-slate-800 text-sm">Inventario de Tallas</h2>
                     <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Registros: {rowsFiltradas.length}
                     </p>
                  </div>
               </div>

               <div className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <input 
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none bg-white transition-all shadow-sm"
                      placeholder="Buscar talla..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                  />
               </div>
            </div>
            
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
               {rowsFiltradas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Ruler className="w-8 h-8 text-slate-300" />
                     </div>
                     <h3 className="text-slate-900 font-bold">No hay tallas</h3>
                     <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
                        {busqueda 
                           ? `No hay resultados para "${busqueda}".`
                           : "Comienza agregando las tallas para tus productos."}
                     </p>
                  </div>
               ) : (
                  <>
                    {/* Header Tabla Falsa (Oculto en móviles muy pequeños) */}
                    <div className="hidden md:grid grid-cols-12 px-6 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <div className="col-span-2 text-center">Orden</div>
                        <div className="col-span-5">Nombre</div>
                        <div className="col-span-2 text-center">Prioridad</div>
                        <div className="col-span-3 text-right">Acciones</div>
                    </div>

                    {rowsFiltradas.map((r) => (
                      <Fila
                        key={r.id}
                        row={r}
                        disabled={busy}
                        onSave={(patch) => actualizar(r.id, patch)}
                        onDelete={() => eliminar(r.id)}
                      />
                    ))}
                  </>
               )}
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
    <div className="group flex flex-col md:grid md:grid-cols-12 md:items-center px-4 md:px-6 py-4 hover:bg-slate-50 transition-colors gap-3 md:gap-4 border-b border-slate-50 last:border-0">
       
       {/* Sección Superior: Orden visual y Nombre (Móvil) / Columnas 1 y 2 (PC) */}
       <div className="flex items-center gap-3 md:col-span-7">
           <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-mono font-bold text-indigo-600 border border-indigo-100 shadow-sm md:mx-auto md:w-8 md:h-8">
              {row.orden}
           </div>
           
           <div className="w-full">
              <input
                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:ring-0 outline-none px-0 py-1 font-bold text-slate-700 transition-colors placeholder:font-normal"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de talla"
              />
           </div>
       </div>

       {/* Sección Inferior: Input Orden y Botones (Móvil) / Columnas 3 y 4 (PC) */}
       <div className="flex items-center justify-between md:col-span-5 w-full pl-11 md:pl-0">
           
           <div className="flex items-center gap-2">
               <span className="text-[10px] text-slate-400 font-bold uppercase md:hidden">Prioridad:</span>
               <div className="relative w-16 group/input">
                  <input
                    type="number"
                    step={1}
                    className="w-full bg-transparent border border-slate-200 md:border-transparent hover:border-slate-300 focus:border-slate-900 rounded px-1 py-1 text-sm text-slate-600 text-center transition-all font-mono"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                  />
                  <ArrowUpDown className="absolute right-1 top-2 w-3 h-3 text-slate-300 opacity-0 group-hover/input:opacity-100 pointer-events-none hidden md:block" />
               </div>
           </div>

           <div className="flex items-center justify-end gap-2 md:opacity-40 md:group-hover:opacity-100 transition-opacity">
              {changed && (
                 <button
                   type="button"
                   className="bg-green-600 text-white text-[10px] md:text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 transition-all shadow-sm animate-in zoom-in flex items-center gap-1"
                   disabled={disabled || !nombre.trim()}
                   onClick={() => onSave({ nombre: nombre.trim(), orden: Number.parseInt(orden || "0", 10) || 0 })}
                 >
                   <Save className="w-3 h-3" />
                   <span className="hidden sm:inline">Guardar</span>
                 </button>
              )}
              
              <button 
                 type="button" 
                 className="text-slate-400 hover:text-red-600 p-2 bg-slate-50 md:bg-transparent hover:bg-red-50 rounded-lg transition-colors border border-slate-100 md:border-none" 
                 disabled={disabled} 
                 onClick={onDelete}
                 title="Eliminar talla"
              >
                 <Trash2 className="w-4 h-4" />
              </button>
           </div>
       </div>

    </div>
  );
}