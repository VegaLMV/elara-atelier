import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { StatCard } from "./_components/stat-card";
import {
    BarChart3,
    ShoppingCart,
    Package,
    Users,
    Truck,
    Tag,
    TrendingUp,
    DollarSign,
    ArrowRight,
    ScrollText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    // Obtener métricas generales del último mes
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);

    const [ventasMes, clientesActivos, productosVendidos, comprasMes, pedidosMes] = await Promise.all([
        // Total ventas último mes
        prisma.venta.aggregate({
            where: {
                fechaVenta: { gte: hace30Dias },
                estado: "COMPLETADO",
            },
            _sum: { total: true },
            _count: true,
        }),
        // Clientes con ventas este mes
        prisma.venta.groupBy({
            by: ["clienteId"],
            where: {
                fechaVenta: { gte: hace30Dias },
                clienteId: { not: null },
            },
        }),
        // Items vendidos este mes
        prisma.itemVenta.aggregate({
            where: {
                venta: {
                    fechaVenta: { gte: hace30Dias },
                    estado: "COMPLETADO",
                },
            },
            _sum: { cantidad: true },
        }),
        // Total compras último mes
        prisma.compra.aggregate({
            where: {
                fechaCompra: { gte: hace30Dias },
                estado: "RECIBIDO",
            },
            _count: true,
        }),
        // Total pedidos último mes
        prisma.pedido.aggregate({
            where: {
                creadoEn: { gte: hace30Dias },
            },
            _count: true,
        }),
    ]);

    const totalVentas = Number(ventasMes._sum.total || 0);
    const cantidadVentas = ventasMes._count;
    const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    const reporteSections = [
        {
            title: "Ventas",
            description: "Análisis de ingresos, métodos de pago y productos más vendidos",
            href: "/admin/reportes/ventas",
            icon: ShoppingCart,
            color: "bg-emerald-50 text-emerald-600",
        },
        {
            title: "Pedidos",
            description: "Estado de envíos, tasas de conversión y geografía",
            href: "/admin/reportes/pedidos",
            icon: Package,
            color: "bg-blue-50 text-blue-600",
        },
        {
            title: "Inventario",
            description: "Stock actual, alertas de productos bajos y valorización",
            href: "/admin/reportes/inventario",
            icon: BarChart3,
            color: "bg-slate-50 text-slate-600",
        },
        {
            title: "Clientes",
            description: "Clientes frecuentes, ubicación geográfica y saldos",
            href: "/admin/reportes/clientes",
            icon: Users,
            color: "bg-purple-50 text-purple-600",
        },
        {
            title: "Compras",
            description: "Compras por proveedor e historial de costos",
            href: "/admin/reportes/compras",
            icon: Truck,
            color: "bg-amber-50 text-amber-600",
        },
        {
            title: "Campañas",
            description: "Rendimiento de descuentos y promociones",
            href: "/admin/reportes/campanas",
            icon: Tag,
            color: "bg-rose-50 text-rose-600",
        },
    ];

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-10 bg-gray-50/50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reportes</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-1 max-w-md">
                        Centro de análisis y métricas del negocio. Visualiza tendencias, exporta datos y toma decisiones informadas.
                    </p>
                </div>
            </div>

            {/* KPIs del Último Mes */}
            <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ScrollText className="w-4 h-4" />
                    Resumen Últimos 30 Días
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                    <StatCard
                        label="Ingresos Totales"
                        value={`S/ ${totalVentas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                        icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                        color="bg-emerald-50"
                    />
                    <StatCard
                        label="Ventas Realizadas"
                        value={`${cantidadVentas}`}
                        icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
                        color="bg-blue-50"
                    />
                    <StatCard
                        label="Pedidos"
                        value={`${pedidosMes._count}`}
                        icon={<Package className="w-6 h-6 text-indigo-600" />}
                        color="bg-indigo-50"
                    />
                    <StatCard
                        label="Ticket Promedio"
                        value={`S/ ${ticketPromedio.toFixed(2)}`}
                        icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
                        color="bg-purple-50"
                    />
                    <StatCard
                        label="Clientes Activos"
                        value={`${clientesActivos.length}`}
                        icon={<Users className="w-6 h-6 text-rose-600" />}
                        color="bg-rose-50"
                    />
                    <StatCard
                        label="Compras"
                        value={`${comprasMes._count}`}
                        icon={<Truck className="w-6 h-6 text-amber-600" />}
                        color="bg-amber-50"
                    />
                </div>
            </div>

            {/* Navegación a Reportes */}
            <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Reportes Disponibles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reporteSections.map((section) => (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                                    <section.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                                        {section.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {section.description}
                                    </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
