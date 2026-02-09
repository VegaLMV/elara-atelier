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
    Users,
    ArrowLeft,
    MapPin,
    Wallet,
    UserCheck,
    Crown,
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { ExportButtons } from "../_components/export-buttons";
import { ReportCustomizer } from "../_components/report-customizer";

interface ReporteClientes {
    resumen: {
        totalClientes: number;
        clientesConCompras: number;
        saldosTotalesPendientes: number;
        clientesConSaldo: number;
    };
    topClientes: {
        id: string;
        nombre: string;
        telefono: string;
        email: string;
        departamento: string;
        totalCompras: number;
        cantidadVentas: number;
    }[];
    distribucionGeografica: { departamento: string; cantidad: number }[];
    saldosPendientes: {
        id: string;
        nombre: string;
        telefono: string;
        saldo: number;
    }[];
}

const ALL_COLUMNS = [
    { id: "nombre", label: "Cliente", enabled: true },
    { id: "telefono", label: "Teléfono", enabled: true },
    { id: "email", label: "Email", enabled: true },
    { id: "departamento", label: "Departamento", enabled: true },
    { id: "totalCompras", label: "Total Compras", enabled: true },
    { id: "cantidadVentas", label: "Nº Ventas", enabled: true },
];

export default function ClientesReportePage() {
    const [data, setData] = useState<ReporteClientes | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para personalización
    const [columns, setColumns] = useState(ALL_COLUMNS);
    const [note, setNote] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/admin/reportes/clientes");
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

    // Preparar datos para exportación dinámicamente
    const enabledColumns = columns.filter(c => c.enabled);
    const exportHeaders = enabledColumns.map(c => c.label);

    const exportData = data.topClientes.map((c) => {
        const row: (string | number)[] = [];
        if (columns.find(col => col.id === "nombre")?.enabled) row.push(c.nombre);
        if (columns.find(col => col.id === "telefono")?.enabled) row.push(c.telefono || "");
        if (columns.find(col => col.id === "email")?.enabled) row.push(c.email || "");
        if (columns.find(col => col.id === "departamento")?.enabled) row.push(c.departamento || "");
        if (columns.find(col => col.id === "totalCompras")?.enabled) row.push(c.totalCompras.toFixed(2));
        if (columns.find(col => col.id === "cantidadVentas")?.enabled) row.push(c.cantidadVentas);
        return row;
    });

    const exportMetadata = {
        note,
        filters: {
            "Tipo": "Reporte de Clientes TOP",
            "Fecha": new Date().toLocaleDateString("es-PE")
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-purple-500 text-white rounded-2xl shadow-xl shadow-purple-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reporte de Clientes</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-1 max-w-md">
                        Análisis de clientes frecuentes, distribución geográfica y saldos a favor.
                    </p>
                </div>
                <Link
                    href="/admin/reportes"
                    className="bg-white text-slate-700 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Reportes
                </Link>
            </div>

            {/* Exportar y Personalizar */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <ReportCustomizer
                    columns={columns}
                    onColumnsChange={setColumns}
                    onNoteChange={setNote}
                    currentNote={note}
                />
                <div className="w-px h-8 bg-gray-100 hidden md:block" />
                <ExportButtons
                    title="Reporte de Clientes"
                    headers={exportHeaders}
                    data={exportData}
                    filename="clientes-top"
                    metadata={exportMetadata}
                />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Clientes"
                    value={`${data.resumen.totalClientes}`}
                    icon={<Users className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                />
                <StatCard
                    label="Con Compras"
                    value={`${data.resumen.clientesConCompras}`}
                    icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
                    color="bg-emerald-50"
                />
                <StatCard
                    label="Saldos Pendientes"
                    value={`S/ ${data.resumen.saldosTotalesPendientes.toFixed(2)}`}
                    icon={<Wallet className="w-6 h-6 text-amber-600" />}
                    color="bg-amber-50"
                />
                <StatCard
                    label="Con Saldo a Favor"
                    value={`${data.resumen.clientesConSaldo}`}
                    icon={<Crown className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución Geográfica */}
                <ChartCard title="Distribución Geográfica" description="Clientes por departamento">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.distribucionGeografica} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v.toString()} />
                                <YAxis type="category" dataKey="departamento" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip />
                                <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Saldos a Favor */}
                <ChartCard
                    title={
                        <span className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-amber-500" />
                            Saldos a Favor Pendientes
                        </span>
                    }
                    description="Créditos pendientes de clientes"
                >
                    {data.saldosPendientes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No hay saldos a favor pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto">
                            {data.saldosPendientes.map((s) => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                    <div>
                                        <p className="font-bold text-gray-900">{s.nombre}</p>
                                        {s.telefono && <p className="text-xs text-gray-500">{s.telefono}</p>}
                                    </div>
                                    <span className="font-mono font-bold text-amber-700">S/ {s.saldo.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Top Clientes */}
            <ChartCard title="Top 20 Clientes por Compras" description="Clientes con mayor volumen de compras">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-2">#</th>
                                <th className="text-left py-3 px-2">Cliente</th>
                                <th className="text-left py-3 px-2">Contacto</th>
                                <th className="text-left py-3 px-2">Ubicación</th>
                                <th className="text-right py-3 px-2">Compras</th>
                                <th className="text-right py-3 px-2">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.topClientes.map((c, i) => (
                                <tr key={c.id} className="hover:bg-purple-50/30">
                                    <td className="py-3 px-2 font-bold text-gray-400">{i + 1}</td>
                                    <td className="py-3 px-2 font-bold text-gray-900">{c.nombre}</td>
                                    <td className="py-3 px-2 text-xs text-gray-500">
                                        {c.telefono || c.email || "-"}
                                    </td>
                                    <td className="py-3 px-2">
                                        {c.departamento ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" /> {c.departamento}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono">{c.cantidadVentas}</td>
                                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">
                                        S/ {c.totalCompras.toFixed(2)}
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
