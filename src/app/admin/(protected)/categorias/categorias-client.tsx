"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Trash2, 
  Tag, 
  FolderOpen, 
  AlertCircle,
  Package
} from "lucide-react";

export default function CategoriasClient({ initialRows }: { initialRows: any[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState(""); 
  const [busy, setBusy] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setBusy(true);
    
    await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    
    setNombre("");
    setBusy(false);
    router.refresh();
  }

  async function eliminar(id: string) {
    if(!confirm("¿Estás seguro de eliminar esta categoría permanentemente?")) return;
    await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    router.refresh();
  }

  // Lógica de Filtrado
  const categoriasFiltradas = initialRows.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
      
      {/* ----------------- COLUMNA IZQUIERDA: FORMULARIO ----------------- */}
      <div className="lg:col-span-4 sticky top-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Form Header */}
          <div className="bg-slate-900 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                 <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">Crear Categoría</h3>
            </div>
            <p className="text-slate-400 text-xs">Agrega nuevas secciones para organizar tu catálogo.</p>
          </div>

          {/* Form Body */}
          <div className="p-6">
            <form onSubmit={crear} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
                  <div className="relative group">
                    <input 
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                        placeholder="Ej: Vestidos de Noche"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        disabled={busy}
                    />
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                  </div>
                </div>

                <button 
                  disabled={busy || !nombre.trim()} 
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 flex justify-center items-center gap-2"
                >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Guardando...
                      </>
                    ) : (
                      "Guardar Categoría"
                    )}
                </button>
            </form>
          </div>
        </div>
      </div>

      {/* ----------------- COLUMNA DERECHA: LISTADO ----------------- */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Header con Buscador y Stats */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                 <span className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-600">
                    <FolderOpen className="w-4 h-4" />
                 </span>
                 <div>
                    <h2 className="font-bold text-slate-800 text-sm">Inventario de Categorías</h2>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                       Total: {categoriasFiltradas.length}
                    </p>
                 </div>
              </div>
              
              <div className="relative w-full sm:w-72 group">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <input 
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none bg-white transition-all shadow-sm"
                      placeholder="Buscar por nombre..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                  />
              </div>
          </div>

          {/* Resultados */}
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {categoriasFiltradas.map(c => {
                  const tieneProductos = c._count.productos > 0;
                  
                  return (
                      <div key={c.id} className="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-4">
                              {/* Icono de Item */}
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
                                  <Tag className="w-5 h-5" />
                              </div>
                              
                              <div>
                                  <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-900 text-base">{c.nombre}</p>
                                      {tieneProductos && (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200 flex items-center gap-1">
                                           <Package className="w-3 h-3" /> En uso
                                        </span>
                                      )}
                                  </div>
                                  
                                  <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                        /{c.slug}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                        • {c._count.productos} {c._count.productos === 1 ? 'producto' : 'productos'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                          
                          <button 
                              onClick={() => eliminar(c.id)} 
                              disabled={tieneProductos}
                              title={tieneProductos ? "No se puede eliminar: tiene productos asociados" : "Eliminar categoría"}
                              className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                                  tieneProductos 
                                      ? 'text-slate-400 bg-slate-50 border-transparent cursor-not-allowed opacity-70' 
                                      : 'text-red-600 bg-white border-red-100 hover:bg-red-50 hover:border-red-200 hover:shadow-sm'
                              }`}
                          >
                              {tieneProductos ? (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Protegido
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Eliminar
                                </>
                              )}
                          </button>
                      </div>
                  );
              })}
              
              {categoriasFiltradas.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-slate-900 font-bold">No se encontraron categorías</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">
                          {busqueda 
                            ? `No hay resultados para "${busqueda}". Intenta con otro término.` 
                            : "Aún no has registrado ninguna categoría en el sistema."}
                      </p>
                  </div>
              )}
          </div>
        </div>
      </div>

    </div>
  );
}