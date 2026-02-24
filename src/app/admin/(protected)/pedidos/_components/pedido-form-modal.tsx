"use client";

import { useState, useEffect } from "react";
import {
    X,
    MessageSquare,
    Plus,
    Trash2,
    ChevronRight,
    Loader2,
    Truck,
    DollarSign,
    FileText,
    MousePointer2,
    PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/precios";
import ClienteSelector from "./cliente-selector";
import ProductPicker from "./product-picker";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialClienteId?: string | null;
    initialData?: any; // Para modo edición
}

export default function PedidoFormModal({ isOpen, onClose, onSuccess, initialClienteId, initialData }: Props) {
    const isEditMode = !!initialData;
    const [tab, setTab] = useState<"WHATSAPP" | "MANUAL">("WHATSAPP");
    const [loading, setLoading] = useState(false);
    const [masterData, setMasterData] = useState<any>(null);

    // Form State
    const [cliente, setCliente] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [empaquesSel, setEmpaquesSel] = useState<{ tipoEmpaqueId: string, cantidad: number, nombre: string, stock: number }[]>([]);
    const [costoEnvio, setCostoEnvio] = useState(0);
    const [direccion, setDireccion] = useState("");
    const [distrito, setDistrito] = useState("");
    const [provincia, setProvincia] = useState("");
    const [departamento, setDepartamento] = useState("");
    const [referencia, setReferencia] = useState("");
    const [whatsappMessage, setWhatsappMessage] = useState("");
    const [notas, setNotas] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMasterData();
            if (initialData) {
                // Cargar datos existentes
                setTab("MANUAL"); // Forzar manual en edición
                setCliente(initialData.cliente);
                setItems(initialData.items.map((i: any) => ({
                    varianteId: i.varianteId,
                    cantidad: i.cantidad,
                    precioUnitario: Number(i.precioUnitario),
                    titulo: i.variante?.producto?.nombre || "Producto",
                    detalle: `${i.variante?.color?.nombre} / ${i.variante?.talla?.nombre}`,
                    imagen: i.variante?.producto?.imagenes?.[0]?.url,
                    stockMax: 999 // En edición, asumimos que se puede mantener lo que ya tiene, la API valida
                })));
                setEmpaquesSel(initialData.empaques?.map((e: any) => ({
                    tipoEmpaqueId: e.tipoEmpaqueId,
                    cantidad: e.cantidad,
                    nombre: e.tipoEmpaque?.nombre || "Empaque",
                    stock: 999
                })) || []);
                setCostoEnvio(Number(initialData.costoEnvio) || 0);
                setDireccion(initialData.direccion || "");
                setDistrito(initialData.distrito || "");
                setProvincia(initialData.provincia || "");
                setDepartamento(initialData.departamento || "");
                setReferencia(initialData.referencia || "");
                setNotas(initialData.notas || "");
            }
        } else {
            // Limpieza al cerrar modal
            setCliente(null);
            setItems([]);
            setEmpaquesSel([]);
            setCostoEnvio(0);
            setDireccion("");
            setDistrito("");
            setProvincia("");
            setDepartamento("");
            setReferencia("");
            setWhatsappMessage("");
            setNotas("");
            setShowConfirm(false);
            setTab("WHATSAPP");
        }
    }, [isOpen, initialData]);

    async function fetchMasterData() {
        try {
            const res = await fetch("/api/admin/pedidos/master-data");
            const data = await res.json();
            setMasterData(data);
        } catch (e) {
            toast.error("Error al cargar datos");
        }
    }

    // --- WHATSAPP PARSER ---
    async function handleParseWhatsApp() {
        if (!whatsappMessage) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/pedidos/parse", {
                method: "POST",
                body: JSON.stringify({ message: whatsappMessage })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (data.items && data.items.length > 0) {
                let count = 0;
                let errors = 0;

                data.items.forEach((item: any) => {
                    if (item.success && item.variante) {
                        addItem({
                            varianteId: item.variante.id,
                            cantidad: item.parsed.cantidad || 1,
                            precioUnitario: item.parsed.precio || item.producto.precio,
                            titulo: item.producto.nombre,
                            detalle: `${item.variante.talla} · ${item.variante.color}`,
                            imagen: item.producto.imagenes?.[0]?.url,
                            stockMax: item.variante.stockActual
                        });
                        count++;
                    } else {
                        errors++;
                    }
                });

                if (count > 0) {
                    toast.success(`${count} producto(s) detectado(s) y agregado(s)`);
                }
                if (errors > 0) {
                    toast.error(`${errors} producto(s) no se pudieron identificar completamente. Revisa el mensaje e inténtalo manualmente.`);
                }
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    function addItem(item: any) {
        if (item.stockMax <= 0) {
            toast.error(`No hay stock disponible para agregar este producto.`);
            return;
        }

        setItems(prev => {
            const existe = prev.find(i => i.varianteId === item.varianteId);
            if (existe) {
                if (existe.cantidad + 1 > item.stockMax) {
                    toast.error(`Solo quedan ${item.stockMax} unidades en stock.`);
                    return prev;
                }
                // Si existe, incrementamos cantidad (opcionalmente)
                // Pero la lógica actual solo retorna prev y avisa.
                // Si queremos que incremente:
                // return prev.map(i => i.varianteId === item.varianteId ? { ...i, cantidad: i.cantidad + 1 } : i);

                toast.info("Item ya está en la lista. Ajusta la cantidad si necesitas más.");
                return prev;
            }
            return [...prev, item];
        });
    }

    function removeItem(vId: string) {
        setItems(prev => prev.filter(i => i.varianteId !== vId));
    }

    function addEmpaque(emp: any) {
        setEmpaquesSel(prev => {
            const existe = prev.find(e => e.tipoEmpaqueId === emp.id);
            if (existe) {
                if (existe.cantidad + 1 > emp.stock) {
                    toast.error("Stock insuficiente de empaque");
                    return prev;
                }
                return prev.map(e => e.tipoEmpaqueId === emp.id ? { ...e, cantidad: e.cantidad + 1 } : e);
            }
            return [...prev, { tipoEmpaqueId: emp.id, cantidad: 1, nombre: emp.nombre, stock: emp.stock }];
        });
    }

    function removeEmpaque(id: string) {
        setEmpaquesSel(prev => prev.filter(e => e.tipoEmpaqueId !== id));
    }

    const subtotal = items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario), 0);
    const total = subtotal + costoEnvio;

    async function handleSubmit() {
        if (!cliente?.id) return toast.error("Por favor selecciona un cliente");
        if (items.length === 0) return toast.error("Agrega al menos un producto");

        setLoading(true);
        try {
            const url = isEditMode ? `/api/admin/pedidos/${initialData.id}` : "/api/admin/pedidos";
            const method = isEditMode ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clienteId: cliente.id,
                    direccion,
                    distrito,
                    provincia,
                    departamento,
                    referencia,
                    items,
                    empaques: empaquesSel,
                    costoEnvio,
                    whatsappMessage,
                    notas
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(isEditMode ? "Pedido actualizado correctamente" : "Pedido creado correctamente");
            setShowConfirm(false);
            onSuccess();
            onClose();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-hidden">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <PackageCheck className="w-8 h-8 text-emerald-500" /> {isEditMode ? "Editar Pedido" : "Nuevo Pedido"}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">{isEditMode ? `Modificando orden #${initialData.codigo}` : "Reserva prendas y gestiona el envío"}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all hover:shadow-xl"><X /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* COL IZQ: DATOS Y PRODUCTOS */}
                    <div className="flex-1 overflow-y-auto p-8 border-r border-slate-100 flex flex-col gap-8 custom-scrollbar">

                        {/* CLIENTE */}
                        <section className="space-y-4">
                            <ClienteSelector
                                initialClientes={masterData?.clientes || []}
                                selectedId={initialClienteId || undefined}
                                onSelect={(c) => {
                                    setCliente(c);
                                    if (c?.id) {
                                        setDireccion(c.direccion || "");
                                        setDistrito(c.distrito || "");
                                        setProvincia(c.provincia || "");
                                        setDepartamento(c.departamento || "");
                                        setReferencia(c.referencia || "");
                                    }
                                }}
                            />
                        </section>

                        {/* PRODUCTOS */}
                        <section className="space-y-6">
                            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                                <button
                                    onClick={() => setTab("WHATSAPP")}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${tab === 'WHATSAPP' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                                >
                                    <MessageSquare className="w-4 h-4" /> Link WhatsApp
                                </button>
                                <button
                                    onClick={() => setTab("MANUAL")}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${tab === 'MANUAL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                                >
                                    <MousePointer2 className="w-4 h-4" /> Manual / POS
                                </button>
                            </div>

                            {tab === "WHATSAPP" ? (
                                <div className="space-y-3">
                                    <textarea
                                        className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:border-slate-900 outline-none transition-all placeholder:text-slate-400 font-mono"
                                        placeholder="Pega aquí el mensaje de WhatsApp..."
                                        value={whatsappMessage}
                                        onChange={e => setWhatsappMessage(e.target.value)}
                                    />
                                    <button
                                        onClick={handleParseWhatsApp}
                                        disabled={loading || !whatsappMessage}
                                        className="w-full bg-slate-900 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                        Analizar Mensaje
                                    </button>
                                </div>
                            ) : (
                                <ProductPicker
                                    productos={masterData?.productos || []}
                                    onAdd={addItem}
                                />
                            )}

                            {/* LISTA DE ITEMS SELECCIONADOS */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Prendas en el pedido</h4>
                                {items.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-400 text-sm">
                                        No hay productos agregados
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {items.map(item => (
                                            <div key={item.varianteId} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm animate-in slide-in-from-right-2">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                                    {item.imagen && <img src={item.imagen} className="w-full h-full object-cover" alt="" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{item.titulo}</p>
                                                    <p className="text-[10px] text-slate-500">{item.detalle}</p>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div className="font-bold text-sm">{formatMoney(item.precioUnitario)}</div>
                                                    <button onClick={() => removeItem(item.varianteId)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SECCIÓN DE EMPAQUES / SUMINISTROS */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <PackageCheck className="w-4 h-4" /> Alistamiento / Empaque
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="text-[10px] font-bold py-1 px-2 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-slate-900"
                                            onChange={(e) => {
                                                const emp = masterData?.empaques?.find((em: any) => em.id === e.target.value);
                                                if (emp) {
                                                    addEmpaque(emp);
                                                    e.target.value = "";
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>+ Agregar Insumo</option>
                                            {masterData?.empaques?.map((emp: any) => (
                                                <option key={emp.id} value={emp.id} disabled={emp.stock <= 0}>
                                                    {emp.nombre} (Stock: {emp.stock})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {empaquesSel.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic px-2">No se han registrado insumos de empaque para este pedido.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {empaquesSel.map(emp => (
                                            <div key={emp.tipoEmpaqueId} className="flex items-center justify-between p-2 pl-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-700 truncate">{emp.nombre}</p>
                                                    <p className="text-[9px] text-slate-500 font-medium">Cantidad: {emp.cantidad}</p>
                                                </div>
                                                <button onClick={() => removeEmpaque(emp.tipoEmpaqueId)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* COL DER: ENVÍO Y RESUMEN */}
                    <div className="w-96 bg-slate-50 p-8 flex flex-col gap-8 shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)] overflow-y-auto">

                        <section className="space-y-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Truck className="w-4 h-4" /> Datos de Envío
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 ml-1">DIRECCIÓN</label>
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all"
                                        placeholder="Ej. Av. Larco 123"
                                        value={direccion}
                                        onChange={e => setDireccion(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Departamento</label>
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all"
                                        placeholder="Ej: Lima"
                                        value={departamento}
                                        onChange={e => setDepartamento(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Provincia</label>
                                        <input
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all"
                                            placeholder="Ej: Lima"
                                            value={provincia}
                                            onChange={e => setProvincia(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Distrito / Ciudad</label>
                                        <input
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all"
                                            placeholder="Ej: Miraflores"
                                            value={distrito}
                                            onChange={e => setDistrito(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">DIRECCIÓN</label>
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all"
                                        placeholder="Ej. Av. Larco 123"
                                        value={direccion}
                                        onChange={e => setDireccion(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">REFERENCIA / NOTAS ENTREGA</label>
                                    <input
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all"
                                        placeholder="Ej. Portón negro, frente al parque"
                                        value={referencia}
                                        onChange={e => setReferencia(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 ml-1">NOTAS INTERNAS (PEDIDO)</label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none text-sm transition-all min-h-[50px]"
                                        placeholder="Notas adicionales para el pedido..."
                                        value={notas}
                                        onChange={e => setNotas(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6 mt-auto">
                            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{formatMoney(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-slate-500">Costo Envío</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">S/</span>
                                        <input
                                            type="number"
                                            className="w-20 text-right font-bold text-slate-900 bg-transparent border-b-2 border-slate-100 focus:border-slate-900 outline-none"
                                            value={costoEnvio}
                                            onChange={e => setCostoEnvio(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t-2 border-dashed border-slate-50 flex justify-between items-center">
                                    <span className="font-black text-slate-900">TOTAL</span>
                                    <span className="text-2xl font-black text-slate-900">{formatMoney(total)}</span>
                                </div>
                            </div>

                            {!showConfirm ? (
                                <button
                                    onClick={() => {
                                        if (!cliente?.id) {
                                            toast.error("Por favor selecciona un cliente antes de continuar");
                                            return;
                                        }
                                        if (items.length === 0) {
                                            toast.error("Agrega al menos un producto al pedido");
                                            return;
                                        }
                                        setShowConfirm(true);
                                    }}
                                    className={`w-full py-5 rounded-[1.5rem] font-black text-lg shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${(cliente?.id && items.length > 0)
                                        ? "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    Revisar y Continuar
                                </button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-[2rem] shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Resumen de Reserva</p>
                                        </div>
                                        <div className="space-y-2 text-xs text-amber-800 font-medium">
                                            <p>• Se reservarán <b>{items.length} prenda(s)</b>.</p>
                                            <p>• Cliente: <b>{cliente?.nombre}</b></p>
                                            <p>• Total a cobrar: <b>{formatMoney(total)}</b></p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setShowConfirm(false)}
                                            className="bg-white border-2 border-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-colors"
                                        >
                                            Corregir
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                                            {isEditMode ? "GUARDAR CAMBIOS" : "SÍ, ASEGURAR"}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] text-center text-slate-400 font-bold px-4">
                                * El stock de las prendas se descontará de inmediato para reserva.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
