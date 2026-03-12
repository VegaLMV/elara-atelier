"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, MapPin, User, Building2, Mail } from "lucide-react";
import Link from "next/link";
import ClientesClient from "./clientes-client";

type Props = {
    initialData?: any;
    onSuccess?: (data: any) => void;
    isModal?: boolean;
};

/**
 * ============================================================================
 * FORMULARIO DE CLIENTE (CREAR / EDITAR)
 * ============================================================================
 * Formulario unificado para gestionar la información de clientes.
 * Maneja datos personales, fiscales (DNI/RUC) y de ubicación para delivery.
 */
export default function ClienteForm({ initialData, onSuccess, isModal }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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

        if (!form.nombre.trim()) {
            toast.error("Campo obligatorio", { description: "El nombre del cliente es requerido." });
            return;
        }

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

            if (!res.ok) throw new Error(data.error || "Error al procesar la solicitud");

            toast.success(initialData ? "Cliente actualizado" : "Cliente registrado con éxito");

            if (onSuccess) {
                onSuccess(data);
            } else {
                router.push("/admin/clientes");
                router.refresh();
            }
        } catch (error: any) {
            toast.error("Ocurrió un error", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`${isModal ? "" : "max-w-5xl mx-auto"} space-y-8 pb-10`}>

            {/* --- HEADER (Solo si no es modal) --- */}
            {!isModal && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Link
                            href="/admin/clientes"
                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {initialData ? "Editar Cliente" : "Nuevo Cliente"}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {initialData ? `Actualizando datos de ${initialData.nombre}` : "Registra un nuevo contacto en tu cartera."}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <Link
                            href="/admin/clientes"
                            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors text-center flex-1 sm:flex-none"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed flex-1 sm:flex-none active:scale-95"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* === SECCIÓN 1: DATOS PERSONALES (7 cols) === */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" /> Información General
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Completo <span className="text-red-500">*</span></label>
                                <input
                                    name="nombre"
                                    required
                                    value={form.nombre}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-gray-300 font-medium"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Documento (DNI/RUC)</label>
                                    <div className="relative mt-1">
                                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            name="dni"
                                            value={form.dni}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono"
                                            placeholder="00000000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Teléfono / WhatsApp</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-3 text-gray-400 text-xs font-bold">+51</span>
                                        <input
                                            name="telefono"
                                            value={form.telefono}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono"
                                            placeholder="999 999 999"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo Electrónico</label>
                                <div className="relative mt-1">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 pl-10 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-gray-300"
                                        placeholder="cliente@ejemplo.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Zona de Peligro (Solo Edición) */}
                    {initialData && (
                        <div className="pt-4">
                            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3 ml-1">Zona de Peligro</h3>
                            <ClientesClient id={initialData.id} ventasCount={initialData._count?.ventas || 0} />
                        </div>
                    )}
                </div>

                {/* === SECCIÓN 2: UBICACIÓN (5 cols) === */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500" /> Dirección de Entrega
                        </h3>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Departamento</label>
                                    <input
                                        name="departamento"
                                        value={form.departamento}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 p-2.5 rounded-lg mt-1 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="Ej: Lima"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Provincia</label>
                                        <input
                                            name="provincia"
                                            value={form.provincia}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 p-2.5 rounded-lg mt-1 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="Ej: Lima"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Distrito</label>
                                        <input
                                            name="distrito"
                                            value={form.distrito}
                                            onChange={handleChange}
                                            className="w-full border border-gray-200 p-2.5 rounded-lg mt-1 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                                            placeholder="Ej: Miraflores"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Dirección Exacta</label>
                                <input
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                    placeholder="Av. Larco 123, Dpto 401"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Referencia</label>
                                <input
                                    name="referencia"
                                    value={form.referencia}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 p-3 rounded-xl mt-1 focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-gray-300 text-sm"
                                    placeholder="Ej: Frente al parque, portón negro..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}