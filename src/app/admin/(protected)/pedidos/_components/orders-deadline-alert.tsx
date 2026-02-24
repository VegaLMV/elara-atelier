"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, X, ChevronRight, Loader2 } from "lucide-react";

export function OrdersDeadlineAlert() {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<{ urgentes: any[], criticos: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAlerts = async () => {
            try {
                const res = await fetch("/api/admin/pedidos/alertas");
                const data = await res.json();

                if (data.totalAlertas > 0) {
                    setAlerts(data);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error checking order alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAlerts();
    }, []);

    if (!alerts || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[500px] shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* HEADER / STATUS */}
                <div className={`p-8 ${alerts.criticos.length > 0 ? "bg-red-50" : "bg-amber-50"} relative overflow-hidden`}>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/50 transition-colors z-20"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${alerts.criticos.length > 0 ? "bg-red-600 shadow-xl shadow-red-200" : "bg-amber-500 shadow-xl shadow-amber-200"} text-white`}>
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-black ${alerts.criticos.length > 0 ? "text-red-900" : "text-amber-900"} tracking-tight`}>
                                Plazos de Entrega
                            </h2>
                            <p className={`${alerts.criticos.length > 0 ? "text-red-700" : "text-amber-700"} text-sm font-medium`}>
                                Hay pedidos pendientes que requieren atención.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-8 space-y-6">
                    {alerts.criticos.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-100 px-3 py-1 rounded-full">
                                    🔴 CRÍTICO (+4 DÍAS)
                                </span>
                                <span className="text-xs font-bold text-red-600">{alerts.criticos.length} pedidos</span>
                            </div>
                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2 max-h-32 overflow-y-auto">
                                {alerts.criticos.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-sm font-medium">
                                        <span className="font-mono font-bold text-red-950 px-2 py-0.5 bg-white rounded-lg border border-red-100 shadow-sm text-xs">#{p.codigo.slice(-6).toUpperCase()}</span>
                                        <span className="text-red-700 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Hace {Math.floor((new Date().getTime() - new Date(p.creadoEn).getTime()) / (1000 * 60 * 60 * 24))} días
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {alerts.urgentes.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                                    🟠 URGENTE (3 DÍAS)
                                </span>
                                <span className="text-xs font-bold text-amber-600">{alerts.urgentes.length} pedidos</span>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-2 max-h-32 overflow-y-auto">
                                {alerts.urgentes.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-sm font-medium">
                                        <span className="font-mono font-bold text-amber-950 px-2 py-0.5 bg-white rounded-lg border border-amber-100 shadow-sm text-xs">#{p.codigo.slice(-6).toUpperCase()}</span>
                                        <span className="text-amber-700 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Hace 3 días
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            ENTENDIDO, IR A GESTIONAR <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            Política de Élara Atelier
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium italic">
                            Entrega máxima: 4 días calendario.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
