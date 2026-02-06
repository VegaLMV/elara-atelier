import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Printer, ShoppingBag, Package, User, CreditCard, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Helper de moneda
const formatMoney = (amount: number) => 
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

export default async function DetalleVentaPage({ params }: PageProps) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;

  // 1. Consulta Completa (Incluyendo Imágenes y Empaques)
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      cliente: true,
      // Incluimos empaques (NUEVO)
      empaques: {
        include: {
            tipoEmpaque: true
        }
      },
      items: {
        include: {
          variante: {
            include: {
              producto: { 
                select: { 
                    nombre: true, 
                    imagenes: {
                        take: 1,
                        orderBy: { esPortada: 'desc' }, // Priorizamos portada
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

  // Cálculos de totales visuales
  const totalEmpaques = venta.empaques.reduce((acc, e) => acc + Number(e.costoTotal), 0);
  const totalProductos = Number(venta.subtotal); // Asumiendo que subtotal guarda la suma de items

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto bg-gray-50/50 min-h-screen">
      
      {/* Header de Navegación */}
      <div className="mb-6 flex items-center justify-between no-print">
         <Link href="/admin/ventas" className="flex items-center text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al historial
         </Link>
         <button 
            type="button" 
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
         >
            <Printer className="w-4 h-4" /> Imprimir Comprobante
         </button>
      </div>

      {/* TICKET / FACTURA */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
         
         {/* Cabecera Visual */}
         <div className="bg-slate-900 p-8 text-white relative overflow-hidden print:bg-white print:text-black print:p-0 print:border-b print:pb-4">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center print:hidden">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        Comprobante de Venta
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 font-mono print:text-gray-600">ID: #{venta.codigo.toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de Emisión</p>
                    <p className="text-lg font-bold flex items-center justify-end gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {new Date(venta.fechaVenta).toLocaleDateString('es-PE', { 
                            year: 'numeric', month: 'long', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                        })}
                    </p>
                </div>
            </div>
            {/* Decoración fondo */}
            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none print:hidden"></div>
         </div>

         <div className="p-8 print:p-4">
            
            {/* Info Cliente & Pago */}
            <div className="grid grid-cols-2 gap-12 mb-10 pb-8 border-b border-gray-100 print:mb-6 print:pb-6">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Datos del Cliente
                    </p>
                    <p className="text-xl font-bold text-gray-900 mb-1">
                        {venta.cliente?.nombre || venta.clienteNombre || "Público General"}
                    </p>
                    {venta.cliente?.dni && (
                        <p className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">
                            DNI/RUC: {venta.cliente.dni}
                        </p>
                    )}
                    {venta.cliente?.email && <p className="text-sm text-gray-500 mt-1">{venta.cliente.email}</p>}
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-end gap-2">
                        <CreditCard className="w-3.5 h-3.5" /> Método de Pago
                    </p>
                    <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm border border-blue-100 print:bg-transparent print:p-0 print:text-black">
                        {venta.metodoPago}
                    </span>
                    <p className={`text-sm mt-3 font-bold ${venta.estado === 'ANULADO' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {venta.estado === 'COMPLETADO' ? '● Pagado' : '● Anulado'}
                    </p>
                </div>
            </div>

            {/* --- LISTA DE PRODUCTOS --- */}
            <div className="space-y-6 mb-8">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Productos Adquiridos ({venta.items.length})
                </h3>
                
                <div className="space-y-4">
                    {venta.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                {/* Imagen del Producto */}
                                <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative shadow-sm print:hidden">
                                    {item.variante.producto.imagenes?.[0]?.url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={item.variante.producto.imagenes[0].url} 
                                            className="w-full h-full object-cover" 
                                            alt={item.variante.producto.nombre} 
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-300 text-[9px]">IMG</div>
                                    )}
                                </div>
                                
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {item.variante.producto.nombre}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                            {item.variante.talla.nombre}
                                        </span>
                                        {/* Burbuja de Color */}
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                            <span 
                                                className="w-3 h-3 rounded-full border border-gray-300 shadow-sm" 
                                                style={{ backgroundColor: item.variante.color.hex || '#eee' }}
                                            />
                                            {item.variante.color.nombre}
                                        </div>
                                    </div>
                                    {item.tieneDescuento && (
                                        <p className="text-[10px] text-red-500 font-bold mt-0.5">
                                            🏷️ {item.descuentoRazon || 'Oferta aplicada'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex flex-col items-end">
                                    <span className="font-bold text-gray-900">{formatMoney(Number(item.subtotal))}</span>
                                    <span className="text-xs text-gray-400">
                                        {item.cantidad} x {formatMoney(Number(item.precioFinal))}
                                    </span>
                                    {item.tieneDescuento && (
                                        <span className="text-[10px] text-gray-400 line-through">
                                            {formatMoney(Number(item.precioUnitario) * item.cantidad)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- LISTA DE EMPAQUES (NUEVO) --- */}
            {venta.empaques.length > 0 && (
                <div className="space-y-6 mb-8 pt-6 border-t border-gray-50">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-orange-500" /> Empaques & Adicionales
                    </h3>
                    
                    <div className="space-y-3">
                        {venta.empaques.map((emp) => (
                            <div key={emp.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-orange-400 print:hidden">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700">{emp.tipoEmpaque.nombre}</p>
                                        <p className="text-xs text-gray-400">{emp.cantidad} unidades</p>
                                    </div>
                                </div>
                                <span className="font-medium text-gray-600">
                                    {formatMoney(Number(emp.costoTotal))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TOTALES --- */}
            <div className="bg-gray-50 rounded-2xl p-6 mt-8 print:bg-transparent print:p-0 print:border-t print:mt-4">
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal Productos</span>
                        <span className="font-medium">{formatMoney(totalProductos)}</span>
                    </div>
                    {totalEmpaques > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Empaques</span>
                            <span className="font-medium">{formatMoney(totalEmpaques)}</span>
                        </div>
                    )}
                    {Number(venta.descuentoTotal) > 0 && (
                        <div className="flex justify-between text-sm text-red-600 font-medium">
                            <span>Descuento Total</span>
                            <span>- {formatMoney(Number(venta.descuentoTotal))}</span>
                        </div>
                    )}
                    
                    <div className="w-full h-px bg-gray-200 my-2"></div>
                    
                    <div className="flex justify-between items-end">
                        <span className="text-lg font-black text-gray-900 uppercase">Total a Pagar</span>
                        <span className="text-3xl font-black text-slate-900">{formatMoney(Number(venta.total))}</span>
                    </div>
                </div>
            </div>
            
            {/* Notas del Vendedor */}
            {venta.notas && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 print:border print:bg-white">
                    <strong>Notas:</strong> {venta.notas}
                </div>
            )}
         </div>
      </div>
    </div>
  );
}