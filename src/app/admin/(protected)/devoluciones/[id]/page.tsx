export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Package, User, Wallet, CheckCircle2, RotateCcw, Truck, AlertTriangle, Calendar, ExternalLink, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/precios";

function getColorStyle(hex: string | null) {
    if (!hex) return { backgroundColor: '#fff' };
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };
    const percentage = 100 / codes.length;
    const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
    return { background: `linear-gradient(135deg, ${stops})` };
}

export default async function DetalleDevolucionPage({ params }: { params: Promise<{ id: string }> }) {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    const { id } = await params;

    const dev = await prisma.devolucion.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    variante: {
                        include: {
                            producto: { include: { imagenes: { take: 1, orderBy: { esPortada: 'desc' } } } },
                            talla: true,
                            color: true
                        }
                    }
                }
            },
            venta: { include: { cliente: true } },
            compra: { include: { proveedor: true } }
        }
    });

    if (!dev) notFound();

    let ventaCambio = null;
    if (dev.accion === "CAMBIO") {
        ventaCambio = await prisma.venta.findFirst({
            where: { notas: { contains: dev.id.slice(-6) } }
        });
    }

    const isCliente = dev.tipo === "CLIENTE";

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto bg-gray-50/50 min-h-screen">
            
            {/* --- CABECERA --- */}
            <div className="mb-8 flex items-center justify-between">
                <Link href="/admin/devoluciones" className="flex items-center text-sm font-bold text-gray-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400">ID: {dev.id}</span>
                </div>
            </div>

            {/* --- TARJETA PRINCIPAL --- */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                
                {/* Header de Estado */}
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1 
                                    ${dev.accion === 'CAMBIO' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                                      dev.accion === 'SALDO_A_FAVOR' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' :
                                      'bg-red-500/20 text-red-300 border-red-400/30'}`}>
                                    {dev.accion === 'CAMBIO' ? <RotateCcw className="w-3 h-3" /> : dev.accion === 'SALDO_A_FAVOR' ? <Wallet className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {dev.accion.replace(/_/g, " ")}
                                </div>
                                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                    {isCliente ? "Retorno de Cliente" : "Envío a Proveedor"}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Detalle de Operación
                            </h1>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de Registro</p>
                            <p className="text-lg font-bold flex items-center justify-end gap-2 text-white">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                {new Date(dev.creadoEn).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    
                    {/* --- SECCIÓN 1: ORIGEN --- */}
                    <div className="grid grid-cols-2 gap-8 pb-8 border-b border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                {isCliente ? <User className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />} 
                                Sujeto
                            </p>
                            <p className="text-xl font-bold text-gray-900 mb-1">
                                {isCliente ? (dev.venta?.cliente?.nombre || dev.venta?.clienteNombre || "Público General") : dev.compra?.proveedor?.nombre}
                            </p>
                            {dev.venta?.cliente?.dni && <p className="text-sm text-gray-500 font-mono">DNI: {dev.venta.cliente.dni}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Documento Original</p>
                            {isCliente ? (
                                <Link href={`/admin/ventas/${dev.ventaId}`} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                                    Venta #{dev.venta?.codigo} <ExternalLink className="w-4 h-4" />
                                </Link>
                            ) : (
                                <Link href={`/admin/compras/${dev.compraId}`} className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors">
                                    Compra #{dev.compraId?.slice(-6).toUpperCase()} <ExternalLink className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* --- SECCIÓN 2: PRODUCTOS DEVUELTOS --- */}
                    <div>
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-indigo-600" /> Mercadería Afectada (Ingreso a Kardex)
                        </h3>
                        <div className="space-y-4">
                            {dev.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center group bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden relative shadow-sm">
                                            {item.variante.producto.imagenes?.[0]?.url ? (
                                                <img src={item.variante.producto.imagenes[0].url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300 text-[9px]">IMG</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.variante.producto.nombre}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {item.variante.talla.nombre}
                                                </span>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                                    <span className="w-3 h-3 rounded-full border border-gray-300 shadow-sm" style={getColorStyle(item.variante.color.hex)} />
                                                    {item.variante.color.nombre}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-black text-gray-900 text-lg bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg">
                                            {item.cantidad} und.
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Valor Contable Total</span>
                            <span className="text-xl font-black text-slate-900">{formatMoney(Number(dev.montoTotal))}</span>
                        </div>
                    </div>

                    {/* --- SECCIÓN 3: RESOLUCIÓN Y MOTIVO --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100">
                            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Motivo Declarado
                            </p>
                            <p className="text-sm text-yellow-800 font-medium leading-relaxed">
                                "{dev.motivo}"
                            </p>
                        </div>

                        {/* Si fue cambio, mostramos el enlace al nuevo ticket generado */}
                        {dev.accion === "CAMBIO" && ventaCambio && (
                            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Cambio Generado Exitosamente
                                </p>
                                <p className="text-sm text-emerald-800 font-medium mb-3">
                                    Se emitió un nuevo comprobante con los productos de reemplazo.
                                </p>
                                <Link href={`/admin/ventas/${ventaCambio.id}`} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md active:scale-95">
                                    Ver Ticket #{ventaCambio.codigo} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                        
                        {dev.accion === "SALDO_A_FAVOR" && (
                             <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Wallet className="w-3 h-3" /> Billetera de Cliente
                                </p>
                                <p className="text-sm text-purple-800 font-medium">
                                    Se abonó <strong>{formatMoney(Number(dev.montoTotal))}</strong> al perfil del cliente para futuras compras.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}