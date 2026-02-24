"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Truck,
    CheckCircle2,
    XCircle,
    Package,
    ChevronRight,
    Loader2,
    Calendar,
    User,
    Clock,
    MoreHorizontal,
    ClipboardList,
    Printer,
    Check,
    ChevronsUpDown,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/precios";
import PedidoFormModal from "./_components/pedido-form-modal";
import PedidoDetailsDrawer from "./_components/pedido-details-drawer";
import PrintOrdersModal from "./_components/print-orders-modal";
import { OrdersDeadlineAlert } from "./_components/orders-deadline-alert";
import Pagination from "@/components/ui/pagination";

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
});

function safeDate(dateStr: any, formatter: Intl.DateTimeFormat) {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '---';
        return formatter.format(d);
    } catch (e) {
        return '---';
    }
}

/**
 * ESTADOS DE PEDIDO
 */
const ESTADOS = [
    { id: "ALL", label: "Todos", color: "bg-slate-100 text-slate-600" },
    { id: "PENDIENTE", label: "Pendientes", color: "bg-amber-100 text-amber-700" },
    { id: "ENVIADO", label: "Enviados", color: "bg-blue-100 text-blue-700" },
    { id: "ENTREGADO", label: "Entregados", color: "bg-emerald-100 text-emerald-700" },
    { id: "CANCELADO", label: "Cancelados", color: "bg-slate-100 text-slate-500" },
];

export default function PedidosClient() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterEstado, setFilterEstado] = useState("ALL");
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
    const [preselectedClienteId, setPreselectedClienteId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>(null); // NEW
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // ... (in render)

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const isNew = searchParams.get("new") === "true";
        const cid = searchParams.get("clienteId");
        if (isNew) {
            setPreselectedClienteId(cid);
            setIsFormOpen(true);
            // Limpiar params para que no se re-abra al refrescar
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("new");
            newParams.delete("clienteId");
            router.replace(`/admin/pedidos?${newParams.toString()}`, { scroll: false });
        }
    }, [searchParams]);

    useEffect(() => {
        fetchPedidos();
    }, [filterEstado, searchParams]);

    async function fetchPedidos() {
        setLoading(true);
        try {
            const page = searchParams.get("page") || "1";
            const res = await fetch(`/api/admin/pedidos?estado=${filterEstado}&page=${page}&limit=25`);
            const data = await res.json();

            if (data.data) {
                setPedidos(data.data);
                setTotalPages(data.metadata.totalPages);
            } else {
                setPedidos([]); // Fallback
            }
        } catch (error) {
            toast.error("Error al cargar pedidos");
        } finally {
            setLoading(false);
        }
    }

    async function handleBatchStatus(nuevoEstado: string) {
        if (selectedIds.length === 0) return;
        try {
            const res = await fetch("/api/admin/pedidos/batch", {
                method: "PATCH",
                body: JSON.stringify({ ids: selectedIds, estado: nuevoEstado })
            });
            if (res.ok) {
                toast.success(`Pedidos actualizados a ${nuevoEstado}`);
                setSelectedIds([]);
                fetchPedidos();
            }
        } catch (error) {
            toast.error("Error al actualizar pedidos");
        }
    }

    const filteredPedidos = pedidos.filter(p =>
        p.codigo.toLowerCase().includes(search.toLowerCase()) ||
        p.cliente?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        p.cliente?.dni?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-full max-w-7xl mx-auto">
            <OrdersDeadlineAlert />

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-indigo-500" />
                        Gestión de Pedidos
                    </h1>
                    <p className="text-slate-500 font-medium">Administra y reserva stock para ventas directas o redes sociales.</p>
                </div>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" /> RECOGER NUEVO PEDIDO
                </button>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-slate-900 outline-none transition-all text-sm font-medium"
                        placeholder="Buscar por código o nombre de cliente..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl overflow-x-auto w-full md:w-auto overflow-hidden">
                    {ESTADOS.map(est => (
                        <button
                            key={est.id}
                            onClick={() => setFilterEstado(est.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${filterEstado === est.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {est.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE SECTION */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="p-6">
                                    <input
                                        type="checkbox"
                                        className="rounded-lg border-slate-200 text-slate-900 focus:ring-slate-900 w-5 h-5"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(filteredPedidos.map(p => p.id));
                                            else setSelectedIds([]);
                                        }}
                                    />
                                </th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                <th className="p-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Package className="w-16 h-16" />
                                            <p className="font-bold">No se encontraron pedidos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPedidos.map((pedido) => (
                                    <tr
                                        key={pedido.id}
                                        className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                                        onClick={() => setSelectedPedidoId(pedido.id)}
                                    >
                                        <td className="p-6" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(pedido.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedIds([...selectedIds, pedido.id]);
                                                    else setSelectedIds(selectedIds.filter(id => id !== pedido.id));
                                                }}
                                                className="rounded-lg border-slate-200 text-slate-900 focus:ring-slate-900 w-5 h-5"
                                            />
                                        </td>
                                        <td className="p-6">
                                            <span className="font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl text-xs">#{pedido.codigo.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{pedido.cliente?.nombre || '---'}</p>
                                                    <p className="text-[10px] text-slate-500">{pedido.cliente?.telefono || 'Sin telf.'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{safeDate(pedido.creadoEn, dateFormatter)}</span>
                                                <span className="text-[10px] text-slate-400">{safeDate(pedido.creadoEn, timeFormatter)}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${pedido.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                                                pedido.estado === 'ENVIADO' ? 'bg-blue-100 text-blue-700' :
                                                    pedido.estado === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-slate-100 text-slate-500'
                                                }`}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-black text-slate-900">
                                            {formatMoney(Number(pedido.total))}
                                        </td>
                                        <td className="p-6 text-right">
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 group-hover:text-slate-900 transition-all ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* BATCH ACTION BAR */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-300 border border-slate-800 max-w-[90vw] overflow-x-auto">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-700 shrink-0">
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-black text-xs">{selectedIds.length}</div>
                            <span className="text-sm font-bold opacity-80 whitespace-nowrap">Seleccionados</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBatchStatus("ENVIADO")}
                                className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-800 rounded-2xl transition-all text-xs font-black"
                            >
                                <Truck className="w-4 h-4 text-blue-400" /> MARCAR ENVIADO
                            </button>
                            <button
                                onClick={() => handleBatchStatus("ENTREGADO")}
                                className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-800 rounded-2xl transition-all text-xs font-black"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> MARCAR ENTREGADO
                            </button>
                            <button
                                onClick={() => setShowPrintModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-2 border-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                            >
                                <Printer className="w-4 h-4" /> Imprimir Alistamiento
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-800 rounded-2xl transition-all text-xs font-black text-slate-400"
                            >
                                <XCircle className="w-4 h-4" /> CANCELAR
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Pagination totalPages={totalPages} />

            <PedidoFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setPreselectedClienteId(null); setEditData(null); }}
                onSuccess={fetchPedidos}
                initialClienteId={preselectedClienteId}
                initialData={editData}
            />

            <PedidoDetailsDrawer
                pedidoId={selectedPedidoId}
                onClose={() => setSelectedPedidoId(null)}
                onUpdate={fetchPedidos}
                onEdit={(pedido) => {
                    setEditData(pedido);
                    setSelectedPedidoId(null); // Close drawer
                    setIsFormOpen(true); // Open modal
                }}
            />

            <PrintOrdersModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                pedidos={pedidos.filter(p => selectedIds.includes(p.id))}
            />
        </div>
    );
}
