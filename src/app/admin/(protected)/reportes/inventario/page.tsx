"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    Package,
    ArrowLeft,
    AlertTriangle,
    DollarSign,
    Layers,
    PackageX,
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { ExportButtons } from "../_components/export-buttons";

interface ReporteInventario {
    resumen: {
        valorizacionTotal: number;
        stockTotal: number;
        variantesActivas: number;
        variantesSinStock: number;
        alertasStockBajo: number;
    };
    stockPorCategoria: { categoria: string; stock: number }[];
    alertasStock: {
        producto: string;
        talla: string;
        color: string;
        colorHex: string;
        stockActual: number;
        stockMinimo: number;
        valorUnitario: number;
    }[];
}

export default function InventarioReportePage() {
    const [data, setData] = useState<ReporteInventario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/admin/reportes/inventario");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-10 flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center text-gray-500">Error al cargar los datos.</div>
        );
    }

    const exportHeaders = ["Producto", "Talla", "Color", "Stock Actual", "Stock Mínimo", "Valor Unit."];
    const exportData = data.alertasStock.map((a) => [
        a.producto,
        a.talla,
        a.color,
        a.stockActual,
        a.stockMinimo,
        a.valorUnitario.toFixed(2),
    ]);

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                            <Package className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte de Inventario</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-1 max-w-md">
                        Estado actual del stock, valorización y alertas de productos bajos.
                    </p>
                </div>
                <Link
                    href="/admin/reportes"
                    className="bg-white text-slate-700 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Reportes
                </Link>
            </div>

            {/* Exportar */}
            <div className="flex justify-end">
                <ExportButtons
                    title="Reporte de Inventario - ELARA ATELIER"
                    headers={exportHeaders}
                    data={exportData}
                    filename="inventario-alertas"
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Valorización Total"
                    value={`S/ ${data.resumen.valorizacionTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Unidades en Stock"
                    value={`${data.resumen.stockTotal.toLocaleString()}`}
                    icon={<Layers className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    label="Variantes Activas"
                    value={`${data.resumen.variantesActivas}`}
                    icon={<Package className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                />
                <StatCard
                    label="Sin Stock"
                    value={`${data.resumen.variantesSinStock}`}
                    icon={<PackageX className="w-6 h-6 text-red-600" />}
                    color="bg-red-50"
                />
            </div>

            {/* Gráfico Stock por Categoría */}
            <ChartCard title="Stock por Categoría" description="Unidades disponibles por categoría de producto">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.stockPorCategoria}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip />
                            <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Alertas de Stock Bajo */}
            <ChartCard
                title={
                    <span className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Alertas de Stock Bajo ({data.alertasStock.length})
                    </span>
                }
                description="Productos con stock por debajo del mínimo configurado"
            >
                {data.alertasStock.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay productos con stock bajo. ¡Excelente!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-2">Producto</th>
                                    <th className="text-left py-3 px-2">Variante</th>
                                    <th className="text-right py-3 px-2">Stock Actual</th>
                                    <th className="text-right py-3 px-2">Mínimo</th>
                                    <th className="text-right py-3 px-2">Faltante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.alertasStock.map((a, i) => (
                                    <tr key={i} className="hover:bg-red-50/30">
                                        <td className="py-3 px-2 font-bold text-gray-900">{a.producto}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{a.talla}</span>
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <span
                                                        className="w-3 h-3 rounded-full border border-gray-200"
                                                        style={{ backgroundColor: a.colorHex }}
                                                    />
                                                    {a.color}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={`font-mono font-bold ${a.stockActual === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                                                {a.stockActual}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right font-mono text-gray-500">{a.stockMinimo}</td>
                                        <td className="py-3 px-2 text-right font-mono font-bold text-red-600">
                                            -{a.stockMinimo - a.stockActual}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ChartCard>
        </div>
    );
}
