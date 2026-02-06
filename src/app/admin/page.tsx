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
  Truck, 
  Ruler, 
  Palette, 
  ExternalLink, 
  Plus, 
  LayoutGrid,
  Box,
  TrendingDown
} from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");

  // --- DATOS REALES PARA EL DASHBOARD ---
  const [
    totalProductos, 
    productosSinStock,
    totalCategorias,
    campanasActivas
  ] = await Promise.all([
    // 1. Productos Activos
    prisma.producto.count({ where: { estado: 'ACTIVO' } }),
    
    // 2. Alertas de Stock (Variantes con stock <= 2)
    prisma.variante.count({ where: { stockActual: { lte: 2 } } }),
    
    // 3. Total Categorías
    prisma.categoria.count(),
    
    // 4. Campañas Activas (CORREGIDO: Usamos prisma.campana)
    prisma.campana.count({ 
        where: { 
            // Buscamos campañas que NO estén muertas y que estén en fecha
            estado: { notIn: ['CANCELADO', 'FINALIZADO'] }, 
            startsAt: { lte: new Date() }, 
            endsAt: { gte: new Date() }    
        } 
    })
  ]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 bg-gray-50/50 min-h-screen">
      
      {/* 1. Header de Bienvenida */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-gray-200">
        <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold border border-slate-200 uppercase tracking-wider">
                 Panel de Control
               </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Hola, {sesion.rol === 'ADMIN' ? 'Administrador' : 'Colaborador'} 👋
            </h1>
            <p className="text-gray-500 mt-2 max-w-lg text-sm">
                Bienvenido a <b>Elara Atelier</b>. Aquí tienes el resumen operativo de tu tienda en tiempo real.
            </p>
        </div>
        <div className="flex gap-3">
             <Link 
                href="/" 
                target="_blank" 
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
             >
                <ExternalLink className="w-4 h-4" /> Ver Tienda
             </Link>
             <Link 
                href="/admin/productos/nuevo" 
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 hover:translate-y-[-1px]"
             >
                <Plus className="w-4 h-4" /> Nuevo Producto
             </Link>
        </div>
      </div>

      {/* 2. KPIs (Indicadores Clave) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <KpiCard 
            title="Productos Activos" 
            value={totalProductos} 
            icon={<Package className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
            borderColor="border-blue-100"
            textColor="text-blue-700"
         />
         <KpiCard 
            title="Alertas de Stock" 
            value={productosSinStock} 
            label="Variantes con < 3 uds."
            icon={<AlertTriangle className={`w-6 h-6 ${productosSinStock > 0 ? 'text-red-600' : 'text-emerald-600'}`} />} 
            bgColor={productosSinStock > 0 ? "bg-red-50" : "bg-emerald-50"}
            borderColor={productosSinStock > 0 ? "border-red-100" : "border-emerald-100"}
            textColor={productosSinStock > 0 ? "text-red-700" : "text-emerald-700"}
         />
         <KpiCard 
            title="Campañas Activas" 
            value={campanasActivas} 
            icon={<Zap className="w-6 h-6 text-purple-600" />} 
            bgColor="bg-purple-50"
            borderColor="border-purple-100"
            textColor="text-purple-700"
         />
         <KpiCard 
            title="Categorías" 
            value={totalCategorias} 
            icon={<Tag className="w-6 h-6 text-slate-600" />} 
            bgColor="bg-white"
            borderColor="border-gray-200"
            textColor="text-slate-700"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 3. Accesos Rápidos (Columna Principal) */}
         <div className="lg:col-span-2 space-y-8">
            <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <LayoutGrid className="w-5 h-5 text-gray-400" />
                    Gestión Rápida
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <QuickLink 
                        href="/admin/compras" 
                        title="Registrar Compra" 
                        desc="Ingreso de mercadería"
                        icon={<ShoppingCart className="w-6 h-6 text-emerald-600" />} 
                        color="hover:border-emerald-200 hover:bg-emerald-50/30"
                    />
                    <QuickLink 
                        href="/admin/kardex" 
                        title="Ver Inventario" 
                        desc="Movimientos y stock"
                        icon={<ClipboardList className="w-6 h-6 text-blue-600" />} 
                        color="hover:border-blue-200 hover:bg-blue-50/30"
                    />
                    <QuickLink 
                        href="/admin/descuentos/nuevo" 
                        title="Crear Oferta" 
                        desc="Lanzar campaña masiva"
                        icon={<TicketPercent className="w-6 h-6 text-purple-600" />} 
                        color="hover:border-purple-200 hover:bg-purple-50/30"
                    />
                    <QuickLink 
                        href="/admin/proveedores" 
                        title="Proveedores" 
                        desc="Directorio de contactos"
                        icon={<Truck className="w-6 h-6 text-amber-600" />} 
                        color="hover:border-amber-200 hover:bg-amber-50/30"
                    />
                    <QuickLink 
                        href="/admin/tallas" 
                        title="Tallas y Medidas" 
                        desc="Configurar variantes"
                        icon={<Ruler className="w-6 h-6 text-slate-600" />} 
                        color="hover:border-slate-300 hover:bg-slate-50"
                    />
                     <QuickLink 
                        href="/admin/colores" 
                        title="Colores" 
                        desc="Paleta de productos"
                        icon={<Palette className="w-6 h-6 text-pink-600" />} 
                        color="hover:border-pink-200 hover:bg-pink-50/30"
                    />
                </div>
            </div>

            {/* Banner Promocional Interno */}
            {productosSinStock > 0 && (
                <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl flex items-center justify-between">
                    <div className="relative z-10 max-w-md">
                        <div className="flex items-center gap-2 mb-2 text-red-300">
                            <TrendingDown className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wide">Alerta de Inventario</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">¿Necesitas reabastecer?</h3>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                            Hemos detectado <b>{productosSinStock} variantes</b> con niveles de stock crítico (menos de 3 unidades). Evita perder ventas revisando el reporte.
                        </p>
                        <Link 
                            href="/admin/kardex/stock-bajo"
                            className="inline-flex items-center bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all shadow-md active:scale-95"
                        >
                            Revisar Reporte <ExternalLink className="w-3 h-3 ml-2" />
                        </Link>
                    </div>
                    {/* Decoración de fondo */}
                    <div className="absolute -right-6 -bottom-10 opacity-10 rotate-12">
                        <TrendingDown className="w-64 h-64" />
                    </div>
                </div>
            )}
         </div>

         {/* 4. Estado del Sistema (Sidebar) */}
         <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Estado del Sistema
                </h3>
                <div className="space-y-5">
                    <StatusItem label="Base de Datos" status="Conectado" color="green" />
                    <StatusItem label="Rol de Usuario" status={sesion.rol} color="blue" />
                    <StatusItem label="Versión" status="v1.0.2 (Beta)" color="gray" />
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-3">Configuración de Logística</p>
                    <div className="flex gap-2 flex-wrap">
                        <Link href="/admin/empaques" className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-gray-600 transition-all flex items-center gap-1 font-medium">
                            <Box className="w-3 h-3" /> Empaques
                        </Link>
                         <Link href="/admin/categorias" className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-gray-600 transition-all flex items-center gap-1 font-medium">
                            <Tag className="w-3 h-3" /> Categorías
                        </Link>
                    </div>
                </div>
            </div>
         </div>

      </div>
    </div>
  );
}

