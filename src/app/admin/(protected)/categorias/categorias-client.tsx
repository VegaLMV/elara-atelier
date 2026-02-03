"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CategoriasClient({ initialRows }: { initialRows: any[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Formulario */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
        <h3 className="font-bold text-gray-900 mb-4">Nueva Categoría</h3>
        <form onSubmit={crear} className="space-y-4">
            <input 
                className="w-full border p-2 rounded-lg"
                placeholder="Nombre (ej: Vestidos)"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
            />
            <button disabled={busy} className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                {busy ? "Guardando..." : "Guardar"}
            </button>
        </form>
      </div>

      {/* Lista */}
      <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b font-bold text-xs text-gray-500 uppercase">Listado</div>
        <div className="divide-y">
            {initialRows.map(c => (
                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <p className="font-semibold text-gray-900">{c.nombre}</p>
                        <p className="text-xs text-gray-400">/{c.slug} • {c._count.productos} productos</p>
                    </div>
                    <button onClick={() => eliminar(c.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                        Eliminar
                    </button>
                </div>
            ))}
            {initialRows.length === 0 && <div className="p-8 text-center text-gray-400">Sin categorías</div>}
        </div>
      </div>
    </div>
  );
}