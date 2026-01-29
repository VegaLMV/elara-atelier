"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NuevoProducto() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("0");
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const r = await fetch("/api/admin/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, descripcion, precio }),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error al crear");
      return;
    }

      const creado = await r.json();

        if (!creado?.id) {
          setError("No se recibió el ID del producto (revisa el endpoint).");
          return;
        }

      router.push(`/admin/productos/${creado.id}`);
  }

  return (
    <div className="p-6 max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo producto</h1>

      <form onSubmit={guardar} className="space-y-3 border rounded-xl p-4">
        <div className="space-y-1">
          <label className="text-sm">Nombre</label>
          <input className="w-full border rounded-md px-3 py-2" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Descripción</label>
          <textarea className="w-full border rounded-md px-3 py-2" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Precio (S/)</label>
          <input className="w-full border rounded-md px-3 py-2" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <button className="bg-black text-white rounded-md px-4 py-2">Crear</button>
      </form>
    </div>
  );
}
