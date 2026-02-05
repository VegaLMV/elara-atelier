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
  ArrowLeft
} from "lucide-react";

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
  initialData?: any; 
}

export default function ProveedorForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Inicialización del formulario
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

      toast.success(initialData ? "Proveedor actualizado" : "Proveedor creado");
      router.refresh();
      router.push("/admin/proveedores");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Eliminar este proveedor permanentemente?")) return;
    try {
      setLoading(true);
      await fetch(`/api/admin/proveedores/${initialData.id}`, {
        method: "DELETE",
      });
      toast.success("Proveedor eliminado");
      router.refresh();
      router.push("/admin/proveedores");
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  // Clases CSS reutilizables
  const inputClass = "flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all";
  const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block ml-1";
  const cardClass = "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden";

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <button 
                type="button" 
                onClick={() => router.back()} 
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className="text-2xl font-bold tracking-tight text-gray-900">
               {initialData ? "Editar Proveedor" : "Nuevo Proveedor"}
             </h1>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            Información fiscal y de contacto de tu aliado comercial.
          </p>
        </div>
        
        {initialData && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 h-10 px-4 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Datos Principales */}
        <div className={cardClass}>
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                 <Building2 className="w-4 h-4" />
              </span>
              Datos Generales
            </h3>
          </div>
          
          <div className="p-6 grid md:grid-cols-2 gap-6">
            
            <div className="col-span-2">
              <label className={labelClass}>Nombre Comercial <span className="text-red-500">*</span></label>
              <input
                {...register("nombre")}
                placeholder="Ej. Distribuidora Lima"
                className={inputClass}
              />
              {errors.nombre && <p className="text-xs text-red-500 mt-1 font-medium ml-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className={labelClass}>RUC</label>
              <div className="relative group">
                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  {...register("ruc")}
                  placeholder="20123456789"
                  className={`${inputClass} pl-10 font-mono`}
                />
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Razón Social</label>
              <input
                {...register("razonSocial")}
                placeholder="Ej. Inversiones Generales S.A.C."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Teléfono</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  {...register("telefono")}
                  placeholder="999 999 999"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className={labelClass}>Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                  {...register("correo")}
                  placeholder="contacto@empresa.com"
                  className={`${inputClass} pl-10`}
                />
              </div>
              {errors.correo && <p className="text-xs text-red-500 mt-1 font-medium ml-1">{errors.correo.message}</p>}
            </div>

          </div>
        </div>

        {/* Sección de Ubicación */}
        <div className={cardClass}>
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                 <MapPin className="w-4 h-4" />
              </span>
              Ubicación
            </h3>
          </div>
          
          <div className="p-6 grid md:grid-cols-3 gap-6">
            
            <div>
              <label className={labelClass}>Departamento</label>
              <input
                {...register("departamento")}
                placeholder="Ej. Lima"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Provincia</label>
              <input
                {...register("provincia")}
                placeholder="Ej. Lima"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Distrito</label>
              <input
                {...register("distrito")}
                placeholder="Ej. Miraflores"
                className={inputClass}
              />
            </div>

            <div className="col-span-3">
              <label className={labelClass}>Dirección Fiscal / Referencia</label>
              <input
                {...register("direccion")}
                placeholder="Av. Larco 123, Of. 405"
                className={inputClass}
              />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Proveedor
          </button>
        </div>

      </form>
    </div>
  );
}