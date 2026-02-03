export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import Link from "next/link";
import BotonImprimir from "./boton-imprimir"; // Asegúrate de tener este componente del paso anterior

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

  // 2. Procesamos y filtramos en memoria (Agrupación)
  const reporte = [];
  let totalAlertas = 0;
  let totalAgotados = 0;

  for (const p of productosRaw) {
    // Filtramos solo las variantes con stock bajo de este producto
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
          <div className="flex items-center gap-2">
             <Link href="/admin/kardex" className="text-gray-400 hover:text-black transition-colors">← Volver</Link>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Alertas de Stock</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Agrupado por producto para facilitar la reposición.</p>
        </div>
        <BotonImprimir />
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 gap-4 print:hidden">
         <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
            <p className="text-red-600 font-bold uppercase text-xs">Variantes Agotadas</p>
            <p className="text-3xl font-bold text-red-900">{totalAgotados}</p>
         </div>
         <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
            <p className="text-yellow-700 font-bold uppercase text-xs">Variantes Stock Bajo</p>
            <p className="text-3xl font-bold text-yellow-900">{totalAlertas - totalAgotados}</p>
         </div>
      </div>

      {/* LISTA AGRUPADA */}
      <div className="space-y-6">
         {reporte.length === 0 ? (
            <div className="text-center py-12 text-gray-400">✅ Todo el inventario está saludable.</div>
         ) : (
            reporte.map((prod) => (
               <div key={prod.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
                  
                  {/* Encabezado del Producto */}
                  <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded border border-gray-200 overflow-hidden flex-shrink-0">
                           {prod.imagen && <img src={prod.imagen} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <h3 className="font-bold text-gray-900">{prod.nombre}</h3>
                     </div>
                     <Link 
                        href={`/admin/compras/nueva?prefillProducto=${prod.id}`}
                        className="text-xs font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors print:hidden"
                     >
                        + Reponer Todo
                     </Link>
                  </div>

                  {/* Tabla de Variantes */}
                  <table className="w-full text-sm text-left">
                     <thead className="bg-white text-gray-400 font-medium text-xs uppercase border-b border-gray-50">
                        <tr>
                           <th className="px-4 py-2 w-1/3">Variante</th>
                           <th className="px-4 py-2 text-center">Estado</th>
                           <th className="px-4 py-2 text-center">Stock</th>
                           <th className="px-4 py-2 text-right print:hidden">Acción</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {prod.variantes.map(v => {
                           const isZero = v.stockActual === 0;
                           return (
                              <tr key={v.id} className="hover:bg-gray-50">
                                 <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                       <span className="w-3 h-3 rounded-full border border-gray-200" style={{background: v.color.hex || '#eee'}}></span>
                                       <span className="text-gray-700">{v.color.nombre} / {v.talla.nombre}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-2 text-center">
                                    {isZero 
                                       ? <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">AGOTADO</span>
                                       : <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">BAJO</span>
                                    }
                                 </td>
                                 <td className="px-4 py-2 text-center font-mono font-bold">
                                    <span className={isZero ? "text-red-600" : "text-yellow-600"}>{v.stockActual}</span>
                                    <span className="text-gray-300 text-xs font-normal"> / {v.stockMinimo}</span>
                                 </td>
                                 <td className="px-4 py-2 text-right print:hidden">
                                    <Link 
                                       href={`/admin/compras/nueva?prefillProducto=${prod.id}&prefillVariante=${v.id}`}
                                       className="text-blue-600 hover:underline text-xs"
                                    >
                                       Reponer
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