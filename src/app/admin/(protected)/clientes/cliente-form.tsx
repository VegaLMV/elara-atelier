"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, MapPin, User } from "lucide-react";
import Link from "next/link";

type Props = {
  initialData?: any; // Si llega, es EDICIÓN
};

export default function ClienteForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Estado único para todos los campos
  const [form, setForm] = useState({
    nombre: initialData?.nombre || "",
    dni: initialData?.dni || "",
    telefono: initialData?.telefono || "",
    email: initialData?.email || "",
    departamento: initialData?.departamento || "",
    provincia: initialData?.provincia || "",
    distrito: initialData?.distrito || "",
    direccion: initialData?.direccion || "",
    referencia: initialData?.referencia || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error("El nombre es obligatorio");
    
    setLoading(true);
    const url = initialData ? `/api/admin/clientes/${initialData.id}` : "/api/admin/clientes";
    const method = initialData ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al guardar");

      toast.success(initialData ? "Cliente actualizado" : "Cliente creado");
      router.push("/admin/clientes");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/clientes" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
                {initialData ? "Editar Cliente" : "Nuevo Cliente"}
            </h1>
        </div>
        <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Datos Personales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Datos Personales
              </h3>
              
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo *</label>
                  <input name="nombre" required value={form.nombre} onChange={handleChange} className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 ring-slate-900 outline-none" placeholder="Ej: Juan Pérez" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">DNI / RUC</label>
                      <input name="dni" value={form.dni} onChange={handleChange} className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 ring-slate-900 outline-none" placeholder="00000000" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                      <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 ring-slate-900 outline-none" placeholder="999..." />
                  </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Email (Opcional)</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 ring-slate-900 outline-none" placeholder="cliente@email.com" />
              </div>
          </div>

          {/* 2. Dirección y Delivery */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 h-fit">
              <h3 className="font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" /> Ubicación (Delivery)
              </h3>

              <div className="grid grid-cols-3 gap-3">
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Departamento</label>
                      <input name="departamento" value={form.departamento} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1 text-sm" placeholder="Ica" />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Provincia</label>
                      <input name="provincia" value={form.provincia} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1 text-sm" placeholder="Ica" />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Distrito</label>
                      <input name="distrito" value={form.distrito} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1 text-sm" placeholder="Parcona" />
                  </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Dirección Exacta</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 ring-slate-900 outline-none" placeholder="Av. Principal 123" />
              </div>

              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Referencia</label>
                  <input name="referencia" value={form.referencia} onChange={handleChange} className="w-full border p-2.5 rounded-lg mt-1 focus:ring-2 ring-slate-900 outline-none" placeholder="Ej: Portón negro, frente al parque" />
              </div>
          </div>
      </div>
    </form>
  );
}