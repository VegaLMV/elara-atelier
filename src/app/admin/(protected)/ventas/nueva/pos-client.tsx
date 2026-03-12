"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Search,
    ShoppingCart,
    User,
    CreditCard,
    Trash2,
    Plus,
    Minus,
    Package,
    X,
    LayoutGrid,
    Loader2,
    Tag,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { calcularPrecioProducto, formatMoney } from "@/lib/precios";

// --- TIPOS ---
type ProductoPOS = {
    id: string;
    nombre: string;
    precioBase: number;
    categoriaId: string | null;
    imagen: string | null;
    descuento: { tipo: "PORCENTAJE" | "MONTO" | null; valor: number; inicio?: string | null; fin?: string | null; } | null;
    variantes: { id: string; talla: string; color: string; hex: string | null; stock: number }[];
};

type ItemCarrito = {
    uid: string;
    tipo: "PRODUCTO" | "EMPAQUE";
    idRef: string;
    titulo: string;
    detalle: string;
    precioUnitario: number;
    precioFinal: number;
    cantidad: number;
    stockMax: number;
    imagen?: string | null;
    descuentoAplicado?: number;
    descuentoRazon?: string;
};

type ClientePOS = { id: string; nombre: string; dni: string | null };
type EmpaquePOS = { id: string; nombre: string; stock: number; costo: number; imagenUrl: string | null };

