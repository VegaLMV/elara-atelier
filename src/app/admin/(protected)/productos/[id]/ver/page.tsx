export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";
import Link from "next/link";


type VarianteRow = {
  id: string;
  activa: boolean;
  stockActual: number;
  talla: { nombre: string; orden: number };
  color: { nombre: string; hex: string | null };
};

function Swatch({ hex }: { hex: string | null }) {
  const valido = typeof hex === "string" && /^#([0-9a-fA-F]{6})$/.test(hex.trim());
  const bg = valido ? hex!.trim() : null;

  return (
    <span
      className="inline-block w-5 h-5 rounded-full border border-gray-200 shadow-sm"
      style={bg ? { backgroundColor: bg } : { background: 'linear-gradient(to bottom right, #fff, #f3f4f6)' }}
      title={bg ? bg : "Sin HEX"}
    />
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await obtenerSesion();
  
  if (!sesion) redirect("/admin/login");
  if (sesion.rol !== "ADMIN") redirect("/admin/login");

  const { id } = await params;
  if (!id) return notFound();

  const producto = await prisma.producto.findUnique({
    where: { id },
    select: { id: true, nombre: true }, // Asumo que podría haber un campo imagen, si no, solo nombre está bien
  });

  if (!producto) return notFound();

  const variantes = (await prisma.variante.findMany({
    where: { productoId: id },
    select: {
      id: true,
      activa: true,
      stockActual: true,
      talla: { select: { nombre: true, orden: true } },
      color: { select: { nombre: true, hex: true } },
    },
    orderBy: [{ talla: { orden: "asc" } }, { color: { nombre: "asc" } }],
  })) as VarianteRow[];

  // Agrupar por talla
  const grupos = new Map<
    string,
    {
      tallaNombre: string;
      tallaOrden: number;
      totalStock: number;
      totalStockActivo: number;
      totalVariantes: number;
      colores: Array<{
        id: string;
        color: string;
        hex: string | null;
        stock: number;
        activa: boolean;
      }>;
    }
  >();

  for (const v of variantes) {
    const key = v.talla.nombre;

    if (!grupos.has(key)) {
      grupos.set(key, {
        tallaNombre: v.talla.nombre,
        tallaOrden: v.talla.orden,
        totalStock: 0,
        totalStockActivo: 0,
        totalVariantes: 0,
        colores: [],
      });
    }

    const g = grupos.get(key)!;
    g.totalVariantes += 1;
    g.totalStock += v.stockActual;
    if (v.activa) g.totalStockActivo += v.stockActual;

    g.colores.push({
      id: v.id,
      color: v.color.nombre,
      hex: v.color.hex ?? null,
      stock: v.stockActual,
      activa: v.activa,
    });
  }

  const tallasOrdenadas = [...grupos.values()].sort((a, b) => a.tallaOrden - b.tallaOrden);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Detalle del Producto</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-mono">{id.slice(0,8)}...</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{producto.nombre}</h1>
        </div>
        
        {/* Botones de Acción */}
        <div className="flex items-center gap-3">
            <Link 
                href={`/admin/productos`}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                 Volver
            </Link>
            <Link 
                href={`/admin/productos/${id}`}
                className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                 Editar Producto
            </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Variantes</p>
            <p className="text-2xl font-bold text-gray-900">{variantes.length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Stock Global</p>
            <p className="text-2xl font-bold text-blue-600">
               {variantes.reduce((acc, v) => acc + v.stockActual, 0)}
            </p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Estado General</p>
            <div className="flex gap-2 mt-1">
               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                  {variantes.filter(v => v.activa).length} Activas
               </span>
               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">
                  {variantes.filter(v => !v.activa).length} Inactivas
               </span>
            </div>
         </div>
      </div>

      {/* Variantes Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
           📦 Inventario por Talla
        </h2>

        {tallasOrdenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-200 rounded-xl text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-gray-900 font-medium">No hay variantes registradas</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">Este producto aún no tiene combinaciones de talla y color.</p>
            <Link href={`/admin/productos/${id}`} className="text-blue-600 hover:underline text-sm font-medium">
               Ir a crear variantes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tallasOrdenadas.map((t) => (
              <div key={t.tallaNombre} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                 
                 {/* Card Header */}
                 <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <span className="bg-slate-900 text-white w-16 h-8 flex items-center justify-center rounded-lg text-sm font-bold shadow-sm">
                          {t.tallaNombre}
                       </span>
                       <span className="text-sm font-medium text-gray-600">{t.totalVariantes} colores</span>
                    </div>
                    <div className="text-right">
                       <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">Stock Talla</span>
                       <span className="font-bold text-gray-900">{t.totalStock}</span>
                    </div>
                 </div>

                 {/* Colors List */}
                 <div className="divide-y divide-gray-50">
                    {t.colores.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                        
                        <div className="flex items-center gap-3">
                           <Swatch hex={c.hex} />
                           <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{c.color}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{c.hex || 'N/A'}</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.activa ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {c.activa ? 'ACTIVO' : 'INACTIVO'}
                           </div>
                           <div className="w-12 text-right">
                              <span className={`text-sm font-bold ${c.stock === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                 {c.stock}
                              </span>
                           </div>
                        </div>

                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}