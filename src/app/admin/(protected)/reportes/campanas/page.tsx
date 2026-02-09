"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Tag,
    ArrowLeft,
    Percent,
    DollarSign,
    ShoppingBag,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { ExportButtons } from "../_components/export-buttons";

interface ReporteCampanas {
    resumen: {
        totalCampanas: number;
        campanasActivas: number;
        descuentosTotales: number;
        ingresosTotales: number;
        itemsConDescuento: number;
    };
    campanas: {
        id: string;
        nombre: string;
        descripcion: string | null;
        tipo: string;
        valor: number;
        estado: string;
        inicio: string;
        fin: string;
        productosCount: number;
        productos: string[];
    }[];
    estadosData: { estado: string; cantidad: number }[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const estadoConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    ACTIVO: { label: "Activo", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    PROGRAMADO: { label: "Programado", icon: Clock, color: "text-blue-600 bg-blue-50 border-blue-200" },
    FINALIZADO: { label: "Finalizado", icon: Calendar, color: "text-gray-600 bg-gray-50 border-gray-200" },
    CANCELADO: { label: "Cancelado", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
};

export default function CampanasReportePage() {
    const [data, setData] = useState<ReporteCampanas | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/admin/reportes/campanas");
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
        return <div className="p-6 text-center text-gray-500">Error al cargar los datos.</div>;
    }

    const exportHeaders = ["Campaña", "Tipo", "Valor", "Estado", "Inicio", "Fin", "Productos"];
    const exportData = data.campanas.map((c) => [
        c.nombre,
        c.tipo,
        c.tipo === "PORCENTAJE" ? `${c.valor}%` : `S/ ${c.valor}`,
        c.estado,
        new Date(c.inicio).toLocaleDateString("es-PE"),
        new Date(c.fin).toLocaleDateString("es-PE"),
        c.productosCount,
    ]);

    const tasaDescuento = data.resumen.ingresosTotales > 0
        ? (data.resumen.descuentosTotales / (data.resumen.ingresosTotales + data.resumen.descuentosTotales)) * 100
        : 0;

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/20">
                            <Tag className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte de Campañas</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-1 max-w-md">
                        Análisis de promociones, descuentos otorgados e impacto en ventas.
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
                    title="Reporte de Campañas - ELARA ATELIER"
                    headers={exportHeaders}
                    data={exportData}
                    filename="campanas"
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Campañas"
                    value={`${data.resumen.totalCampanas}`}
                    icon={<Tag className="w-6 h-6 text-rose-600" />}
                    color="bg-rose-50"
                />
                <StatCard
                    label="Activas Ahora"
                    value={`${data.resumen.campanasActivas}`}
                    icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Descuentos Otorgados"
                    value={`S/ ${data.resumen.descuentosTotales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={<Percent className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                />
                <StatCard
                    label="Tasa de Descuento"
                    value={`${tasaDescuento.toFixed(1)}%`}
                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribución por Estado */}
                <ChartCard title="Campañas por Estado" description="Distribución de estados">
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.estadosData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="cantidad"
                                    nameKey="estado"
                                >
                                    {data.estadosData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Métricas de Impacto */}
                <ChartCard title="Impacto de Descuentos" description="Resumen de ahorro para clientes" className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Ingresos Brutos</p>
                            <p className="text-2xl font-black text-emerald-900">
                                S/ {(data.resumen.ingresosTotales + data.resumen.descuentosTotales).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-2xl border border-amber-200">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Ahorro Clientes</p>
                            <p className="text-2xl font-black text-amber-900">
                                S/ {data.resumen.descuentosTotales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Ingresos Netos</p>
                            <p className="text-2xl font-black text-blue-900">
                                S/ {data.resumen.ingresosTotales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Items con Descuento</p>
                            <p className="text-2xl font-black text-purple-900">
                                {data.resumen.itemsConDescuento}
                            </p>
                        </div>
                    </div>
                </ChartCard>
            </div>

            {/* Lista de Campañas */}
            <ChartCard title="Historial de Campañas" description="Todas las promociones registradas">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-2">Campaña</th>
                                <th className="text-left py-3 px-2">Descuento</th>
                                <th className="text-center py-3 px-2">Estado</th>
                                <th className="text-left py-3 px-2">Período</th>
                                <th className="text-right py-3 px-2">Productos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.campanas.map((c) => {
                                const config = estadoConfig[c.estado] || estadoConfig.FINALIZADO;
                                const IconEstado = config.icon;

                                return (
                                    <tr key={c.id} className="hover:bg-rose-50/30">
                                        <td className="py-3 px-2">
                                            <p className="font-bold text-gray-900">{c.nombre}</p>
                                            {c.descripcion && (
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{c.descripcion}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded-lg text-xs font-bold border border-rose-100">
                                                {c.tipo === "PORCENTAJE" ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                                                {c.tipo === "PORCENTAJE" ? `${c.valor}%` : `S/ ${c.valor}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
                                                <IconEstado className="w-3 h-3" />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-xs text-gray-500">
                                            {new Date(c.inicio).toLocaleDateString("es-PE")} — {new Date(c.fin).toLocaleDateString("es-PE")}
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                <ShoppingBag className="w-3 h-3" />
                                                {c.productosCount}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </ChartCard>
        </div>
    );
}