// --- HELPERS ---
export default function PosClient({
    productosIniciales,
    clientesIniciales,
    empaquesIniciales,
    categorias
}: {
    productosIniciales: ProductoPOS[],
    clientesIniciales: ClientePOS[],
    empaquesIniciales: EmpaquePOS[],
    categorias: { id: string, nombre: string }[]
}) {
    const router = useRouter();

    function getColorStyle(hex: string | null) {
        if (!hex) return { backgroundColor: '#eee' };
        const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
        if (codes.length <= 1) return { backgroundColor: codes[0] || '#eee' };

        const percentage = 100 / codes.length;
        const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
        return { background: `linear-gradient(135deg, ${stops})` };
    }

    // --- ESTADOS ---
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [clienteSel, setClienteSel] = useState<string>(""); // ID cliente
    const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "YAPE" | "PLIN" | "TRANSFERENCIA">("EFECTIVO");

    // UI Estados
    const [busqueda, setBusqueda] = useState("");
    const [catFiltro, setCatFiltro] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoPOS | null>(null);
    const [loading, setLoading] = useState(false);
    const [modoEmpaque, setModoEmpaque] = useState(false);
    
    const [mostrarCarritoMovil, setMostrarCarritoMovil] = useState(false);

    // --- LÓGICA DE FILTRADO ---
    const itemsGrid = useMemo(() => {
        if (modoEmpaque) return empaquesIniciales;

        let lista = productosIniciales;
        if (catFiltro) lista = lista.filter(p => p.categoriaId === catFiltro);
        if (busqueda) {
            const q = busqueda.toLowerCase();
            lista = lista.filter(p => p.nombre.toLowerCase().includes(q));
        }
        return lista;
    }, [productosIniciales, empaquesIniciales, busqueda, catFiltro, modoEmpaque]);

    // --- LÓGICA CARRITO ---
    const agregarAlCarrito = (item: Omit<ItemCarrito, "uid">) => {
        setCarrito(prev => {
            const existe = prev.find(i => i.idRef === item.idRef && i.tipo === item.tipo);
            if (existe) {
                if (existe.cantidad + item.cantidad > existe.stockMax) {
                    toast.error("Stock insuficiente para agregar más.");
                    return prev;
                }
                return prev.map(i => i.uid === existe.uid ? { ...i, cantidad: i.cantidad + item.cantidad } : i);
            }
            return [...prev, { ...item, uid: Math.random().toString(36) }];
        });
        setProductoSeleccionado(null);
        toast.success("Agregado al carrito");
    };

    const quitarDelCarrito = (uid: string) => {
        setCarrito(prev => prev.filter(i => i.uid !== uid));
    };

    const cambiarCantidad = (uid: string, delta: number) => {
        setCarrito(prev => prev.map(i => {
            if (i.uid !== uid) return i;
            const nueva = i.cantidad + delta;
            if (nueva < 1) return i;
            if (nueva > i.stockMax) {
                toast.error("Stock máximo alcanzado");
                return i;
            }
            return { ...i, cantidad: nueva };
        }));
    };

    // --- TOTALES ---
    const subtotal = carrito.reduce((acc, i) => acc + (i.precioUnitario * i.cantidad), 0);
    const descuentoTotal = carrito.reduce((acc, i) => acc + ((i.descuentoAplicado || 0) * i.cantidad), 0);
    const totalPagar = subtotal - descuentoTotal;
    const totalReal = carrito.reduce((acc, i) => acc + (i.precioFinal * i.cantidad), 0);
    const ahorroTotal = subtotal - totalReal;
    const cantidadItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

    // --- PROCESAR VENTA ---
    const procesarVenta = async () => {
        if (carrito.length === 0) return toast.error("Carrito vacío");
        setLoading(true);

        const itemsProducto = carrito.filter(i => i.tipo === "PRODUCTO").map(i => ({
            varianteId: i.idRef,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            precioFinal: i.precioFinal,
            descuentoAplicado: i.descuentoAplicado || 0,
            descuentoRazon: i.descuentoRazon
        }));

        const itemsEmpaque = carrito.filter(i => i.tipo === "EMPAQUE").map(i => ({
            tipoEmpaqueId: i.idRef,
            cantidad: i.cantidad
        }));

        try {
            const res = await fetch("/api/admin/ventas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clienteId: clienteSel || null,
                    metodoPago,
                    items: itemsProducto,
                    empaques: itemsEmpaque
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Error al procesar venta");

            toast.success("¡Venta registrada con éxito!");
            router.push(`/admin/ventas/${data.id}`);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden relative">

            {/* === COLUMNA IZQ: CATÁLOGO === */}
            <div className="flex-1 flex flex-col bg-gray-50 lg:border-r lg:border-gray-200 h-full w-full">

                {/* Header Buscador */}
                <div className="p-3 sm:p-4 bg-white border-b border-gray-200 space-y-3 sm:space-y-4 shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/admin/ventas" className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors shrink-0">
                            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </Link>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <input
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm sm:text-base"
                                placeholder="Buscar producto..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filtros rápidos */}
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
                        <button
                            onClick={() => { setModoEmpaque(false); setCatFiltro(""); }}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${!modoEmpaque && !catFiltro ? 'bg-slate-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                            Todo Ropa
                        </button>
                        <button
                            onClick={() => setModoEmpaque(true)}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-colors shrink-0 ${modoEmpaque ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Package className="w-3 h-3 sm:w-4 sm:h-4" /> Empaques
                        </button>
                        {!modoEmpaque && categorias.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setCatFiltro(c.id)}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${catFiltro === c.id ? 'bg-slate-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {c.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Productos */}
                {/* En móviles, dejamos espacio extra abajo para el botón flotante del carrito */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {/* Modo EMPAQUES */}
                        {modoEmpaque ? (
                            (itemsGrid as EmpaquePOS[]).map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => agregarAlCarrito({
                                        tipo: "EMPAQUE", idRef: emp.id, titulo: emp.nombre, detalle: "Insumo",
                                        precioUnitario: 0, precioFinal: 0, cantidad: 1, stockMax: emp.stock,
                                        imagen: emp.imagenUrl
                                    })}
                                    className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 cursor-pointer hover:border-orange-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
                                >
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                        <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </div>
                                    <p className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2">{emp.nombre}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500">Stock: {emp.stock}</p>
                                </div>
                            ))
                        ) : (
                            // Modo PRODUCTOS
                            (itemsGrid as ProductoPOS[]).map(prod => (
                                <div
                                    key={prod.id}
                                    onClick={() => setProductoSeleccionado(prod)}
                                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col"
                                >
                                    <div className="aspect-square bg-gray-100 relative shrink-0">
                                        {prod.imagen ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={prod.imagen} className="w-full h-full object-cover" alt="" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] sm:text-xs">SIN FOTO</div>
                                        )}
                                        {prod.descuento && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-sm">
                                                {prod.descuento.tipo === 'PORCENTAJE' ? `-${prod.descuento.valor}%` : `-S/${prod.descuento.valor}`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-2 sm:p-3 flex flex-col justify-between flex-1">
                                        <p className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 leading-tight">{prod.nombre}</p>
                                        <div className="flex justify-between items-end sm:items-center mt-auto">
                                            <p className="text-slate-600 font-bold text-xs sm:text-sm">{formatMoney(prod.precioBase)}</p>
                                            <span className="text-[9px] sm:text-[10px] bg-gray-100 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-gray-500 font-medium">
                                                {prod.variantes.reduce((acc, v) => acc + v.stock, 0)} u.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {itemsGrid.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">
                             <Search className="w-10 h-10 mb-2" />
                             <p className="text-sm">No se encontraron resultados</p>
                         </div>
                    )}
                </div>
            </div>

            {/* === COLUMNA DER: CARRITO Y PAGO (RESPONSIVE) === */}
            {/* En Desktop (lg): Se muestra fijo a la derecha con ancho 400px.
                En Móvil (<lg): Se oculta a la derecha y se desliza con Translate.
            */}
            
            {/* Fondo oscuro móvil al abrir carrito */}
            {mostrarCarritoMovil && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setMostrarCarritoMovil(false)}
                />
            )}

            <div className={`fixed inset-y-0 right-0 z-50 w-[85vw] sm:w-[400px] bg-white flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mostrarCarritoMovil ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header Carrito */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" /> Nueva Venta
                        </h2>
                        {/* Botón cerrar solo móvil */}
                        <button 
                            className="p-2 lg:hidden bg-gray-200/50 rounded-full hover:bg-gray-200"
                            onClick={() => setMostrarCarritoMovil(false)}
                        >
                            <X className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Selector Cliente */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:border-slate-900 appearance-none cursor-pointer"
                            value={clienteSel}
                            onChange={e => setClienteSel(e.target.value)}
                        >
                            <option value="">-- Público General --</option>
                            {clientesIniciales.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lista Items */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 custom-scrollbar bg-white">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mb-2" />
                            <p className="text-xs sm:text-sm">Carrito vacío</p>
                        </div>
                    ) : (
                        carrito.map((item) => (
                            <div key={item.uid} className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:border-gray-200 transition-colors relative">
                                {/* Imagen Mini */}
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                    {item.imagen ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.imagen} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">IMG</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="font-bold text-gray-800 text-xs sm:text-sm truncate leading-tight">{item.titulo}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 truncate">{item.detalle}</p>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className="font-mono font-bold text-xs sm:text-sm">{formatMoney(item.precioFinal)}</span>
                                        {item.descuentoAplicado ? (
                                            <span className="text-[9px] sm:text-[10px] text-red-500 bg-red-50 px-1 rounded line-through">
                                                {formatMoney(item.precioUnitario)}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Controles Cantidad */}
                                <div className="flex flex-col items-end justify-between shrink-0 pl-1">
                                    <button onClick={() => quitarDelCarrito(item.uid)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 mt-1">
                                        <button onClick={() => cambiarCantidad(item.uid, -1)} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-600 hover:bg-white rounded shadow-sm transition-all"><Minus className="w-3 h-3" /></button>
                                        <span className="w-5 sm:w-6 text-center text-xs font-bold">{item.cantidad}</span>
                                        <button onClick={() => cambiarCantidad(item.uid, 1)} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-600 hover:bg-white rounded shadow-sm transition-all"><Plus className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Totales y Pago */}
                <div className="bg-white border-t border-gray-200 p-4 sm:p-5 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] shrink-0">

                    {/* Resumen */}
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>{formatMoney(subtotal)}</span>
                        </div>
                        {ahorroTotal > 0 && (
                            <div className="flex justify-between text-emerald-600 font-medium">
                                <span>Descuentos</span>
                                <span>- {formatMoney(ahorroTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-lg sm:text-xl font-black text-slate-900 border-t border-gray-100 pt-2 sm:pt-3 mt-1 sm:mt-2">
                            <span>Total</span>
                            <span>{formatMoney(totalReal)}</span>
                        </div>
                    </div>

                    {/* Métodos Pago */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        {["EFECTIVO", "YAPE", "PLIN", "TRANSFERENCIA"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMetodoPago(m as any)}
                                className={`py-2 px-1 rounded-lg text-[9px] sm:text-[10px] font-bold border transition-all truncate ${metodoPago === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                title={m}
                            >
                                {m === "TRANSFERENCIA" ? "TRANSF" : m}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={procesarVenta}
                        disabled={loading || carrito.length === 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 sm:py-4 rounded-xl font-black text-sm sm:text-lg shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />}
                        Cobrar {formatMoney(totalReal)}
                    </button>
                </div>
            </div>

            {/* BOTÓN FLOTANTE MÓVIL (Solo visible en LG y si hay items en el carrito) */}
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30">
                <button
                    onClick={() => setMostrarCarritoMovil(true)}
                    className="w-full bg-slate-900 text-white shadow-2xl rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingCart className="w-6 h-6" />
                            {cantidadItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                                    {cantidadItems}
                                </span>
                            )}
                        </div>
                        <span className="font-bold text-sm">Ver Carrito</span>
                    </div>
                    <div className="font-black text-lg bg-slate-800 px-3 py-1 rounded-xl">
                        {formatMoney(totalReal)}
                    </div>
                </button>
            </div>


            {/* === MODAL SELECCIÓN VARIANTE === */}
            {productoSeleccionado && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="relative h-40 sm:h-48 bg-gray-100">
                            {productoSeleccionado.imagen && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={productoSeleccionado.imagen} className="w-full h-full object-cover" alt="" />
                            )}
                            <button
                                onClick={() => setProductoSeleccionado(null)}
                                className="absolute top-3 right-3 bg-white/80 p-2 rounded-full hover:bg-white transition-colors"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
                                <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-1">{productoSeleccionado.nombre}</h3>
                                <p className="text-white/80 text-xs sm:text-sm">Selecciona una variante</p>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 max-h-[40vh] sm:max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                {productoSeleccionado.variantes.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 text-sm">Sin stock disponible</p>
                                ) : (
                                    productoSeleccionado.variantes.map(v => {
                                        const calc = calcularPrecioProducto({
                                            precio: productoSeleccionado.precioBase,
                                            descuentoActivo: !!productoSeleccionado.descuento,
                                            descuentoTipo: productoSeleccionado.descuento?.tipo || null,
                                            descuentoValor: productoSeleccionado.descuento?.valor || 0
                                        });
                                        const final = calc.precioFinal;
                                        const descuento = calc.ahorro;

                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => agregarAlCarrito({
                                                    tipo: "PRODUCTO",
                                                    idRef: v.id,
                                                    titulo: productoSeleccionado.nombre,
                                                    detalle: `${v.talla} · ${v.color}`,
                                                    precioUnitario: productoSeleccionado.precioBase,
                                                    precioFinal: final,
                                                    cantidad: 1,
                                                    stockMax: v.stock,
                                                    imagen: productoSeleccionado.imagen,
                                                    descuentoAplicado: descuento,
                                                    descuentoRazon: descuento > 0 ? "Oferta Catálogo" : undefined
                                                })}
                                                className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 hover:border-slate-900 hover:bg-slate-50 transition-all group active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border shadow-sm shrink-0" style={getColorStyle(v.hex)}></div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-800 text-xs sm:text-sm group-hover:text-slate-900">{v.color} / {v.talla}</p>
                                                        <p className="text-[10px] sm:text-xs text-gray-500">Stock: {v.stock}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-2">
                                                    <p className="font-black text-slate-900 text-sm">{formatMoney(final)}</p>
                                                    {descuento > 0 && <p className="text-[9px] sm:text-[10px] text-red-500 line-through">{formatMoney(productoSeleccionado.precioBase)}</p>}
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}