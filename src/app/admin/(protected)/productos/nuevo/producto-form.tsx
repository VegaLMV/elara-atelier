"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Props = {
  categorias: { id: string; nombre: string }[];
};

export default function ProductoForm({ categorias }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
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
            precio: parseFloat(precio), // Aseguramos que sea número
            categoriaId: categoriaId || null // Enviamos la categoría
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Error al crear el producto");
      }

      const creado = await res.json();
      
      if (!creado?.id) throw new Error("No se recibió el ID del producto.");

      // Redirigir a la ficha del producto recién creado para subir fotos
      router.push(`/admin/productos/${creado.id}`);
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Encabezado del Formulario */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Datos Principales</h2>
        <span className="text-xs text-gray-400">Las imágenes se suben después de guardar</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Nombre */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Nombre del Producto <span className="text-red-500">*</span></label>
          <input 
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all placeholder:text-gray-300" 
            placeholder="Ej: Vestido Floral Verano"
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
          />
        </div>

        {/* Precio y Categoría (2 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Precio (S/) <span className="text-red-500">*</span></label>
                <div className="relative">
                    <span className="absolute left-4 top-2.5 text-gray-400">S/</span>
                    <input 
                        required
                        type="number" 
                        step="0.01"
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none" 
                        placeholder="0.00"
                        value={precio} 
                        onChange={(e) => setPrecio(e.target.value)} 
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Categoría</label>
                <select 
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none appearance-none"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                >
                    <option value="">-- Sin categoría --</option>
                    {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Descripción</label>
          <textarea 
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 min-h-[120px] focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none resize-none placeholder:text-gray-300" 
            placeholder="Detalles sobre materiales, corte, ocasión de uso..."
            value={descripcion} 
            onChange={(e) => setDescripcion(e.target.value)} 
          />
        </div>
      </div>

      {/* Footer con Errores y Botones */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex-1">
            {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 inline-block animate-in fade-in">
                    ⚠️ {error}
                </div>
            )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link 
                href="/admin/productos"
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-colors w-full sm:w-auto text-center"
            >
                Cancelar
            </Link>
            <button 
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md w-full sm:w-auto"
            >
                {loading ? "Creando..." : "Crear Producto →"}
            </button>
        </div>
      </div>
    </form>
  );
}