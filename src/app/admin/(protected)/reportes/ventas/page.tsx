"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import {
    ShoppingCart,
    ArrowLeft,
    DollarSign,
    TrendingUp,
    Percent,
    CreditCard,
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { DateRangePicker } from "../_components/date-range-picker";
import { ExportButtons } from "../_components/export-buttons";

interface ReporteVentas {
    resumen: {
        totalIngresos: number;
        totalDescuentos: number;
        cantidadVentas: number;
        ticketPromedio: number;
    };
    ventasPorPeriodo: { fecha: string; total: number }[];
    metodosPago: { metodo: string; total: number; cantidad: number }[];
    productosTop: {
        producto: string;
        talla: string;
        color: string;
        colorHex: string;
        cantidad: number;
        ingresos: number;
    }[];
    canales: { canal: string; total: number; cantidad: number }[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

function VentasReporteContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<ReporteVentas | null>(null);
    const [loading, setLoading] = useState(true);

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);

            const res = await fetch(`/api/admin/reportes/ventas?${params.toString()}`);
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
        return (
            <div className="text-center text-gray-500 py-20">
                Error al cargar los datos del reporte.
            </div>
        );
    }

    // Preparar datos para exportación
    const exportHeaders = ["Producto", "Talla", "Color", "Cantidad", "Ingresos (S/)"];
    const exportData = data.productosTop.map((p) => [
        p.producto,
        p.talla,
        p.color,
        p.cantidad,
        p.ingresos.toFixed(2),
    ]);

    return (
        <div className="space-y-8">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <DateRangePicker basePath="/admin/reportes/ventas" />
                <ExportButtons
                    title="Reporte de Ventas - ELARA ATELIER"
                    headers={exportHeaders}
                    data={exportData}
                    filename={`ventas-${from || "todo"}-${to || "todo"}`}
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Ingresos Totales"
                    value={`S/ ${data.resumen.totalIngresos.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Ventas Realizadas"
                    value={`${data.resumen.cantidadVentas}`}
                    icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    label="Ticket Promedio"
                    value={`S/ ${data.resumen.ticketPromedio.toFixed(2)}`}
                    icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                />
                <StatCard
                    label="Descuentos Otorgados"
                    value={`S/ ${data.resumen.totalDescuentos.toFixed(2)}`}
                    icon={<Percent className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ventas por Período */}
                <ChartCard
                    title="Ventas por Período"
                    description="Evolución de ingresos en el tiempo"
                    className="lg:col-span-2"
                >
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.ventasPorPeriodo}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="fecha"
                                    tick={{ fontSize: 11, fill: "#6b7280" }}
                                    tickFormatter={(v) => {
                                        const d = new Date(v);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "#6b7280" }}
                                    tickFormatter={(v) => `S/${v}`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`S/ ${value.toFixed(2)}`, "Ingresos"]}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString("es-PE")}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: "#10b981", strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Ventas por Método de Pago */}
                <ChartCard title="Métodos de Pago" description="Distribución por forma de pago">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.metodosPago}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ metodo, percent }) => `${metodo} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="total"
                                    nameKey="metodo"
                                >
                                    {data.metodosPago.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `S/ ${value.toFixed(2)}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Ventas por Canal */}
                <ChartCard title="Canales de Venta" description="Origen de las ventas">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.canales} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="canal" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip formatter={(value: number) => `S/ ${value.toFixed(2)}`} />
                                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Tabla de Productos Top */}
            <ChartCard title="Top 10 Productos Más Vendidos" description="Productos con mayor volumen de ventas">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-2">#</th>
                                <th className="text-left py-3 px-2">Producto</th>
                                <th className="text-left py-3 px-2">Variante</th>
                                <th className="text-right py-3 px-2">Cantidad</th>
                                <th className="text-right py-3 px-2">Ingresos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.productosTop.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-2 font-bold text-gray-400">{i + 1}</td>
                                    <td className="py-3 px-2 font-bold text-gray-900">{p.producto}</td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{p.talla}</span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <span
                                                    className="w-3 h-3 rounded-full border border-gray-200"
                                                    style={{ backgroundColor: p.colorHex }}
                                                />
                                                {p.color}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono font-bold text-gray-900">{p.cantidad}</td>
                                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">
                                        S/ {p.ingresos.toFixed(2)}
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

export default function VentasReportePage() {
    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-500/20">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte de Ventas</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-1 max-w-md">
                        Análisis detallado de ingresos, métodos de pago y productos más vendidos.
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
                <VentasReporteContent />
            </Suspense>
        </div>
    );
}
