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
    Users,
    Image as ImageIcon
} from "lucide-react";
import { ChartCard } from "../_components/chart-card";
import { StatCard } from "../_components/stat-card";
import { ExportButtons } from "../_components/export-buttons";
import { ReportCustomizer } from "../_components/report-customizer";

interface ReporteInventario {
    resumen: {
        valorizacionTotal: number;
        stockTotal: number;
        variantesActivas: number;
        variantesSinStock: number;
        alertasStockBajo: number;
    };
    stockPorCategoria: { categoria: string; stock: number }[];
    stockPorProducto: { producto: string; stock: number }[];
    alertasStock: {
        id: string; // Added ID for variants
        producto: string;
        talla: string;
        color: string;
        colorHex: string;
        stockActual: number;
        stockMinimo: number;
        valorUnitario: number;
        imagenUrl?: string | null;
        proveedor?: {
            nombre: string;
            ruc: string;
            razonSocial?: string;
            telefono?: string;
            provincia?: string;
            distrito?: string;
            direccion?: string;
        } | null;
    }[];
}

const ALL_COLUMNS = [
    { id: "imagen", label: "Imagen", enabled: true },
    { id: "producto", label: "Producto", enabled: true },
    { id: "talla", label: "Talla", enabled: true },
    { id: "color", label: "Color", enabled: true },
    { id: "stockActual", label: "Stock Actual", enabled: true },
    { id: "stockMinimo", label: "Stock Mínimo", enabled: true },
    { id: "valorUnitario", label: "Valor Unit.", enabled: true },
];

function getColorStyle(hex: string | null) {
    if (!hex) return { backgroundColor: '#e2e8f0' }; // slate-200
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    
    if (codes.length <= 1) return { backgroundColor: codes[0] || '#e2e8f0' };

    // Si hay dos o más colores, hacemos un corte vertical limpio al 50%
    // Esto evita sombras o mezclas entre los dos tonos
    return { 
        background: `linear-gradient(90deg, ${codes[0]} 0%, ${codes[0]} 50%, ${codes[1]} 50%, ${codes[1]} 100%)` 
    };
}

