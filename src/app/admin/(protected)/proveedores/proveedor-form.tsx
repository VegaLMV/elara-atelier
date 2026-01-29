"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Proveedor = {
  id: string;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
};

export default function ProveedorForm({ initialData }: { initialData: Proveedor | null }) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [ruc, setRuc] = useState(initialData?.ruc ?? "");
  const [telefono, setTelefono] = useState(initialData?.telefono ?? "");
  const [correo, setCorreo] = useState(initialData?.correo ?? "");
  const [direccion, setDireccion] = useState(initialData?.direccion ?? "");

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);

    const body = {
      nombre: nombre.trim(),
      ruc: ruc.trim() || null,
      telefono: telefono.trim() || null,
      correo: correo.trim() || null,
      direccion: direccion.trim() || null,
    };

    const url = initialData ? `/api/admin/proveedores/${initialData.id}` : `/api/admin/proveedores`;
    const method = initialData ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setGuardando(false);

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error guardando proveedor");
      return;
    }

    router.push("/admin/proveedores");
    router.refresh();
  }

  async function eliminar() {
    if (!initialData) return;
    if (!confirm("¿Eliminar proveedor? (si tiene compras relacionadas, no se podrá)")) return;

    setError(null);
    setBorrando(true);

    const r = await fetch(`/api/admin/proveedores/${initialData.id}`, { method: "DELETE" });

    setBorrando(false);

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "No se pudo eliminar");
      return;
    }

    router.push("/admin/proveedores");
    router.refresh();
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{initialData ? "Editar proveedor" : "Nuevo proveedor"}</h1>
          <p className="text-sm opacity-80">Usa estos datos para compras e historial.</p>
        </div>

        <button className="border rounded-md px-3 py-2" type="button" onClick={() => router.push("/admin/proveedores")}>
          ← Volver
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={guardar} className="border rounded-xl p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-sm">Nombre</label>
          <input className="w-full border rounded-md px-3 py-2" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm">RUC (opcional)</label>
            <input className="w-full border rounded-md px-3 py-2" value={ruc} onChange={(e) => setRuc(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Teléfono (opcional)</label>
            <input className="w-full border rounded-md px-3 py-2" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Correo (opcional)</label>
            <input className="w-full border rounded-md px-3 py-2" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Dirección (opcional)</label>
            <input className="w-full border rounded-md px-3 py-2" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button disabled={guardando} className="bg-black text-white rounded-md px-4 py-2">
            {guardando ? "Guardando..." : "Guardar"}
          </button>

          {initialData && (
            <button
              type="button"
              disabled={borrando}
              className="border rounded-md px-4 py-2"
              onClick={eliminar}
            >
              {borrando ? "Eliminando..." : "Eliminar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
