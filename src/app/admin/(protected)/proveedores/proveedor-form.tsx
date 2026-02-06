"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Loader2, 
  Trash2, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  FileText, 
  Save,
  ArrowLeft,
  Briefcase
} from "lucide-react";
import Link from "next/link";

// 1. Schema de validación
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre comercial es obligatorio"),
  razonSocial: z.string().optional(),
  ruc: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  
  // Ubicación
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  direccion: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  initialData?: any; // Si existe, modo edición
}

/**
 * ============================================================================
 * FORMULARIO MAESTRO DE PROVEEDORES
 * ============================================================================
 * Maneja la creación y edición de proveedores.
 * Valida datos fiscales (RUC) y de contacto.
 */
export default function ProveedorForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Inicialización React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      razonSocial: initialData?.razonSocial || "",
      ruc: initialData?.ruc || "",
      telefono: initialData?.telefono || "",
      correo: initialData?.correo || "",
      departamento: initialData?.departamento || "",
      provincia: initialData?.provincia || "",
      distrito: initialData?.distrito || "",
      direccion: initialData?.direccion || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      const url = initialData
        ? `/api/admin/proveedores/${initialData.id}`
        : `/api/admin/proveedores`;
      
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      toast.success(initialData ? "Proveedor actualizado correctamente" : "Proveedor registrado con éxito");
      router.refresh();
      router.push("/admin/proveedores");
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este proveedor? Esta acción es irreversible.")) return;
    try {
      setLoading(true);
      await fetch(`/api/admin/proveedores/${initialData.id}`, { method: "DELETE" });
      
      toast.success("Proveedor eliminado");
      router.refresh();
      router.push("/admin/proveedores");
    } catch (error) {
      toast.error("Error al eliminar", { description: "Verifica si tiene compras asociadas." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-6 md:p-8 pb-24">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
             <Link 
                href="/admin/proveedores" 
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
             >
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div>
                 <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                   {initialData ? "Editar Proveedor" : "Nuevo Proveedor"}
                 </h1>
                 <p className="text-sm text-gray-500">
                   {initialData ? `Actualizando a: ${initialData.nombre}` : "Registra un nuevo socio comercial."}
                 </p>
             </div>
        </div>
        
        <div className="flex gap-3">
            {initialData && (
              <button
                type="button"
                onClick={onDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 h-11 px-5 transition-colors disabled:opacity-50 border border-transparent"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-11"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
              Guardar Cambios
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA 1: DATOS EMPRESARIALES (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Briefcase className="w-4 h-4 text-blue-600" /> Información Comercial
                    </h3>
                </div>
                
                <div className="p-6 space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Nombre Comercial <span className="text-red-500">*</span></label>
                        <input
                            {...register("nombre")}
                            placeholder="Ej. Distribuidora Lima S.A.C."
                            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-gray-300 font-medium text-slate-900"
                        />
                        {errors.nombre && <p className="text-xs text-red-500 mt-1 font-bold ml-1">{errors.nombre.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">RUC</label>
                            <div className="relative group">
                                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    {...register("ruc")}
                                    placeholder="20123456789"
                                    className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Razón Social</label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    {...register("razonSocial")}
                                    placeholder="Ej. Inversiones Generales"
                                    className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-50">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Teléfono</label>
                            <div className="relative group">
                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    {...register("telefono")}
                                    placeholder="999 999 999"
                                    className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    {...register("correo")}
                                    placeholder="ventas@proveedor.com"
                                    className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                                />
                            </div>
                            {errors.correo && <p className="text-xs text-red-500 mt-1 font-bold ml-1">{errors.correo.message}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA 2: UBICACIÓN (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <MapPin className="w-4 h-4 text-amber-600" /> Dirección Fiscal
                    </h3>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">Departamento</label>
                            <input
                                {...register("departamento")}
                                placeholder="Ej. Lima"
                                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">Provincia</label>
                                <input
                                    {...register("provincia")}
                                    placeholder="Ej. Lima"
                                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block mb-1">Distrito</label>
                                <input
                                    {...register("distrito")}
                                    placeholder="Ej. Miraflores"
                                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-1">Dirección Exacta</label>
                        <textarea
                            {...register("direccion")}
                            placeholder="Av. Larco 123, Of. 405..."
                            className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none h-24 resize-none"
                        />
                    </div>
                </div>
            </div>
        </div>

      </div>
    </form>
  );
}