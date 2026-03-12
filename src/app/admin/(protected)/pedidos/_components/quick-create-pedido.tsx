"use client";

import { useState } from "react";
import {
    X,
    Send,
    MessageSquare,
    ShoppingBag,
    Truck,
    AlertCircle,
    Loader2,
    Check
} from "lucide-react";
import { toast } from "sonner";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuickCreatePedido({ isOpen, onClose, onSuccess }: Props) {
    const [message, setMessage] = useState("");
    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Shipping logic
    const [costoEnvio, setCostoEnvio] = useState<number>(0);
    const [isFirstOrder, setIsFirstOrder] = useState<boolean>(true);

    if (!isOpen) return null;

    async function handleParse() {
        if (!message.trim()) return;
        setParsing(true);
        setParsedData(null);
        try {
            const res = await fetch("/api/admin/pedidos/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });
            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                setParsedData(data);
                setCostoEnvio(0);
                setIsFirstOrder(true);
            }
        } catch (error) {
            toast.error("Error al procesar el mensaje");
        } finally {
            setParsing(false);
        }
    }

    async function handleCreate() {
        if (!parsedData?.variante) {
            toast.error("Selecciona una variante válida primero");
            return;
        }

        setLoading(true);
        try {
            const pedidoObj = {
                clienteNombre: parsedData.parsed.clienteNombre || "Cliente de WhatsApp",
                items: [{
                    varianteId: parsedData.variante.id,
                    cantidad: 1,
                    precioUnitario: parsedData.parsed.precio || parsedData.producto.precio
                }],
                whatsappMessage: message,
                costoEnvioPersonalizado: costoEnvio
            };

            const res = await fetch("/api/admin/pedidos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedidoObj)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error al crear pedido");
            }

            toast.success("Pedido creado correctamente");
            onSuccess();
            onClose();
            setMessage("");
            setParsedData(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Importar Pedido</h2>
                            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Copia y pega el mensaje de WhatsApp</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* TEXTAREA AREA */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mensaje del Cliente</label>
                        <div className="relative">
                            <textarea
                                rows={5}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="¡Hola Elara Atelier! ✨..."
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono leading-relaxed"
                            />
                            <button
                                onClick={handleParse}
                                disabled={parsing || !message.trim()}
                                className="absolute bottom-4 right-4 bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                            >
                                {parsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* PARSED DATA AREA */}
                    {parsedData && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* PRODUCT CARD */}
                                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-indigo-500">
                                        <ShoppingBag className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Producto Detectado</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">{parsedData.producto.nombre}</h3>
                                        <p className="text-xs text-slate-500">Precio Sugerido: S/ {parsedData.producto.precio}</p>
                                    </div>

                                    {parsedData.variante ? (
                                        <div className="flex items-center gap-2 pt-2">
                                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700">Talla {parsedData.variante.talla}</span>
                                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700">{parsedData.variante.color}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-2 rounded-lg">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-bold">Variante no coincidente. Por favor selecciona una manualmente.</span>
                                        </div>
                                    )}
                                </div>

                                {/* STOCK INFO */}
                                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <Truck className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Información de Envío</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-600">Primer envío gratis</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isFirstOrder ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isFirstOrder ? 'left-[18px]' : 'left-0.5'}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-700">Costo Envio:</span>
                                        <input
                                            type="number"
                                            value={isNaN(costoEnvio) ? "" : costoEnvio}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setCostoEnvio(isNaN(val) ? 0 : Math.max(0, val));
                                            }}
                                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* VIRTUAL STOCK CHECK */}
                            {parsedData.variante && (
                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${parsedData.variante.stockVirtual > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${parsedData.variante.stockVirtual > 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                                            {parsedData.variante.stockVirtual > 0 ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold ${parsedData.variante.stockVirtual > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                Stock Disponible (Virtual): {parsedData.variante.stockVirtual}
                                            </p>
                                            <p className="text-[10px] text-slate-500 italic">Considerando otros pedidos pendientes.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
                        Descartar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !parsedData}
                        className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Pedido"}
                    </button>
                </div>
            </div>
        </div>
    );
}
