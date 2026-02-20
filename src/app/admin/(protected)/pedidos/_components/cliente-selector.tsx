"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, Check, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";
import ClienteForm from "../../clientes/cliente-form";

interface Cliente {
    id: string;
    nombre: string;
    telefono: string | null;
    dni: string | null;
    direccion?: string | null;
    distrito?: string | null;
    provincia?: string | null;
    departamento?: string | null;
    referencia?: string | null;
}

interface Props {
    onSelect: (cliente: Cliente) => void;
    initialClientes?: Cliente[];
    selectedId?: string;
}

export default function ClienteSelector({ onSelect, initialClientes = [], selectedId }: Props) {
    const [query, setQuery] = useState("");
    const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Cliente | null>(null);
    const [isCreatingModal, setIsCreatingModal] = useState(false);

    useEffect(() => {
        if (initialClientes.length > 0 && !query) {
            setClientes(initialClientes);
        }
    }, [initialClientes, query]);

    useEffect(() => {
        if (selectedId) {
            // Buscar en la lista actual o traer de la API
            const found = clientes.find(c => c.id === selectedId);
            if (found) {
                setSelected(found);
                onSelect(found);
            } else {
                // Si no está en la lista inicial, lo buscamos específicamente
                fetch(`/api/admin/clientes/${selectedId}`)
                    .then(res => {
                        if (!res.ok) return null;
                        const contentType = res.headers.get("content-type");
                        if (contentType && contentType.indexOf("application/json") !== -1) {
                            return res.json();
                        }
                        return null;
                    })
                    .then(data => {
                        if (data && !data.error) {
                            setSelected(data);
                            onSelect(data);
                        }
                    })
                    .catch(err => console.error("Error fetching client by ID:", err));
            }
        } else {
            setSelected(null);
        }
    }, [selectedId, initialClientes]);

    useEffect(() => {
        if (query.length > 2) {
            const timer = setTimeout(searchClientes, 300);
            return () => clearTimeout(timer);
        }
    }, [query]);

    async function searchClientes() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/clientes?q=${query}`);
            const data = await res.json();
            setClientes(data);
        } catch (error) {
            console.error("Error searching clientes", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Cliente</label>
                <button
                    onClick={() => setIsCreatingModal(true)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <UserPlus className="w-3 h-3" /> Nuevo Cliente
                </button>
            </div>

            {/* MODAL PARA NUEVO CLIENTE */}
            {isCreatingModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <UserPlus className="w-6 h-6 text-emerald-500" /> Nuevo Registro de Cliente
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">Completa los datos para guardarlo en la cartera principal</p>
                            </div>
                            <button
                                onClick={() => setIsCreatingModal(false)}
                                className="p-2 hover:bg-white rounded-full transition-all hover:shadow-md"
                            ><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <ClienteForm
                                isModal
                                onSuccess={(newC) => {
                                    setIsCreatingModal(false);
                                    setSelected(newC);
                                    onSelect(newC);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                {selected ? (
                    <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl shadow-lg animate-in zoom-in-95">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{selected.nombre}</p>
                                <p className="text-[10px] text-slate-400">{selected.telefono || "Sin teléfono"} {selected.dni && `· DNI: ${selected.dni}`}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setSelected(null); onSelect({} as any); }}
                            className="p-1 hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            placeholder="Buscar por nombre, DNI o teléfono..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {clientes.length > 0 && query.length > 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto">
                                {clientes.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setSelected(c); onSelect(c); setQuery(""); setClientes([]); }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{c.nombre}</p>
                                            <p className="text-[10px] text-slate-500">{c.telefono} · {c.dni}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
