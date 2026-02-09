"use client";

import * as React from "react";
import { useEffect, useState, Suspense, useMemo } from "react";
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
    Search,
    FileStack,
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
        productosComprados: number;
    };
    comprasPorProveedor: { nombre: string; total: number; compras: number }[];
    comprasPorProducto: { nombre: string; total: number; cantidad: number }[];
    historialCostos: {
        fecha: string;
        proveedor: string;
        producto: string;
        talla: string;
        color: string;
        colorHex: string;
        cantidad: number;
        costoUnitario: number;
    }[];
}

function ComprasReporteContent() {
    const searchParams = useSearchParams();
    const [data, setData] = React.useState<ReporteCompras | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState("");
    const [chartView, setChartView] = React.useState<"proveedor" | "producto">("proveedor");
    const [reportMode, setReportMode] = React.useState<"general" | "detallado">("general");

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    React.useEffect(() => {
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

    const displayItems = React.useMemo(() => {
        if (!data) return [];
        const filtered = data.historialCostos.filter(h =>
            h.producto.toLowerCase().includes(search.toLowerCase()) ||
            h.color.toLowerCase().includes(search.toLowerCase()) ||
            h.proveedor.toLowerCase().includes(search.toLowerCase())
        );

        if (reportMode !== "general") return filtered;

        const grouped = new Map<string, any>();
        filtered.forEach(h => {
            if (!grouped.has(h.producto)) {
                grouped.set(h.producto, { ...h, cantidad: 0, total: 0 });
            }
            const item = grouped.get(h.producto);
            item.cantidad += h.cantidad;
            item.total += (h.cantidad * h.costoUnitario);
        });
        return Array.from(grouped.values());
    }, [data, search, reportMode]);

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

    const exportHeaders = reportMode === "general"
        ? ["Última Compra", "Producto", "Proveedor", "Cantidad", "Costo Unit.", "Total"]
        : ["Fecha", "Proveedor", "Producto", "Talla", "Color", "Cantidad", "Costo Unit.", "Total"];

    const exportData = reportMode === "general"
        ? (() => {
            const grouped = new Map<string, { fecha: string; producto: string; proveedor: string; cantidad: number; total: number; costoUnitario: number }>();
            data.historialCostos.forEach(h => {
                const totalItem = (h.cantidad * h.costoUnitario);
                if (!grouped.has(h.producto)) {
                    grouped.set(h.producto, {
                        fecha: h.fecha,
                        producto: h.producto,
                        proveedor: h.proveedor,
                        cantidad: 0,
                        total: 0,
                        costoUnitario: h.costoUnitario
                    });
                }
                const item = grouped.get(h.producto)!;
                item.cantidad += h.cantidad;
                item.total += totalItem;
            });
            return Array.from(grouped.values()).map(g => [
                new Date(g.fecha).toLocaleDateString("es-PE"),
                g.producto,
                g.proveedor,
                g.cantidad,
                g.costoUnitario.toFixed(2),
                g.total.toFixed(2),
            ]);
        })()
        : data.historialCostos.map((h) => [
            new Date(h.fecha).toLocaleDateString("es-PE"),
            h.proveedor,
            h.producto,
            h.talla,
            `${h.colorHex}|${h.color}`,
            h.cantidad,
            h.costoUnitario.toFixed(2),
            (h.cantidad * h.costoUnitario).toFixed(2),
        ]);
    return (
        <div className="space-y-8">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <DateRangePicker basePath="/admin/reportes/compras" />
                <div className="flex items-center gap-4">
                    <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        <button
                            onClick={() => setReportMode("general")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${reportMode === "general"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <FileStack className="w-3.5 h-3.5" /> General
                        </button>
                        <button
                            onClick={() => setReportMode("detallado")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${reportMode === "detallado"
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <FileStack className="w-3.5 h-3.5" /> Detallado
                        </button>
                    </div>
                    <ExportButtons
                        title={`Reporte de Compras (${reportMode.toUpperCase()}) - ELARA ATELIER`}
                        headers={exportHeaders}
                        data={exportData}
                        filename={`compras-${reportMode}-${from || "todo"}-${to || ""}`}
                        metadata={{
                            filters: {
                                "Periodo": from && to ? `${new Date(from).toLocaleDateString("es-PE")} al ${new Date(to).toLocaleDateString("es-PE")}` : "Histórico completo"
                            }
                        }}
                    />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Total Invertido"
                    value={`S/ ${data.resumen.totalCompras.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Compras Realizadas"
                    value={`${data.resumen.cantidadCompras}`}
                    icon={<Truck className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    label="Artículos Comprados"
                    value={`${data.resumen.productosComprados}`}
                    icon={<Package className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                />
                <StatCard
                    label="Proveedores"
                    value={`${data.resumen.proveedoresActivos}`}
                    icon={<Users className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                />
            </div>

            {/* Gráficos de Compras */}
            <ChartCard
                title={
                    <div className="flex items-center justify-between w-full">
                        <span>Análisis de Compras</span>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setChartView("proveedor")}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartView === "proveedor"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Por Proveedor
                            </button>
                            <button
                                onClick={() => setChartView("producto")}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartView === "producto"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Por Producto
                            </button>
                        </div>
                    </div>
                }
                description={chartView === "proveedor" ? "Top 10 proveedores por volumen de compra" : "Top 10 productos con mayor inversión"}
            >
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartView === "proveedor" ? data.comprasPorProveedor : data.comprasPorProducto}
                            layout="vertical"
                            margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                            <XAxis type="number" tickFormatter={(v: number) => `S/${v}`} tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={140} />
                            <Tooltip
                                formatter={(value: any) => `S/ ${Number(value).toFixed(2)}`}
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                            />
                            <Bar
                                dataKey="total"
                                fill={chartView === "proveedor" ? "#f59e0b" : "#8b5cf6"}
                                radius={[0, 4, 4, 0]}
                                barSize={25}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Historial de Costos */}
            <ChartCard
                title={
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <span>Historial de Costos</span>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto, color o proveedor..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                }
                description="Últimas compras con detalle de costo unitario y proveedor"
            >
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm">
                        <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 sticky top-0 bg-white">
                            <tr>
                                <th className="text-left py-3 px-2">{reportMode === "general" ? "Última Compra" : "Fecha"}</th>
                                <th className="text-left py-3 px-2">Proveedor</th>
                                <th className="text-left py-3 px-2">Producto</th>
                                {reportMode === "detallado" && (
                                    <th className="text-left py-3 px-2">Variante</th>
                                )}
                                <th className="text-right py-3 px-2">Cantidad</th>
                                <th className="text-right py-3 px-2">Costo Unit.</th>
                                <th className="text-right py-3 px-2">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayItems.map((h: any, i: number) => (
                                <tr key={i} className="hover:bg-amber-50/30">
                                    <td className="py-3 px-2 text-[10px] text-gray-500 font-mono">
                                        {new Date(h.fecha).toLocaleDateString("es-PE")}
                                    </td>
                                    <td className="py-3 px-2">
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                            {h.proveedor}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 font-bold text-gray-900">{h.producto}</td>
                                    {reportMode === "detallado" && (
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{h.talla}</span>
                                                <span className="italic">{h.color}</span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-3 px-2 text-right font-mono text-xs">{h.cantidad}</td>
                                    <td className="py-3 px-2 text-right font-mono text-xs text-amber-700">
                                        S/ {h.costoUnitario.toFixed(2)}
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono font-bold text-gray-900 border-l border-gray-50">
                                        S/ {(reportMode === "general" ? h.total : h.cantidad * h.costoUnitario).toFixed(2)}
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
