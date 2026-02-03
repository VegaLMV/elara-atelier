import { obtenerSesion } from "@/lib/sesion";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminHome() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");

  // --- DATOS REALES PARA EL DASHBOARD ---
  // Ejecutamos consultas en paralelo para velocidad
  const [
    totalProductos, 
    productosSinStock,
    totalCategorias,
    campanasActivas
  ] = await Promise.all([
    prisma.producto.count({ where: { estado: 'ACTIVO' } }),
    // Contamos variantes con stock 0 (o bajo, < 3)
    prisma.variante.count({ where: { stockActual: { lte: 2 } } }),
    prisma.categoria.count(),
    // Campañas activas hoy
    prisma.descuentoProducto.count({ 
        where: { 
            estado: 'PROGRAMADO', 
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
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Panel de Control</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Hola, {sesion.rol === 'ADMIN' ? 'Administrador' : 'Colaborador'} 👋
            </h1>
            <p className="text-gray-600 mt-2 max-w-lg">
                Bienvenido a <b>Elara Atelier</b>. Aquí tienes el resumen operativo de tu tienda.
            </p>
        </div>
        <div className="flex gap-3">
             <Link href="/" target="_blank" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <span>🌐</span> Ver Tienda
             </Link>
             <Link href="/admin/productos/nuevo" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center gap-2">
                <span>+</span> Producto
             </Link>
        </div>
      </div>

      {/* 2. KPIs (Indicadores Clave) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <KpiCard 
            title="Productos Activos" 
            value={totalProductos} 
            icon="📦" 
            color="bg-blue-50 text-blue-700 border-blue-100"
         />
         <KpiCard 
            title="Alertas de Stock" 
            value={productosSinStock} 
            label="Variantes con < 3 uds."
            icon="⚠️" 
            color={productosSinStock > 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-green-50 text-green-700 border-green-100"}
         />
         <KpiCard 
            title="Campañas Activas" 
            value={campanasActivas} 
            icon="⚡" 
            color="bg-purple-50 text-purple-700 border-purple-100"
         />
         <KpiCard 
            title="Categorías" 
            value={totalCategorias} 
            icon="🏷️" 
            color="bg-gray-50 text-gray-700 border-gray-200"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 3. Accesos Rápidos (Columna Principal) */}
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gray-900">🚀 Gestión Rápida</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <QuickLink 
                    href="/admin/compras" 
                    title="Registrar Compra" 
                    desc="Ingreso de mercadería"
                    icon="🛒" 
                />
                <QuickLink 
                    href="/admin/kardex" 
                    title="Ver Inventario" 
                    desc="Movimientos y stock"
                    icon="📋" 
                />
                <QuickLink 
                    href="/admin/descuentos/nuevo" 
                    title="Crear Oferta" 
                    desc="Lanzar campaña masiva"
                    icon="🎫" 
                />
                <QuickLink 
                    href="/admin/proveedores" 
                    title="Proveedores" 
                    desc="Directorio de contactos"
                    icon="🚚" 
                />
                <QuickLink 
                    href="/admin/tallas" 
                    title="Tallas y Medidas" 
                    desc="Configurar variantes"
                    icon="📏" 
                />
                 <QuickLink 
                    href="/admin/colores" 
                    title="Colores" 
                    desc="Paleta de productos"
                    icon="🎨" 
                />
            </div>

            {/* Banner Promocional Interno */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl mt-8">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">¿Necesitas reabastecer?</h3>
                    <p className="text-slate-300 text-sm mb-4 max-w-md">
                        Tienes {productosSinStock} variantes con stock crítico. Revisa el reporte de inventario antes de hacer tu próxima compra.
                    </p>
<Link 
    href="/admin/kardex/stock-bajo"  // <--- CAMBIA ESTO (antes era /admin/kardex)
    className="inline-block bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
>
    Revisar Reporte →
</Link>
                </div>
                {/* Decoración de fondo */}
                <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 select-none">📉</div>
            </div>
         </div>

         {/* 4. Estado del Sistema (Sidebar) */}
         <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Estado del Sistema</h3>
                <div className="space-y-4">
                    <StatusItem label="Base de Datos" status="Conectado" color="green" />
                    <StatusItem label="Rol de Usuario" status={sesion.rol} color="blue" />
                    <StatusItem label="Versión" status="v1.0.2 (Beta)" color="gray" />
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Accesos directos de configuración</p>
                    <div className="flex gap-2 flex-wrap">
                        <Link href="/admin/empaques" className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 text-gray-600">
                            Empaques
                        </Link>
                         <Link href="/admin/categorias" className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 text-gray-600">
                            Categorías
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

function KpiCard({ title, value, icon, color, label }: any) {
    return (
        <div className={`p-5 rounded-2xl border ${color} bg-opacity-50`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs font-bold uppercase opacity-70 mb-1">{title}</p>
            {label && <p className="text-[10px] opacity-60">{label}</p>}
        </div>
    )
}

function QuickLink({ href, title, desc, icon }: any) {
    return (
        <Link href={href} className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group">
            <span className="text-2xl mb-3 group-hover:scale-110 transition-transform origin-left">{icon}</span>
            <span className="font-bold text-gray-900 text-sm">{title}</span>
            <span className="text-xs text-gray-500 mt-1">{desc}</span>
        </Link>
    )
}

function StatusItem({ label, status, color }: any) {
    const colorClasses: any = {
        green: "bg-green-100 text-green-700",
        blue: "bg-blue-100 text-blue-700",
        gray: "bg-gray-100 text-gray-600"
    };

    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">{label}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorClasses[color] || colorClasses.gray}`}>
                {status}
            </span>
        </div>
    )
}