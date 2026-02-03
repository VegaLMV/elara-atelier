import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Printer, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DetalleVentaPage({ params }: PageProps) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      cliente: true,
      items: {
        include: {
          variante: {
            include: {
              // CORRECCIÓN: Accedemos a la relación 'imagenes' en lugar del campo 'imagen'
              producto: { 
                select: { 
                    nombre: true, 
                    imagenes: {
                        take: 1,
                        orderBy: { esPortada: 'desc' },
                        select: { url: true }
                    }
                } 
              }, 
              talla: true,
              color: true
            }
          }
        }
      }
    }
  });

  if (!venta) notFound();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      
      <div className="mb-6 flex items-center justify-between no-print">
         <Link href="/admin/ventas" className="flex items-center text-sm text-gray-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver al historial
         </Link>
         <button 
            type="button" 
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
         >
            <Printer className="w-4 h-4" /> Imprimir
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:shadow-none print:border-0">
         {/* Cabecera del Ticket */}
         <div className="bg-slate-900 p-8 text-white text-center print:bg-white print:text-black print:p-0 print:mb-4 print:border-b">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
                <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Comprobante de Venta</h1>
            <p className="text-slate-300 text-sm mt-1 print:text-gray-500">Código: #{venta.codigo}</p>
            <p className="text-slate-400 text-xs mt-4 print:text-gray-500">
                {new Date(venta.fechaVenta).toLocaleDateString('es-PE', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                })}
            </p>
         </div>

         <div className="p-8 print:p-0">
            {/* Info Cliente */}
            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100 text-sm print:mb-4 print:pb-4">
                <div>
                    <p className="text-gray-400 font-medium text-xs uppercase mb-1">Cliente</p>
                    <p className="font-bold text-gray-900 text-lg">
                        {venta.cliente?.nombre || venta.clienteNombre || "Público General"}
                    </p>
                    {venta.cliente?.dni && <p className="text-gray-500">DNI: {venta.cliente.dni}</p>}
                </div>
                <div className="text-right">
                    <p className="text-gray-400 font-medium text-xs uppercase mb-1">Método de Pago</p>
                    <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-bold text-gray-700 print:bg-transparent print:p-0">
                        {venta.metodoPago}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">ID: {venta.id}</p>
                </div>
            </div>

            {/* Lista de Items */}
            <div className="space-y-4 mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalle de Compra</p>
                
                {venta.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5 print:border print:bg-white">
                                {item.cantidad}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">
                                    {item.variante.producto.nombre}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {item.variante.talla.nombre} • {item.variante.color.nombre}
                                </p>
                                {item.tieneDescuento && (
                                    <p className="text-[10px] text-red-500 font-medium">
                                        Desc: {item.descuentoRazon || 'Oferta'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900">S/ {Number(item.subtotal).toFixed(2)}</p>
                            {item.tieneDescuento && (
                                <p className="text-xs text-gray-400 line-through">
                                    S/ {(Number(item.precioUnitario) * item.cantidad).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Totales */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-3 print:bg-transparent print:p-0 print:border-t">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>S/ {Number(venta.subtotal).toFixed(2)}</span>
                </div>
                {Number(venta.descuentoTotal) > 0 && (
                    <div className="flex justify-between text-sm text-red-600 font-medium">
                        <span>Descuento Total</span>
                        <span>- S/ {Number(venta.descuentoTotal).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-gray-200 mt-3">
                    <span>Total Pagado</span>
                    <span>S/ {Number(venta.total).toFixed(2)}</span>
                </div>
            </div>
            
            {/* Notas */}
            {venta.notas && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 print:border print:bg-white">
                    <strong>Notas:</strong> {venta.notas}
                </div>
            )}
         </div>
      </div>
    </div>
  );
}