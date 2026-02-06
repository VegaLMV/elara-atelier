"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

type Props = {
  categorias: { id: string; nombre: string }[];
};

export default function ProductoForm({ categorias }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            nombre, 
            descripcion, 
            precio: parseFloat(precio), 
            categoriaId: categoriaId || null 
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Error al crear el producto");
      }

      const creado = await res.json();
      router.push(`/admin/productos/${creado.id}`);
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre del Producto</label>
          <input 
            required
            className="w-full border border-gray-200 bg-gray-50/50 rounded-xl px-5 py-4 text-lg font-medium text-gray-900 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all placeholder:text-gray-300" 
            placeholder="Ej: Vestido Floral Verano"
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Precio (S/)</label>
                <div className="relative">
                    <span className="absolute left-5 top-4 text-gray-400 font-bold">S/</span>
                    <input 
                        required
                        type="number" 
                        step="0.01"
                        className="w-full border border-gray-200 bg-gray-50/50 rounded-xl pl-12 pr-5 py-4 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all" 
                        placeholder="0.00"
                        value={precio} 
                        onChange={(e) => setPrecio(e.target.value)} 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Categoría</label>
                <div className="relative">
                    <select 
                        className="w-full border border-gray-200 bg-gray-50/50 rounded-xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none appearance-none cursor-pointer text-lg"
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                    >
                        <option value="">-- Sin categoría --</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                    <div className="absolute right-5 top-5 pointer-events-none text-gray-400">▼</div>
                </div>
            </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Descripción</label>
          <textarea 
            className="w-full border border-gray-200 bg-gray-50/50 rounded-xl px-5 py-4 text-gray-900 min-h-[120px] focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none resize-none placeholder:text-gray-300 text-base" 
            placeholder="Detalles sobre materiales, corte, ocasión de uso..."
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
          />
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                <span>⚠️</span> {error}
            </div>
        )}
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button 
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-3"
        >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Continuar"} <ArrowRight className="w-5 h-5 opacity-50" />
        </button>
      </div>
    </form>
  );
}