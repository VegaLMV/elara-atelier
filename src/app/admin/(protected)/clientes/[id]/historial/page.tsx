import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag, Calendar, CreditCard, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistorialClientePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  // Obtener cliente con todas sus ventas e items
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      ventas: {
        orderBy: { fechaVenta: 'desc' },
        include: {
          items: {
            include: {
              variante: {
                include: {
                  producto: { select: { nombre: true, imagenes: { take: 1 } } },
                  talla: true,
                  color: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!cliente) notFound();

  // Cálculo de LTV (Lifetime Value)
  const totalGastado = cliente.ventas.reduce((acc, v) => acc + Number(v.total), 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header Cliente */}
      <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-gray-200">
         <div>
            <Link href="/admin/clientes" className="text-sm text-gray-500 hover:text-slate-900 flex items-center gap-1 mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a lista
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.nombre}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                {cliente.telefono && <span className="flex items-center gap-1"><PhoneIcon /> {cliente.telefono}</span>}
                {cliente.dni && <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">DNI: {cliente.dni}</span>}
            </div>
         </div>
         
         {/* Tarjeta Resumen (LTV) */}
         <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex items-center gap-5 min-w-[250px]">
             <div className="p-3 bg-white/10 rounded-full">
                 <Tag className="w-6 h-6 text-yellow-400" />
             </div>
             <div>
                 <p className="text-xs text-slate-300 uppercase tracking-wider font-bold">Total Gastado</p>
                 <p className="text-2xl font-bold">S/ {totalGastado.toFixed(2)}</p>
                 <p className="text-[10px] text-slate-400">{cliente.ventas.length} compras registradas</p>
             </div>
         </div>
      </div>

      {/* Lista de Ventas */}
      <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HistoryIcon /> Historial de Transacciones
          </h2>

          {cliente.ventas.length === 0 ? (
              <div className="p-10 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                  Este cliente aún no tiene compras registradas.
              </div>
          ) : (
              <div className="grid gap-6">
                  {cliente.ventas.map(venta => (
                      <div key={venta.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {/* Cabecera Venta */}
                          <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                      <ShoppingBag className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900 text-sm">Venta #{venta.codigo.slice(-6).toUpperCase()}</p>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(venta.fechaVenta).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="block font-black text-slate-900">S/ {Number(venta.total).toFixed(2)}</span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600 inline-flex items-center gap-1 mt-1">
                                      <CreditCard className="w-3 h-3" /> {venta.metodoPago}
                                  </span>
                              </div>
                          </div>

                          {/* Items */}
                          <div className="p-4 bg-white">
                              <table className="w-full text-sm">
                                  <tbody className="divide-y divide-gray-50">
                                      {venta.items.map(item => (
                                          <tr key={item.id} className="group">
                                              <td className="py-2 pl-2 w-12">
                                                  {item.variante.producto.imagenes?.[0]?.url ? (
                                                      // eslint-disable-next-line @next/next/no-img-element
                                                      <img src={item.variante.producto.imagenes[0].url} className="w-8 h-8 rounded object-cover border" alt="" />
                                                  ) : (
                                                      <div className="w-8 h-8 bg-gray-100 rounded border"></div>
                                                  )}
                                              </td>
                                              <td className="py-2">
                                                  <p className="font-medium text-gray-900">{item.variante.producto.nombre}</p>
                                                  <p className="text-xs text-gray-500">{item.variante.talla.nombre} • {item.variante.color.nombre}</p>
                                              </td>
                                              <td className="py-2 text-center text-gray-600">x{item.cantidad}</td>
                                              <td className="py-2 text-right font-medium text-gray-900">S/ {Number(item.precioFinal).toFixed(2)}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}

// Iconos Auxiliares
function PhoneIcon() { return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }
function HistoryIcon() { return <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }