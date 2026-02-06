"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Truck,
    ArrowLeft,
    DollarSign,
    Package,
    Users,
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { DateRangePicker } from "../_components/date-range-picker";
import { ExportButtons } from "../_components/export-buttons";

interface ReporteCompras {
    resumen: {
        totalCompras: number;
        cantidadCompras: number;
        proveedoresActivos: number;
    };
    comprasPorProveedor: { nombre: string; total: number; compras: number }[];
    historialCostos: {
        fecha: string;
        producto: string;
        talla: string;
        color: string;
        cantidad: number;
        costoUnitario: number;
    }[];
}

function ComprasReporteContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<ReporteCompras | null>(null);
    const [loading, setLoading] = useState(true);

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);

            const res = await fetch(`/api/admin/reportes/compras?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
            setLoading(false);
        };
        fetchData();
    }, [from, to]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!data) {
        return <div className="text-center text-gray-500 py-20">Error al cargar los datos.</div>;
    }

    const exportHeaders = ["Fecha", "Producto", "Talla", "Color", "Cantidad", "Costo Unit."];
    const exportData = data.historialCostos.map((h) => [
        new Date(h.fecha).toLocaleDateString("es-PE"),
        h.producto,
        h.talla,
        h.color,
        h.cantidad,
        h.costoUnitario.toFixed(2),
    ]);

    return (
        <div className="space-y-8">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <DateRangePicker basePath="/admin/reportes/compras" />
                <ExportButtons
                    title="Reporte de Compras - ELARA ATELIER"
                    headers={exportHeaders}
                    data={exportData}
                    filename={`compras-${from || "todo"}-${to || "todo"}`}
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Invertido"
                    value={`S/ ${data.resumen.totalCompras.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                />
                <StatCard
                    label="Compras Realizadas"
                    value={`${data.resumen.cantidadCompras}`}
                    icon={<Package className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    label="Proveedores Activos"
                    value={`${data.resumen.proveedoresActivos}`}
                    icon={<Users className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                />
            </div>

            {/* Compras por Proveedor */}
            <ChartCard title="Compras por Proveedor" description="Top 10 proveedores por volumen de compra">
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.comprasPorProveedor} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={120} />
                            <Tooltip formatter={(value: number) => `S/ ${value.toFixed(2)}`} />
                            <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Historial de Costos */}
            <ChartCard title="Historial de Costos" description="Últimas compras con detalle de costo unitario">
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                        <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 sticky top-0 bg-white">
                            <tr>
                                <th className="text-left py-3 px-2">Fecha</th>
                                <th className="text-left py-3 px-2">Producto</th>
                                <th className="text-left py-3 px-2">Variante</th>
                                <th className="text-right py-3 px-2">Cantidad</th>
                                <th className="text-right py-3 px-2">Costo Unit.</th>
                                <th className="text-right py-3 px-2">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.historialCostos.map((h, i) => (
                                <tr key={i} className="hover:bg-amber-50/30">
                                    <td className="py-3 px-2 text-xs text-gray-500 font-mono">
                                        {new Date(h.fecha).toLocaleDateString("es-PE")}
                                    </td>
                                    <td className="py-3 px-2 font-bold text-gray-900">{h.producto}</td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">{h.talla}</span>
                                            <span>{h.color}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono">{h.cantidad}</td>
                                    <td className="py-3 px-2 text-right font-mono text-amber-700">
                                        S/ {h.costoUnitario.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono font-bold text-gray-900">
                                        S/ {(h.cantidad * h.costoUnitario).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ChartCard>
        </div>
    );
}

export default function ComprasReportePage() {
    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte de Compras</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-1 max-w-md">
                        Análisis de inversión por proveedor e historial de costos unitarios.
                    </p>
                </div>
                <Link
                    href="/admin/reportes"
                    className="bg-white text-slate-700 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Reportes
                </Link>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
                </div>
            }>
                <ComprasReporteContent />
            </Suspense>
        </div>
    );
}
