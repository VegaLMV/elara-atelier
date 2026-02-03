"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, MapPin, Building2, Phone, Mail, FileText } from "lucide-react";

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
    if (!confirm("¿Eliminar este proveedor?")) return;
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

  // Clases CSS reutilizables para mantener el diseño limpio sin componentes externos
  const inputClass = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black disabled:cursor-not-allowed disabled:opacity-50";
  const labelClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block";
  const cardClass = "rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm";

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {initialData ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Información fiscal y de contacto del proveedor.
          </p>
        </div>
        {initialData && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-9 px-3"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Datos Principales */}
        <div className={cardClass}>
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Datos Generales
            </h3>
          </div>
          <div className="p-6 pt-0 grid md:grid-cols-2 gap-4">
            
            <div className="col-span-2">
              <label className={labelClass}>Nombre Proveedor</label>
              <input
                {...register("nombre")}
                placeholder="Ej. Distribuidora Lima"
                className={inputClass}
              />
              {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className={labelClass}>RUC</label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  {...register("ruc")}
                  placeholder="20123456789"
                  className={`${inputClass} pl-9`}
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
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  {...register("telefono")}
                  placeholder="999 999 999"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  {...register("correo")}
                  placeholder="contacto@empresa.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {errors.correo && <p className="text-sm text-red-500 mt-1">{errors.correo.message}</p>}
            </div>

          </div>
        </div>

        {/* Sección de Ubicación */}
        <div className={cardClass}>
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Ubicación
            </h3>
          </div>
          <div className="p-6 pt-0 grid md:grid-cols-3 gap-4">
            
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

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-10 px-4 py-2"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar Cambios
          </button>
        </div>

      </form>
    </div>
  );
}