export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import DevolucionForm from "./devolucion-form";

/**
 * ============================================================================
 * PÁGINA: REGISTRO DE DEVOLUCIÓN / CAMBIO
 * ============================================================================
 * Esta página sirve como contenedor para el formulario inteligente de retornos.
 * Proporciona el contexto visual y la seguridad de sesión antes de cargar 
 * el componente cliente.
 */
export default async function NuevaDevolucionPage() {
   // 1. Verificación de Seguridad (Solo ADMIN puede gestionar stock/dinero de retorno)
   const sesion = await sesionAdmin();
   if (!sesion) {
      redirect("/admin/login");
   }

   return (
      <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">

         {/* --- CABECERA --- */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-8">
            <div className="flex items-center gap-4">
               <Link
                  href="/admin/devoluciones"
                  className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-100 text-gray-500 transition-all shadow-sm"
               >
                  <ArrowLeft className="w-5 h-5" />
               </Link>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                        Gestión Post-Venta
                     </span>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                     <RotateCcw className="w-8 h-8 text-indigo-600" />
                     Registrar Retorno
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                     Sincroniza stock y finanzas por cambios de talla o fallas de fábrica.
                  </p>
               </div>
            </div>
         </div>

         {/* --- FORMULARIO MAESTRO (CLIENT COMPONENT) --- */}
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DevolucionForm />
         </div>

      </div>
   );
}