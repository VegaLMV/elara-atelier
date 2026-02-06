export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import Link from "next/link";
import BotonImprimir from "./boton-imprimir";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Package, 
  ShoppingCart, 
  TrendingDown, 
  AlertOctagon 
} from "lucide-react";

export default async function Page() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");

  // 1. Traemos productos que tengan AL MENOS UNA variante activa
  const productosRaw = await prisma.producto.findMany({
    where: { 
      estado: 'ACTIVO',
      variantes: { some: { activa: true } }
    },
    select: {
      id: true,
      nombre: true,
      imagenes: { take: 1, orderBy: { esPortada: 'desc' } },
      variantes: {
        where: { activa: true },
        include: {
          talla: true,
          color: true
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });

  // 2. Procesamos y filtramos en memoria
  const reporte = [];
  let totalAlertas = 0;
  let totalAgotados = 0;

  for (const p of productosRaw) {
    const variantesEnAlerta = p.variantes.filter(v => v.stockActual <= v.stockMinimo);

    if (variantesEnAlerta.length > 0) {
      reporte.push({
        id: p.id,
        nombre: p.nombre,
        imagen: p.imagenes[0]?.url || null,
        variantes: variantesEnAlerta
      });
      
      totalAlertas += variantesEnAlerta.length;
      totalAgotados += variantesEnAlerta.filter(v => v.stockActual === 0).length;
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-3">
             <Link 
                href="/admin/kardex" 
                className="p-2 bg-white border border-gray-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                title="Volver al Kardex"
             >
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <TrendingDown className="w-8 h-8 text-red-600" />
                    Reporte de Quiebre
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Productos que requieren reposición inmediata.
                </p>
             </div>
          </div>
        </div>
        <BotonImprimir />
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
         <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
                <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-red-600 font-bold uppercase text-xs tracking-wider">Stock Agotado (0)</p>
                <p className="text-3xl font-bold text-red-900">{totalAgotados} <span className="text-sm font-medium opacity-60">variantes</span></p>
            </div>
         </div>
         <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
                <p className="text-amber-700 font-bold uppercase text-xs tracking-wider">Stock Crítico</p>
                <p className="text-3xl font-bold text-amber-900">{totalAlertas - totalAgotados} <span className="text-sm font-medium opacity-60">variantes</span></p>
            </div>
         </div>
      </div>

      {/* LISTA AGRUPADA */}
      <div className="space-y-6">
         {reporte.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 border-dashed">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">¡Inventario Saludable!</h3>
                <p className="text-gray-500 max-w-md mt-2">
                    No tienes productos con stock por debajo del mínimo configurado.
                </p>
            </div>
         ) : (
            reporte.map((prod) => (
               <div key={prod.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm break-inside-avoid">
                  
                  {/* Encabezado del Producto */}
                  <div className="bg-slate-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 p-0.5">
                           {prod.imagen ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={prod.imagen} className="w-full h-full object-cover rounded-md" alt="" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                   <Package className="w-5 h-5" />
                               </div>
                           )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{prod.nombre}</h3>
                            <p className="text-xs text-gray-500">{prod.variantes.length} variantes afectadas</p>
                        </div>
                     </div>
                     <Link 
                        href={`/admin/compras/nueva?prefillProducto=${prod.id}`}
                        className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 print:hidden shadow-sm"
                     >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Reponer Todo
                     </Link>
                  </div>

                  {/* Tabla de Variantes */}
                  <table className="w-full text-sm text-left">
                     <thead className="bg-white text-gray-400 font-bold text-[10px] uppercase border-b border-gray-100">
                        <tr>
                           <th className="px-6 py-3 w-1/3">Variante (Color / Talla)</th>
                           <th className="px-6 py-3 text-center">Estado</th>
                           <th className="px-6 py-3 text-center">Niveles</th>
                           <th className="px-6 py-3 text-right print:hidden">Acción</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {prod.variantes.map(v => {
                           const isZero = v.stockActual === 0;
                           return (
                              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                 <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                       <span 
                                          className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" 
                                          style={{background: v.color.hex || '#eee'}}
                                          title={v.color.nombre}
                                       ></span>
                                       <span className="font-medium text-gray-700">
                                          {v.color.nombre} <span className="text-gray-300 mx-1">/</span> {v.talla.nombre}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-3 text-center">
                                    {isZero 
                                       ? <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
                                            <AlertOctagon className="w-3 h-3" /> AGOTADO
                                         </span>
                                       : <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                                            <TrendingDown className="w-3 h-3" /> BAJO
                                         </span>
                                    }
                                 </td>
                                 <td className="px-6 py-3 text-center">
                                    <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                                        <span className={`font-mono font-bold ${isZero ? "text-red-600" : "text-amber-600"}`}>
                                            {v.stockActual}
                                        </span>
                                        <span className="text-gray-400 text-xs">/</span>
                                        <span className="text-gray-500 text-xs font-medium" title="Stock Mínimo">
                                            {v.stockMinimo} min
                                        </span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-3 text-right print:hidden">
                                    <Link 
                                       href={`/admin/compras/nueva?prefillProducto=${prod.id}&prefillVariante=${v.id}`}
                                       className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline"
                                    >
                                       Reponer Variedad
                                    </Link>
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            ))
         )}
      </div>
    </div>
  );
}