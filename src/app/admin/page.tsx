import { obtenerSesion } from "@/lib/sesion";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Package,
    AlertTriangle,
    Tag,
    Zap,
    ShoppingCart,
    ClipboardList,
    TicketPercent,
    Users,
    Truck,
    Ruler,
    Palette,
    ExternalLink,
    Plus,
    LayoutGrid,
    Box,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    History,
    BarChart4,
    Settings
} from "lucide-react";
import { ChartCard } from "./(protected)/reportes/_components/chart-card";
import { StatCard } from "./(protected)/reportes/_components/stat-card";
import { formatMoney } from "@/lib/precios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminHome() {
    const sesion = await obtenerSesion();
    if (!sesion) redirect("/admin/login");

    // --- DATOS REALES PARA EL DASHBOARD ---
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hoy.getDate() - 30);
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));

    const [
        totalProductos,
        totalCategorias,
        campanasActivas,
        ultimasVentas,
        ventasHoy,
        pedidosPendientes,
        metricasMes,
        movimientosMes,
        empaquesMes,
        nuevosClientesMes,
        devolucionesMes
    ] = await Promise.all([
        // 1. Productos Activos
        prisma.producto.count({ where: { estado: 'ACTIVO' } }),

        // 2. Total Categorías
        prisma.categoria.count(),

        // 3. Campañas Activas
        prisma.campana.count({
            where: {
                estado: { notIn: ['CANCELADO', 'FINALIZADO'] },
                startsAt: { lte: new Date() },
                endsAt: { gte: new Date() }
            }
        }),

        // 4. Últimas 5 Ventas
        prisma.venta.findMany({
            take: 5,
            orderBy: { fechaVenta: 'desc' },
            include: { cliente: { select: { nombre: true } } }
        }),

        // 5. Ventas de Hoy
        prisma.venta.aggregate({
            _sum: { total: true },
            where: { fechaVenta: { gte: inicioHoy }, estado: "COMPLETADO" }
        }),

        // 6. Pedidos Pendientes
        prisma.pedido.count({
            where: { estado: 'PENDIENTE' }
        }).catch(() => 0),

        // 7. Métricas del Mes (Ventas y Descuentos)
        prisma.venta.aggregate({
            where: { fechaVenta: { gte: hace30Dias }, estado: "COMPLETADO" },
            _sum: { total: true },
            _count: true
        }),

        // 8. COGS Histórico (Movimientos de Venta)
        prisma.movimientoInventario.findMany({
            where: {
                venta: { fechaVenta: { gte: hace30Dias }, estado: "COMPLETADO" },
                tipo: "VENTA"
            },
            select: { costoUnitario: true, cambioCantidad: true }
        }),

        // 9. Costos de Empaque (Mes)
        prisma.usoEmpaque.aggregate({
            where: {
                venta: { fechaVenta: { gte: hace30Dias }, estado: "COMPLETADO" }
            },
            _sum: { costoTotal: true }
        }),

        // 10. Crecimiento: Nuevos Clientes
        prisma.cliente.count({
            where: { creadoEn: { gte: hace30Dias } }
        }),

        // 11. Riesgo: Devoluciones
        prisma.devolucion.count({
            where: { creadoEn: { gte: hace30Dias } }
        })
    ]);

    // Cálculos Financieros
    const totalVentasMes = Number(metricasMes._sum.total || 0);
    const totalCostoVentas = movimientosMes.reduce((acc, m) => {
        const costo = Number(m.costoUnitario || 0);
        const cantidad = Math.abs(m.cambioCantidad);
        return acc + (costo * cantidad);
    }, 0);
    const totalCostoEmpaque = Number(empaquesMes._sum.costoTotal || 0);
    const utilidadBrutaMes = totalVentasMes - totalCostoVentas - totalCostoEmpaque;

    const variantesParaAlertas = await prisma.variante.findMany({
        where: {
            activa: true,
            producto: { estado: 'ACTIVO' }
        },
        select: { stockActual: true, stockMinimo: true }
    });

    const totalAlertasStock = variantesParaAlertas.filter(v => v.stockActual < v.stockMinimo).length;
    const totalVentasHoy = Number(ventasHoy._sum.total || 0);

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-white min-h-screen">

            {/* 1. Header de Bienvenida con Fecha */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Panel de Control
                        </span>
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-slate-900 tracking-tight">
                        Hola, {sesion.rol === 'ADMIN' ? 'Admin' : 'Colaborador'}
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base font-light">
                        Aquí tienes el pulso de <b>Elara Atelier</b> en tiempo real.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/tienda"
                        target="_blank"
                        className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                        <ExternalLink className="w-4 h-4" /> Tienda
                    </Link>
                    <Link
                        href="/admin/pedidos"
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Nuevo Pedido
                    </Link>
                </div>
            </div>

            {/* 2. BENTO GRID - KPIs Principales (6 columnas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

                <StatCard
                    label="Ventas Hoy"
                    value={formatMoney(totalVentasHoy)}
                    icon={<TicketPercent className="w-6 h-6 text-white" />}
                    color="bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                />

                <StatCard
                    label="Utilidad (30d)"
                    value={formatMoney(utilidadBrutaMes)}
                    icon={<BarChart4 className="w-6 h-6 text-white" />}
                    color="bg-emerald-600 text-white shadow-xl shadow-emerald-500/20"
                />

                <StatCard
                    label="Pedidos Pendientes"
                    value={pedidosPendientes.toString()}
                    icon={<ClipboardList className="w-6 h-6 text-white" />}
                    color={pedidosPendientes > 0 ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20" : "bg-teal-500 text-white shadow-xl shadow-teal-500/20"}
                    trend={pedidosPendientes > 0 ? { value: pedidosPendientes, label: "pendientes" } : undefined}
                />

                <StatCard
                    label="Alertas Stock"
                    value={totalAlertasStock.toString()}
                    icon={<AlertTriangle className="w-6 h-6 text-white" />}
                    color={totalAlertasStock > 0 ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"}
                />

                <StatCard
                    label="Nuevos Clientes"
                    value={nuevosClientesMes.toString()}
                    icon={<Users className="w-6 h-6 text-white" />}
                    color="bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                />

                <StatCard
                    label="Devoluciones"
                    value={devolucionesMes.toString()}
                    icon={<History className="w-6 h-6 text-white" />}
                    color={devolucionesMes > 0 ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20" : "bg-slate-400 text-white shadow-xl shadow-slate-400/20"}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">

                {/* 3. Columna Principal: Accesos y Feed */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Accesos Rápidos (Grid estilo App iOS) */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" /> Accesos Directos
                        </h2>

                        {/* Se actualizó a grid-cols-3 md:grid-cols-5 para acomodar el nuevo botón mejor */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

                            {/* NUEVO BOTÓN: Pedidos */}
                            <QuickActionButton
                                href="/admin/pedidos"
                                icon={<ClipboardList className="w-6 h-6 text-teal-600" />}
                                label="Gestión Pedidos"
                                color="bg-teal-50 border-teal-100 hover:border-teal-300"
                            />

                            <QuickActionButton
                                href="/admin/productos"
                                icon={<Package className="w-6 h-6 text-indigo-600" />}
                                label="Productos"
                                color="bg-indigo-50 border-indigo-100 hover:border-indigo-300"
                            />
                            <QuickActionButton
                                href="/admin/ventas"
                                icon={<ShoppingCart className="w-6 h-6 text-emerald-600" />}
                                label="Historial Ventas"
                                color="bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                            />
                            <QuickActionButton
                                href="/admin/devoluciones"
                                icon={<History className="w-6 h-6 text-orange-600" />}
                                label="Devoluciones"
                                color="bg-orange-50 border-orange-100 hover:border-orange-300"
                            />
                            <QuickActionButton
                                href="/admin/clientes"
                                icon={<Box className="w-6 h-6 text-blue-600" />}
                                label="Clientes"
                                color="bg-blue-50 border-blue-100 hover:border-blue-300"
                            />
                            <QuickActionButton
                                href="/admin/compras"
                                icon={<Truck className="w-6 h-6 text-slate-600" />}
                                label="Compras"
                                color="bg-slate-50 border-slate-100 hover:border-slate-300"
                            />
                            <QuickActionButton
                                href="/admin/descuentos"
                                icon={<TicketPercent className="w-6 h-6 text-purple-600" />}
                                label="Campañas descuento"
                                color="bg-purple-50 border-purple-100 hover:border-purple-300"
                            />
                            <QuickActionButton
                                href="/admin/reportes"
                                icon={<BarChart4 className="w-6 h-6 text-rose-600" />}
                                label="Reportes"
                                color="bg-rose-50 border-rose-100 hover:border-rose-300"
                            />
                            <QuickActionButton
                                href="/admin/tienda"
                                icon={<Settings className="w-6 h-6 text-blue-600" />}
                                label="Ajustes Tienda"
                                color="bg-blue-50 border-blue-100 hover:border-blue-300"
                            />
                        </div>
                    </div>

                    {/* Actividad Reciente (Feed) */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <History className="w-4 h-4" /> Actividad Reciente
                            </h2>
                            <Link href="/admin/ventas" className="text-xs font-bold text-indigo-600 hover:underline">Ver Todo</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {ultimasVentas.length === 0 ? (
                                <p className="p-8 text-center text-gray-400 text-sm italic">No hay actividad registrada aún.</p>
                            ) : (
                                ultimasVentas.map((venta) => (
                                    <div key={venta.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                V
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Venta #{venta.codigo}</p>
                                                <p className="text-xs text-gray-500">{venta.clienteNombre || venta.cliente?.nombre || "Público General"} • {new Date(venta.fechaVenta).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-sm">{formatMoney(Number(venta.total))}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Completado</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Estado Sidebar & Chart Lateral */}
                <div className="space-y-6">

                    {/* Chart Card Simplificada */}
                    <ChartCard title="Resumen Semanal" description="Tendencia de ventas vs objetivo" className="h-80">
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                                <TrendingDown className="w-8 h-8 text-indigo-300 transform rotate-180" />
                            </div>
                            <p className="text-gray-400 text-xs px-8">
                                Visualización gráfica de métricas disponible en el módulo completo de reportes.
                            </p>
                            <Link href="/admin/reportes/ventas" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                                Ver Reporte Detallado
                            </Link>
                        </div>
                    </ChartCard>

                    {/* Configuración Rápida */}
                    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-lg font-serif">Configuración</h3>
                            <div className="space-y-2">
                                <ConfigLink href="/admin/tallas" label="Tallas" />
                                <ConfigLink href="/admin/colores" label="Colores" />
                                <ConfigLink href="/admin/categorias" label="Categorías" />
                            </div>
                        </div>
                        {/* Decoración */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-20" />
                    </div>

                </div>

            </div>
        </div>
    );
}

// --- SUBCOMPONENTES ---

function QuickActionButton({ href, icon, label, color }: any) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 shadow-sm group ${color}`}
        >
            <div className="mb-3 transform group-hover:-translate-y-1 transition-transform duration-300">
                {icon}
            </div>
            <span className="font-bold text-slate-700 text-xs text-center">{label}</span>
        </Link>
    )
}

function ConfigLink({ href, label }: any) {
    return (
        <Link href={href} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
            <span className="text-sm font-medium text-slate-300 group-hover:text-white">{label}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
        </Link>
    )
}