import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import { Eye, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // Obtener ventas (últimas 100 por rendimiento)
  const ventas = await prisma.venta.findMany({
    take: 100,
    orderBy: { fechaVenta: 'desc' },
    include: {
      cliente: { select: { nombre: true } }
    }
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Historial de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de transacciones y caja.</p>
        </div>
        <Link
          href="/admin/ventas/nueva"
          className="bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-bold hover:bg-slate-800 transition shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Venta (POS)
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Pago</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No hay ventas registradas aún.
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      #{v.codigo.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(v.fechaVenta).toLocaleDateString('es-PE', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {v.cliente?.nombre || v.clienteNombre || "Público General"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {v.metodoPago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      S/ {Number(v.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                       {v.estado === 'COMPLETADO' ? (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Exitoso</span>
                       ) : (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">{v.estado}</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/ventas/${v.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-slate-900 hover:text-white transition-all"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}