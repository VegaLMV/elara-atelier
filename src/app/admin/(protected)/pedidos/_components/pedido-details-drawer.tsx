"use client";

import { useState, useEffect } from "react";
import {
    X,
    Trash2,
    Package,
    Calendar,
    User,
    MapPin,
    CreditCard,
    AlertCircle,
    Loader2,
    Clock,
    ExternalLink,
    MessageSquare,
    Edit2
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/precios";

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

function safeDate(dateStr: any) {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '---';
        return dateFormatter.format(d);
    } catch (e) {
        return '---';
    }
}

interface Props {
    pedidoId: string | null;
    onClose: () => void;
    onUpdate: () => void;
    onEdit?: (pedido: any) => void;
}

export default function PedidoDetailsDrawer({ pedidoId, onClose, onUpdate, onEdit }: Props) {
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        if (pedidoId) loadPedido();
        else setPedido(null);
    }, [pedidoId]);

    async function loadPedido() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/pedidos/${pedidoId}`);
            if (res.ok) {
                const data = await res.json();
                setPedido(data);
            }
        } catch (error) {
            toast.error("Error al cargar pedido");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!confirm("¿Seguro que deseas cancelar este pedido? Se devolverá el stock.")) return;
        setCanceling(true);
        try {
            const res = await fetch(`/api/admin/pedidos/${pedidoId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Pedido cancelado y stock devuelto 🔄");
                onUpdate();
                onClose();
            } else {
                throw new Error("Error al cancelar");
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setCanceling(false);
        }
    }

    if (!pedidoId) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity ${pedidoId ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div
                className={`w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${pedido ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm font-medium">Cargando datos...</p>
                    </div>
                ) : pedido && (
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                        {/* STATUS & DATE */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {safeDate(pedido.creadoEn)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pedido.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                                        pedido.estado === 'ENVIADO' ? 'bg-blue-100 text-blue-700' :
                                            pedido.estado === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-slate-100 text-slate-500'
                                        }`}>
                                        {pedido.estado}
                                    </span>
                                    {pedido.estado === 'PENDIENTE' && (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">
                                            <Clock className="w-3 h-3" /> STOCK RESERVADO
                                        </div>
                                    )}
                                </div>
                            </div>

                            {pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO' && (
                                <button
                                    onClick={handleCancel}
                                    disabled={canceling}
                                    className="px-4 py-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    {canceling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    CANCELAR Y DEVOLVER STOCK
                                </button>
                            )}
                        </div>

                        {/* CLIENTE */}
                        <section className="bg-slate-50 p-6 rounded-3xl space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4" /> Información del Cliente
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{pedido.cliente?.nombre || "Cargando..."}</p>
                                    <p className="text-xs text-slate-500">{pedido.cliente?.telefono} · {pedido.cliente?.dni || 'Sin DNI'}</p>
                                </div>
                            </div>
                        </section>

                        {/* PRODUCTOS */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-4 h-4" /> Items del Pedido
                            </h4>
                            <div className="space-y-3">
                                {pedido.items?.map((it: any) => (
                                    <div key={it.id} className="flex gap-4 p-4 border border-slate-100 rounded-3xl hover:bg-slate-50 transition-colors">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                                            {it.variante.producto.imagenes?.[0]?.url && (
                                                <img src={it.variante.producto.imagenes[0].url} className="w-full h-full object-cover" alt="" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">{it.variante.producto.nombre}</p>
                                            <p className="text-xs text-slate-500">{it.variante.talla.nombre} / {it.variante.color.nombre}</p>
                                            <div className="mt-1 font-black text-slate-900 text-sm">
                                                {it.cantidad} x {formatMoney(Number(it.precioUnitario))}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-center">
                                            <div className="text-sm font-black text-slate-900">{formatMoney(Number(it.subtotal))}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* EMPAQUES / INSUMOS */}
                        {pedido.empaques?.length > 0 && (
                            <section className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-500" /> Insumos de Preparación
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {pedido.empaques.map((e: any) => (
                                        <div key={e.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-black">
                                                {e.cantidad}x
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{e.tipoEmpaque.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ENVÍO */}
                        <section className="bg-slate-50 p-6 rounded-3xl space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Destino de Envío
                            </h4>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-900">{pedido.direccion || 'Sin dirección'}</p>
                                <p className="text-xs text-slate-500">{pedido.distrito} {pedido.provincia} {pedido.departamento}</p>
                                {pedido.referencia && (
                                    <div className="mt-2 p-3 bg-white rounded-xl text-xs text-slate-600 italic border border-slate-100">
                                        "{pedido.referencia}"
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* TOTALES */}
                        <section className="border-t-2 border-dashed border-slate-100 pt-8 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="font-bold text-slate-900">{formatMoney(Number(pedido.subtotal))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Costo de Envío</span>
                                <span className="font-bold text-slate-900">{formatMoney(Number(pedido.costoEnvio))}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-900/10">
                                <span className="text-slate-400 font-black text-sm uppercase">Total</span>
                                <span className="text-2xl font-black">{formatMoney(Number(pedido.total))}</span>
                            </div>
                        </section>

                        {/* WHATSAPP MSG */}
                        {pedido.whatsappMessage && (
                            <section className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Mensaje Original
                                </h4>
                                <div className="p-4 bg-emerald-50 border-emerald-100 border text-emerald-800 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed">
                                    {pedido.whatsappMessage}
                                </div>
                            </section>
                        )}

                    </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="p-6 border-t bg-white flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 border border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        Cerrar
                    </button>
                    {pedido?.estado === 'PENDIENTE' && (
                        <button className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2">
                            MARCAR COMO ENVIADO
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
