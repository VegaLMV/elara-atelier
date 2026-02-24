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
    Package,
    ArrowLeft,
    TrendingUp,
    ShoppingCart,
    Truck,
    MapPin,
    Activity,
    DollarSign,
    XCircle,
    Clock,
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { DateRangePicker } from "../_components/date-range-picker";
import { ExportButtons } from "../_components/export-buttons";
import { ReportCustomizer } from "../_components/report-customizer";

interface ReportePedidos {
    resumen: {
        totalPedidos: number;
        montoProyectado: number;
        tasaConversion: number;
        tasaCancelacion: number;
        pedidosPendientes: number;
        ticketPromedioEnvio: number;
    };
    estados: { estado: string; cantidad: number }[];
    evolucion: { fecha: string; cantidad: number; monto: number }[];
    topRegiones: { departamento: string; cantidad: number }[];
    detalleGeografico: {
        departamento: string;
        distrito: string;
        cantidad: number;
        promedioEnvio: number;
    }[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1"];

const ALL_COLUMNS = [
    { id: "departamento", label: "Departamento", enabled: true },
    { id: "distrito", label: "Distrito", enabled: true },
    { id: "cantidad", label: "Pedidos", enabled: true },
    { id: "promedioEnvio", label: "Envío Promedio (S/)", enabled: true },
];

function PedidosReporteContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<ReportePedidos | null>(null);
    const [loading, setLoading] = useState(true);

    const [columns, setColumns] = useState(ALL_COLUMNS);
    const [note, setNote] = useState("");

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);

            const res = await fetch(`/api/admin/reportes/pedidos?${params.toString()}`);
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

    // Configuración de exportación
    const enabledColumns = columns.filter(c => c.enabled);
    const exportHeaders = enabledColumns.map(c => c.label);
    const exportData = data.detalleGeografico.map((row) => {
        const result: (string | number)[] = [];
        if (columns.find(c => c.id === "departamento")?.enabled) result.push(row.departamento);
        if (columns.find(c => c.id === "distrito")?.enabled) result.push(row.distrito);
        if (columns.find(c => c.id === "cantidad")?.enabled) result.push(row.cantidad);
        if (columns.find(c => c.id === "promedioEnvio")?.enabled) result.push(row.promedioEnvio.toFixed(2));
        return result;
    });

    const exportMetadata = {
        note,
        filters: {
            "Desde": from || "Inicio",
            "Hasta": to || "Hoy",
            "Tipo": "Reporte Estratégico de Pedidos"
        }
    };

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Filtros */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                    <DateRangePicker basePath="/admin/reportes/pedidos" />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <ReportCustomizer
                        columns={columns}
                        onColumnsChange={setColumns}
                        onNoteChange={setNote}
                        currentNote={note}
                    />
                    <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                    <ExportButtons
                        title="Reporte de Pedidos"
                        headers={exportHeaders}
                        data={exportData}
                        filename={`reporte-pedidos-${from || "todo"}`}
                        metadata={exportMetadata}
                    />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
                <StatCard
                    label="Total de Pedidos"
                    value={data.resumen.totalPedidos.toString()}
                    icon={<Package className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    label="Monto Proyectado"
                    value={`S/ ${data.resumen.montoProyectado.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Tasa de Conversión"
                    value={`${data.resumen.tasaConversion.toFixed(1)}%`}
                    icon={<Activity className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-50"
                />
                <StatCard
                    label="Tasa de Cancelación"
                    value={`${data.resumen.tasaCancelacion.toFixed(1)}%`}
                    icon={<XCircle className="w-6 h-6 text-red-600" />}
                    color="bg-red-50"
                />
                <StatCard
                    label="Pedidos Pendientes"
                    value={data.resumen.pedidosPendientes.toString()}
                    icon={<Clock className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                />
                <StatCard
                    label="Promedio de Envío"
                    value={`S/ ${data.resumen.ticketPromedioEnvio.toFixed(2)}`}
                    icon={<Truck className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Evolución de Pedidos"
                    description="Picos de demanda en el tiempo"
                    className="lg:col-span-2"
                >
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.evolucion}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="fecha"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(v) => v.split("-").slice(1).reverse().join("/")}
                                />
                                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="cantidad"
                                    name="Cant. Pedidos"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="monto"
                                    name="Monto (S/)"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Estados de Pedido"
                    description="Radiografía logística: distribución actual de los estados de pedido"
                >
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.estados}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="cantidad"
                                    nameKey="estado"
                                    label={(props) => `${props.name}: ${props.value}`}
                                >
                                    {data.estados.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <ChartCard
                    title="Top Regiones de Envío"
                    description="Ranking de departamentos que más solicitan envíos"
                >
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topRegiones} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis dataKey="departamento" type="category" tick={{ fontSize: 10 }} width={80} />
                                <Tooltip cursor={{ fill: "#f8fafc" }} />
                                <Bar dataKey="cantidad" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Tabla Detalle Geográfico */}
            <ChartCard title="Detalle Geográfico" description="Desglose por departamento y distrito">
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 hide-scrollbar whitespace-nowrap">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 border-b border-gray-100">Departamento</th>
                                <th className="px-4 py-3 border-b border-gray-100">Distrito</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-center">Pedidos</th>
                                <th className="px-4 py-3 border-b border-gray-100 text-right">Envío Promedio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {data.detalleGeografico.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-900">{row.departamento}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.distrito}</td>
                                    <td className="px-4 py-3 text-center font-mono font-bold">{row.cantidad}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                                        S/ {row.promedioEnvio.toFixed(2)}
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

export default function PedidosReportePage() {
    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto space-y-6 md:space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 border-b border-gray-200 pb-6 md:pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 sm:p-2.5 bg-slate-900 text-white rounded-xl sm:rounded-2xl shadow-xl shadow-slate-900/20 shrink-0">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Reporte de Pedidos</h1>
                    </div>
                    <p className="text-gray-500 text-xs sm:text-sm ml-1 max-w-lg">
                        Análisis estratégico de logística, conversión de ventas y distribución regional de envíos.
                    </p>
                </div>
                <Link
                    href="/admin/reportes"
                    className="w-full md:w-auto justify-center bg-white text-slate-700 border border-gray-200 rounded-xl px-5 py-2.5 sm:py-3 md:py-2.5 text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Reportes
                </Link>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
                </div>
            }>
                <PedidosReporteContent />
            </Suspense>
        </div>
    );
}
