"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function CategoriasClient({ initialRows }: { initialRows: any[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState(""); // Estado para el filtro
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
    if(!confirm("¿Eliminar categoría?")) return;
    await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
    router.refresh();
  }

  // Lógica de Filtrado
  const categoriasFiltradas = initialRows.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Formulario de Creación */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit sticky top-6">
        <h3 className="font-bold text-gray-900 mb-4">Nueva Categoría</h3>
        <form onSubmit={crear} className="space-y-4">
            <input 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                placeholder="Nombre (ej: Vestidos)"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
            />
            <button disabled={busy} className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                {busy ? "Guardando..." : "Guardar"}
            </button>
        </form>
      </div>

      {/* Lista con Filtro */}
      <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Header con Buscador */}
        <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-bold text-xs text-gray-500 uppercase">
                Listado ({categoriasFiltradas.length})
            </div>
            
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none bg-white"
                    placeholder="Buscar categoría..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>
        </div>

        {/* Resultados */}
        <div className="divide-y max-h-[600px] overflow-y-auto">
            {categoriasFiltradas.map(c => {
                const tieneProductos = c._count.productos > 0;
                
                return (
                    <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-semibold text-gray-900">{c.nombre}</p>
                            <p className="text-xs text-gray-400">/{c.slug} • {c._count.productos} productos</p>
                        </div>
                        
                        <button 
                            onClick={() => eliminar(c.id)} 
                            disabled={tieneProductos}
                            title={tieneProductos ? "No se puede eliminar: tiene productos asociados" : "Eliminar categoría"}
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                tieneProductos 
                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                            }`}
                        >
                            Eliminar
                        </button>
                    </div>
                );
            })}
            
            {categoriasFiltradas.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm">
                    {busqueda ? "No se encontraron coincidencias" : "Sin categorías registradas"}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}