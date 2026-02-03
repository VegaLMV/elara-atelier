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
  // --- NUEVOS CAMPOS ---
  ciudad: string | null;
  provincia: string | null;
};

export default function ProveedorForm({ initialData }: { initialData: Proveedor | null }) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [ruc, setRuc] = useState(initialData?.ruc ?? "");
  const [telefono, setTelefono] = useState(initialData?.telefono ?? "");
  const [correo, setCorreo] = useState(initialData?.correo ?? "");
  const [direccion, setDireccion] = useState(initialData?.direccion ?? "");
  
  // Estados para los nuevos campos
  const [ciudad, setCiudad] = useState(initialData?.ciudad ?? "");
  const [provincia, setProvincia] = useState(initialData?.provincia ?? "");

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
      // Incluimos los nuevos campos en el payload
      ciudad: ciudad.trim() || null,
      provincia: provincia.trim() || null,
    };

    const url = initialData ? `/api/admin/proveedores/${initialData.id}` : `/api/admin/proveedores`;
    const method = initialData ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error guardando proveedor");
      setGuardando(false);
      return;
    }

    // Éxito: redirigir
    router.push("/admin/proveedores");
    router.refresh();
  }

  async function eliminar() {
    if (!initialData) return;
    if (!confirm("¿Eliminar este proveedor?\n\n⚠️ Si tiene historial de compras, no se podrá eliminar.")) return;

    setError(null);
    setBorrando(true);

    const r = await fetch(`/api/admin/proveedores/${initialData.id}`, { method: "DELETE" });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "No se pudo eliminar (probablemente tiene compras asociadas)");
      setBorrando(false);
      return;
    }

    router.push("/admin/proveedores");
    router.refresh();
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {initialData ? "Editar Proveedor" : "Registrar Proveedor"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Información de contacto y facturación.</p>
        </div>

        <button 
            className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
            type="button" 
            onClick={() => router.push("/admin/proveedores")}
        >
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-in slide-in-from-top-2">
            ⚠️ {error}
        </div>
      )}

      <form onSubmit={guardar} className="space-y-6">
        
        {/* Card Principal */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Datos Generales</h2>
            
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre / Razón Social <span className="text-red-500">*</span></label>
                <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400"
                    placeholder="Ej: Distribuidora Textil S.A.C."
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">RUC</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-mono"
                        placeholder="20123456789"
                        value={ruc} 
                        onChange={(e) => setRuc(e.target.value)} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        placeholder="999 888 777"
                        value={telefono} 
                        onChange={(e) => setTelefono(e.target.value)} 
                    />
                </div>
            </div>
        </div>

        {/* Card Ubicación y Contacto */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-4 mb-4">Ubicación y Contacto</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input 
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        placeholder="contacto@empresa.com"
                        value={correo} 
                        onChange={(e) => setCorreo(e.target.value)} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Dirección</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        placeholder="Av. Principal 123"
                        value={direccion} 
                        onChange={(e) => setDireccion(e.target.value)} 
                    />
                </div>

                {/* --- NUEVOS CAMPOS --- */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Ciudad</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        placeholder="Ej: Lima"
                        value={ciudad} 
                        onChange={(e) => setCiudad(e.target.value)} 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Provincia / Región</label>
                    <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        placeholder="Ej: Lima"
                        value={provincia} 
                        onChange={(e) => setProvincia(e.target.value)} 
                    />
                </div>
            </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-between pt-4">
          <button 
            disabled={guardando} 
            className="bg-slate-900 text-white rounded-lg px-8 py-3 font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
          >
            {guardando ? "Guardando..." : "Guardar Proveedor"}
          </button>

          {initialData && (
            <button
              type="button"
              disabled={borrando}
              className="text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              onClick={eliminar}
            >
              {borrando ? "Eliminando..." : "Eliminar Proveedor"}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}