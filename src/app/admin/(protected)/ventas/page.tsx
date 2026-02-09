import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import {
  Eye,
  Plus,
  ShoppingCart,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  CreditCard
} from "lucide-react";
import Pagination from "@/components/pagination";

export const dynamic = "force-dynamic";

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const currentPage = Number(sp?.page) || 1;
  const ITEMS_PER_PAGE = 50;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Obtener ventas paginadas y total
  const [totalVentas, ventas] = await prisma.$transaction([
    prisma.venta.count(),
    prisma.venta.findMany({
      take: ITEMS_PER_PAGE,
      skip,
      orderBy: { fechaVenta: 'desc' },
      include: {
        cliente: { select: { nombre: true } }
      }
    })
  ]);

  const totalPages = Math.ceil(totalVentas / ITEMS_PER_PAGE);

  // Métricas rápidas del listado actual
  const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.total), 0);
  const ticketPromedio = ventas.length > 0 ? totalIngresos / ventas.length : 0;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 bg-gray-50/50 min-h-screen">

      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Ventas</h1>
          </div>
          <p className="text-gray-500 text-sm ml-1 max-w-md">
            Monitorea el flujo de ingresos, gestiona facturación por WhatsApp y analiza el historial de caja.
          </p>
        </div>
        <Link
          href="/admin/ventas/nueva"
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3 active:scale-95 group"
        >
          <Plus className="w-5 h-5 text-emerald-400 group-hover:rotate-90 transition-transform" />
          <span>Nueva Venta (POS)</span>
        </Link>
      </div>

      {/* KPI Cards (Resumen Estratégico) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Ingresos"
          value={`S/ ${totalIngresos.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <StatCard
          label="Ticket Promedio"
          value={`S/ ${ticketPromedio.toFixed(2)}`}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Volumen de Ventas"
          value={`${ventas.length} Ops.`}
          icon={<Users className="w-5 h-5 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50/80 text-gray-400 font-black text-[10px] uppercase tracking-[0.15em] border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Código / Fecha</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5 text-center">Pago</th>
                <th className="px-8 py-5 text-right">Total Neto</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200">
                        <ShoppingCart className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-medium italic">No se registran transacciones recientes en el sistema.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 font-mono text-xs uppercase tracking-tighter">
                          #{v.codigo.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1 uppercase">
                          <Calendar className="w-3 h-3" />
                          {new Date(v.fechaVenta).toLocaleDateString('es-PE', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                          {(v.cliente?.nombre || v.clienteNombre || "P")[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900 line-clamp-1">
                          {v.cliente?.nombre || v.clienteNombre || "Público General"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                        <CreditCard className="w-3 h-3 opacity-50" />
                        {v.metodoPago}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-slate-900 text-base font-mono">
                        S/ {Number(v.total).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {v.estado === 'COMPLETADO' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                          Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-100 opacity-60">
                          ✕ {v.estado}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href={`/admin/ventas/${v.id}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg transition-all active:scale-90"
                        title="Ver ticket detallado"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Paginación */}
      <div className="flex justify-center pb-8">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}

// Subcomponente de Métrica
function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex items-center gap-5">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}