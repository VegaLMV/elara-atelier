"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * ============================================================================
 * COMPONENTE CLIENTE: BOTÓN DE ELIMINAR
 * ============================================================================
 * Maneja la eliminación lógica o física de un cliente.
 * Bloquea la acción si el cliente tiene historial de compras (ventasCount > 0)
 * para mantener la integridad referencial de la base de datos.
 */
export default function ClientesClient({ id, ventasCount }: { id: string, ventasCount: number }) {
  const router = useRouter();

  const eliminar = async () => {
    // 1. Validación de Integridad
    if (ventasCount > 0) {
        toast.error("Acción bloqueada", { description: "No se puede eliminar un cliente con historial de compras." });
        return;
    }

    // 2. Confirmación
    if (!confirm("¿Eliminar este cliente permanentemente? Esta acción no se puede deshacer.")) return;

    // 3. Ejecución
    const res = await fetch(`/api/admin/clientes/${id}`, { method: "DELETE" });
    
    if (res.ok) {
        toast.success("Cliente eliminado correctamente");
        router.refresh();
        router.push("/admin/clientes");
    } else {
        toast.error("Error al eliminar", { description: "Ocurrió un problema en el servidor." });
    }
  };

  return (
    <button 
        type="button"
        onClick={eliminar}
        disabled={ventasCount > 0}
        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${
            ventasCount > 0 
            ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' 
            : 'bg-white text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200'
        }`}
    >
        <Trash2 className="w-4 h-4" />
        {ventasCount > 0 ? "No se puede eliminar (Con Historial)" : "Eliminar Cliente"}
    </button>
  );
}