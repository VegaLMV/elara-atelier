"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ClientesClient({ id, ventasCount }: { id: string, ventasCount: number }) {
  const router = useRouter();

  const eliminar = async () => {
    if (ventasCount > 0) return toast.error("No se puede eliminar: Tiene historial de compras.");
    if (!confirm("¿Eliminar este cliente permanentemente?")) return;

    const res = await fetch(`/api/admin/clientes/${id}`, { method: "DELETE" });
    if (res.ok) {
        toast.success("Cliente eliminado");
        router.refresh();
    } else {
        toast.error("Error al eliminar");
    }
  };

  return (
    <button 
        onClick={eliminar}
        disabled={ventasCount > 0}
        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${ventasCount > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
    >
        <Trash2 className="w-3 h-3" /> Eliminar
    </button>
  );
}