// --- SUBCOMPONENTES VISUALES ---

function KpiCard({ title, value, icon, bgColor, borderColor, textColor, label }: any) {
    return (
        <div className={`p-5 rounded-2xl border ${borderColor} ${bgColor} transition-all hover:shadow-sm`}>
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-white/50">
                    {icon}
                </div>
            </div>
            <p className={`text-3xl font-bold mb-1 ${textColor}`}>{value}</p>
            <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${textColor}`}>{title}</p>
            {label && <p className={`text-[10px] mt-1 font-medium opacity-60 ${textColor}`}>{label}</p>}
        </div>
    )
}

function QuickLink({ href, title, desc, icon, color }: any) {
    return (
        <Link href={href} className={`flex flex-col p-5 bg-white border border-gray-200 rounded-2xl transition-all group ${color}`}>
            <div className="mb-3 transform group-hover:scale-110 transition-transform origin-left">
                {icon}
            </div>
            <span className="font-bold text-gray-900 text-sm">{title}</span>
            <span className="text-xs text-gray-500 mt-1">{desc}</span>
        </Link>
    )
}

function StatusItem({ label, status, color }: any) {
    const colorClasses: any = {
        green: "bg-emerald-100 text-emerald-700 border-emerald-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
        gray: "bg-slate-100 text-slate-700 border-slate-200"
    };

    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${colorClasses[color] || colorClasses.gray}`}>
                {status}
            </span>
        </div>
    )
}