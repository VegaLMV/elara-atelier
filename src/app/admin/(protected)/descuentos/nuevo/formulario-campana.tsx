"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Tag, Check, ArrowRight, Loader2, Save, Percent, DollarSign, Image as ImageIcon } from "lucide-react";
import { UploaderImage } from "@/components/ui/uploader-image";

interface ProductoInput {
    id: string;
    nombre: string;
    categoriaId: string | null;
    imagen: string | null;
    precio: number;
    stockTotal: number;
    estado: string;
}

export default function FormularioCampana({
    initialData,
    categorias,
    productos
}: {
    initialData?: any;
    categorias: { id: string; nombre: string }[];
    productos: ProductoInput[];
}) {
    const router = useRouter();

    const getPeruDateString = (dateStr: string | Date) => {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date(dateStr));
    };

    const todayStr = getPeruDateString(new Date());

    const [nombre, setNombre] = useState(initialData?.nombre || "");
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
    const [tipo, setTipo] = useState<"PORCENTAJE" | "MONTO">(initialData?.tipo || "PORCENTAJE");
    const [valor, setValor] = useState(initialData?.valor ? String(initialData.valor) : "");
    const [imagenUrl, setImagenUrl] = useState(initialData?.imagenUrl || "");

    const defaultStart = initialData?.startsAt ? getPeruDateString(initialData.startsAt) : "";
    const defaultEnd = initialData?.endsAt ? getPeruDateString(initialData.endsAt) : "";

    const [startsAt, setStartsAt] = useState(defaultStart);
    const [endsAt, setEndsAt] = useState(defaultEnd);

    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(initialData?.productoIds || []));
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(false);

    const toggleProducto = (id: string) => {
        const next = new Set(seleccionados);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSeleccionados(next);
    };

    const toggleCategoriaCompleta = (catId: string) => {
        const prods = productos.filter(p => p.categoriaId === catId);
        const todosSeleccionados = prods.every(p => seleccionados.has(p.id));
        const next = new Set(seleccionados);

        if (todosSeleccionados) {
            prods.forEach(p => next.delete(p.id));
        } else {
            prods.forEach(p => next.add(p.id));
        }
        setSeleccionados(next);
    };

    const productosFiltrados = productos.filter(p => {
        if (filtroCategoria && p.categoriaId !== filtroCategoria) return false;
        if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
        return true;
    });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre || !valor || !startsAt || !endsAt) {
            return toast.error("Completa los campos obligatorios");
        }
        if (seleccionados.size === 0) {
            return toast.error("Selecciona al menos un producto");
        }

        const v = parseFloat(valor);
        if (tipo === "PORCENTAJE" && (v <= 0 || v > 100)) return toast.error("Porcentaje inválido");
        if (tipo === "MONTO" && v <= 0) return toast.error("Monto inválido");

        setLoading(true);
        try {
            const endpoint = initialData ? `/api/admin/descuentos/${initialData.id}` : `/api/admin/descuentos`;
            const method = initialData ? "PATCH" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    descripcion,
                    tipo,
                    valor: v,
                    startsAt,
                    endsAt,
                    productoIds: Array.from(seleccionados),
                    imagenUrl
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(initialData ? "Campaña actualizada" : "Campaña creada");
            router.push("/admin/descuentos");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Ocurrió un error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col lg:flex-row gap-6 max-w-[1200px] mx-auto">
            {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
            <div className="flex-1 space-y-4">
                
                {/* Info Básica */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Tag className="w-4 h-4 text-emerald-500" /> Información Básica
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Nombre Comercial *</label>
                            <input
                                required
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                                placeholder="Ej: Cyber Wow 2026"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Descripción (Opcional)</label>
                            <textarea
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-sm h-20"
                                placeholder="Motivo o notas internas de la campaña..."
                            />
                        </div>
                    </div>
                </div>

                {/* Descuento y Vigencia (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Descuento */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <Percent className="w-4 h-4 text-blue-500" /> Descuento
                        </h2>
                        <div className="flex gap-2 mb-4">
                            <button 
                                type="button"
                                onClick={() => setTipo('PORCENTAJE')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${tipo === 'PORCENTAJE' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                Porcentaje (%)
                            </button>
                            <button 
                                type="button"
                                onClick={() => setTipo('MONTO')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${tipo === 'MONTO' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                Monto Fijo (S/)
                            </button>
                        </div>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                                {tipo === 'PORCENTAJE' ? <Percent className="w-3 h-3 text-gray-500" /> : <DollarSign className="w-3 h-3 text-gray-500" />}
                            </div>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={e => setValor(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-base font-black text-gray-900"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Vigencia */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                            <Calendar className="w-4 h-4 text-orange-500" /> Vigencia
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Fecha de Inicio</label>
                                <input
                                    required
                                    type="date"
                                    min={!initialData ? todayStr : undefined}
                                    value={startsAt}
                                    onChange={e => setStartsAt(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm text-gray-700 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Fecha de Fin</label>
                                <input
                                    required
                                    type="date"
                                    min={startsAt || todayStr}
                                    value={endsAt}
                                    onChange={e => setEndsAt(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm text-gray-700 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Banner */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                                <ImageIcon className="w-4 h-4 text-purple-500" /> Banner Promocional
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Se mostrará en la tienda (Rec: 1200x400px).</p>
                        </div>
                    </div>
                    <UploaderImage
                        onUpload={(url) => setImagenUrl(url)}
                        url={imagenUrl}
                        modulo="campanas"
                    />
                </div>
            </div>

            {/* COLUMNA DERECHA: PRODUCTOS */}
            <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:h-[calc(100vh-100px)] lg:sticky lg:top-6">
                
                <div className="bg-slate-900 p-4 sm:p-5 text-white shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-sm tracking-wide">Productos Aplicables</h2>
                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {seleccionados.size} de {productos.length}
                        </span>
                    </div>
                    
                    <div className="space-y-2">
                        <select 
                            value={filtroCategoria}
                            onChange={e => setFiltroCategoria(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 outline-none appearance-none cursor-pointer text-xs"
                        >
                            <option value="" className="text-gray-900">Todas las colecciones</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.id} className="text-gray-900">{c.nombre}</option>
                            ))}
                        </select>
                        <input
                            placeholder="Buscar producto..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 outline-none placeholder:text-white/40 text-xs"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-gray-50/50 min-h-[300px]">
                    {filtroCategoria && productosFiltrados.length > 0 && (
                        <button
                            type="button"
                            onClick={() => toggleCategoriaCompleta(filtroCategoria)}
                            className="w-full mb-2 py-2 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                        >
                            Marcar / Desmarcar esta colección
                        </button>
                    )}

                    {productosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <Tag className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-xs">No se encontraron productos.</p>
                        </div>
                    ) : (
                        productosFiltrados.map((p) => {
                            const seleccionado = seleccionados.has(p.id);
                            return (
                                <div 
                                    key={p.id}
                                    onClick={() => toggleProducto(p.id)}
                                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border bg-white ${seleccionado ? 'border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.2)]' : 'border-gray-100 hover:border-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${seleccionado ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                                        {seleccionado && <Check className="w-3 h-3" />}
                                    </div>
                                    <div className="w-9 h-9 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100">
                                        {p.imagen && <img src={p.imagen} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-gray-900 truncate">{p.nombre}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-500 font-mono">S/ {p.precio.toFixed(2)}</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">Stock: {p.stockTotal}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Botón Guardar - Fijo al fondo del sidebar */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                     <button
                        type="submit"
                        disabled={loading || seleccionados.size === 0}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? <Save className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
                        {initialData ? "Guardar Cambios" : "Confirmar Campaña"}
                     </button>
                     {seleccionados.size === 0 && (
                         <p className="text-center text-[10px] text-red-500 mt-2 font-medium">Debes seleccionar al menos un producto</p>
                     )}
                </div>
            </div>
        </form>
    );
}