export default function InventarioReportePage() {
    const [data, setData] = useState<ReporteInventario | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para personalización
    const [columns, setColumns] = useState(ALL_COLUMNS);
    const [note, setNote] = useState("");

    // Estado para el gráfico
    const [chartView, setChartView] = useState<"categoria" | "producto">("categoria");

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

    // Preparar proveedores únicos de las alertas
    const proveedoresUnicos = Array.from(new Map(
        data.alertasStock
            .filter(a => a.proveedor)
            .map(a => [a.proveedor!.ruc, a.proveedor!])
    ).values());

    const exportTables = [
        {
            title: "Directorio de Proveedores Sugeridos",
            headers: ["Nombre Comercial", "RUC", "Razón Social", "Teléfono", "Ubicación", "Dirección"],
            data: proveedoresUnicos.map(p => [
                p.nombre,
                p.ruc,
                p.razonSocial || "-",
                p.telefono || "-",
                `${p.provincia || ""} - ${p.distrito || ""}`,
                p.direccion || "-"
            ])
        },
        {
            title: "Inventario con Stock Bajo",
            headers: columns.filter(c => c.enabled).map(c => c.label),
            data: data.alertasStock.map((a) => {
                const row: (string | number)[] = [];
                if (columns.find(c => c.id === "imagen")?.enabled) row.push(a.imagenUrl || "");
                if (columns.find(c => c.id === "producto")?.enabled) {
                    const prodName = a.proveedor ? `${a.producto} - ${a.proveedor.nombre}` : a.producto;
                    row.push(prodName);
                }
                if (columns.find(c => c.id === "talla")?.enabled) row.push(a.talla);
                if (columns.find(c => c.id === "color")?.enabled) {
                    const hex = a.colorHex || "#ccc";
                    row.push(`${hex}|${a.color}`);
                }
                if (columns.find(c => c.id === "stockActual")?.enabled) row.push(a.stockActual);
                if (columns.find(c => c.id === "stockMinimo")?.enabled) row.push(a.stockMinimo);
                if (columns.find(c => c.id === "valorUnitario")?.enabled) row.push(a.valorUnitario);
                return row;
            })
        }
    ];

    const exportMetadata = {
        note,
        filters: {
            "Tipo": "Reporte de Inventario y Contactos",
            "Fecha": new Date().toLocaleDateString("es-PE"),
            "Alertas": `${data.alertasStock.length} productos`
        }
    };

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
                    title="Reporte de Inventario y Directorio"
                    filename={`Inventario_Reporte_${new Date().toISOString().split('T')[0]}`}
                    metadata={exportMetadata}
                    tables={exportTables}
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

            {/* Gráfico Stock */}
            <ChartCard
                title={
                    <div className="flex items-center justify-between w-full">
                        <span>Stock {chartView === "categoria" ? "por Categoría" : "por Producto"}</span>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setChartView("categoria")}
                                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${chartView === "categoria"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Categorías
                            </button>
                            <button
                                onClick={() => setChartView("producto")}
                                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${chartView === "producto"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Productos (Top 10)
                            </button>
                        </div>
                    </div>
                }
                description={chartView === "categoria" ? "Unidades disponibles por categoría" : "Productos con mayor cantidad de stock"}
            >
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartView === "categoria" ? data.stockPorCategoria : data.stockPorProducto}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey={chartView === "categoria" ? "categoria" : "producto"}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                interval={0}
                                tickFormatter={(value: string) => value.length > 15 ? `${value.substring(0, 12)}...` : value}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v: number) => v.toString()} />
                            <Tooltip
                                contentStyle={{ borderRadius: "1rem", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                            />
                            <Bar
                                dataKey="stock"
                                fill={chartView === "categoria" ? "#3b82f6" : "#8b5cf6"}
                                radius={[4, 4, 0, 0]}
                                name="Unidades"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* Directorio de Proveedores */}
            <ChartCard
                title={
                    <span className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Directorio de Proveedores Sugeridos ({proveedoresUnicos.length})
                    </span>
                }
                description="Contactos de los proveedores según las últimas compras de productos con stock bajo"
            >
                {proveedoresUnicos.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay proveedores registrados en compras recientes para estos productos.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-2">Nombre Comercial</th>
                                    <th className="text-left py-3 px-2">RUC / Razón Social</th>
                                    <th className="text-left py-3 px-2">Teléfono</th>
                                    <th className="text-left py-3 px-2">Ubicación / Dirección</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {proveedoresUnicos.map((p, i) => (
                                    <tr key={i} className="hover:bg-indigo-50/30">
                                        <td className="py-3 px-2 font-bold text-gray-900">{p.nombre}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs">{p.ruc}</span>
                                                <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{p.razonSocial || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 font-medium text-slate-700">{p.telefono || "Sin teléfono"}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs">{p.provincia} - {p.distrito}</span>
                                                <span className="text-[10px] text-gray-400 italic truncate max-w-[250px]">{p.direccion}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
                                    <th className="text-left py-3 px-2">Imagen</th>
                                    <th className="text-left py-3 px-2">Producto - Proveedor</th>
                                    <th className="text-left py-3 px-2">Variante</th>
                                    <th className="text-right py-3 px-2">Stock Actual</th>
                                    <th className="text-right py-3 px-2">Mínimo</th>
                                    <th className="text-right py-3 px-2">Faltante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.alertasStock.map((a, i) => (
                                    <tr key={i} className="hover:bg-indigo-50/20 group transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="w-10 h-12 rounded-lg bg-white border border-slate-100 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                                {a.imagenUrl ? (
                                                    <img src={a.imagenUrl} alt={a.producto} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                        <ImageIcon className="w-4 h-4 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 font-bold text-gray-900">
                                            {a.producto}
                                            {a.proveedor && (
                                                <span className="ml-2 text-[10px] font-normal text-slate-400 px-2 py-0.5 bg-slate-100 rounded-lg">
                                                    {a.proveedor.nombre}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                    {a.talla}
                                                </span>
                                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-slate-200 bg-white shadow-sm">
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-black/5 shadow-inner ring-1 ring-slate-100 ring-offset-1"
                                                        style={getColorStyle(a.colorHex)}
                                                    />
                                                    <span className="text-[11px] font-bold text-slate-700">{a.color}</span>
                                                </div>
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
