"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, ShoppingCart, Minus, Plus, User, CreditCard, Loader2, X, Package } from "lucide-react";

// --- TIPOS ---
// ... (Tus tipos Variante, Producto, ItemCarrito, EmpaqueInfo, EmpaqueSeleccionado se mantienen igual) ...
type Variante = {
  id: string;
  talla: { nombre: string };
  color: { nombre: string; hex: string | null };
  stockActual: number;
  sku: string | null;
};

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  precioFinal: number;
  stockTotal: number;
  imagen: string;
  categoriaId: string | null;
  descuentoActivo: boolean;
  descuentoValor: number;
  descuentoTipo: "PORCENTAJE" | "MONTO" | null;
  variantes: Variante[];
};

type ItemCarrito = {
  tempId: string;
  productoId: string;
  nombre: string;
  varianteId: string;
  talla: string;
  color: string;
  precioUnitario: number;
  precioFinal: number;
  cantidad: number;
  maxStock: number;
  descuentoAplicado: number;
};

type EmpaqueInfo = {
    id: string;
    nombre: string;
    costoUnitario: number; 
    stock: number;
};

type EmpaqueSeleccionado = {
    id: string;
    nombre: string;
    cantidad: number;
    stockMax: number;
};

// --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE EN PROPS ---
type Props = {
  productosIniciales: any[];
  categorias: any[];
  clientes: any[];
  tiposEmpaque: EmpaqueInfo[];
  vendedorId: string;
  initialClienteId?: string; // <--- AGREGAR ESTA LÍNEA (opcional con ?)
};

// --- RECIBIR EL PROP EN LA FUNCIÓN ---
export default function PosClient({ 
  productosIniciales, 
  categorias, 
  clientes, 
  tiposEmpaque, 
  vendedorId,
  initialClienteId // <--- DESESTRUCTURAR AQUÍ
}: Props) {
  const router = useRouter();
  
  // --- ESTADOS ---
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [empaquesCart, setEmpaquesCart] = useState<EmpaqueSeleccionado[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("TODAS");
  
  // --- USARLO EN EL ESTADO INICIAL ---
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(initialClienteId || null); // <--- AQUÍ
  
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [loading, setLoading] = useState(false);
  const [productoEnSeleccion, setProductoEnSeleccion] = useState<Producto | null>(null);

  // ... (El resto del código se mantiene exactamente igual) ...
  
  // --- LÓGICA DE FILTRADO ---
  const productosFiltrados = useMemo(() => {
    return productosIniciales.filter(p => {
      const matchTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchCat = categoriaActiva === "TODAS" || p.categoriaId === categoriaActiva;
      return matchTexto && matchCat;
    });
  }, [productosIniciales, busqueda, categoriaActiva]);

  // ... (Resto de funciones: abrirSeleccionVariante, agregarAlCarrito, procesarVenta, etc.) ...
  
  const totales = useMemo(() => {
    return carrito.reduce((acc, item) => {
      acc.subtotal += item.precioUnitario * item.cantidad;
      acc.descuento += item.descuentoAplicado * item.cantidad;
      acc.total += item.precioFinal * item.cantidad;
      return acc;
    }, { subtotal: 0, descuento: 0, total: 0 });
  }, [carrito]);

  const abrirSeleccionVariante = (producto: Producto) => {
    if (producto.stockTotal <= 0) {
      toast.error("Producto agotado");
      return;
    }
    if (producto.variantes.length === 1) {
        agregarAlCarrito(producto, producto.variantes[0]);
    } else {
        setProductoEnSeleccion(producto);
    }
  };

  const agregarAlCarrito = (producto: Producto, variante: Variante) => {
    if (variante.stockActual <= 0) {
        toast.error("Variante sin stock");
        return;
    }

    setCarrito(prev => {
      const tempId = `${producto.id}-${variante.id}`;
      const existente = prev.find(i => i.tempId === tempId);

      if (existente) {
        if (existente.cantidad + 1 > variante.stockActual) {
            toast.warning("Stock máximo alcanzado para esta variante");
            return prev;
        }
        return prev.map(i => i.tempId === tempId ? { ...i, cantidad: i.cantidad + 1 } : i);
      }

      const descuentoMonto = producto.precio - producto.precioFinal;

      return [...prev, {
        tempId,
        productoId: producto.id,
        nombre: producto.nombre,
        varianteId: variante.id,
        talla: variante.talla.nombre,
        color: variante.color.nombre,
        precioUnitario: producto.precio,
        precioFinal: producto.precioFinal,
        cantidad: 1,
        maxStock: variante.stockActual,
        descuentoAplicado: descuentoMonto
      }];
    });
    
    setProductoEnSeleccion(null);
    toast.success("Agregado");
  };

  const actualizarCantidad = (tempId: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
        if (item.tempId === tempId) {
            const nuevaCant = item.cantidad + delta;
            if (nuevaCant > item.maxStock) {
                toast.warning("No hay más stock disponible");
                return item;
            }
            if (nuevaCant < 1) return item;
            return { ...item, cantidad: nuevaCant };
        }
        return item;
    }));
  };

  const eliminarItem = (tempId: string) => {
    setCarrito(prev => prev.filter(i => i.tempId !== tempId));
  };

  const toggleEmpaque = (empaqueId: string) => {
    const info = tiposEmpaque.find(e => e.id === empaqueId);
    if (!info) return;

    setEmpaquesCart(prev => {
        const existe = prev.find(e => e.id === empaqueId);
        if (existe) {
            return prev.filter(e => e.id !== empaqueId);
        } else {
            if (info.stock <= 0) { toast.error("Sin stock de este empaque"); return prev; }
            return [...prev, { id: info.id, nombre: info.nombre, cantidad: 1, stockMax: info.stock }];
        }
    });
  };

  const updateEmpaqueCant = (id: string, delta: number) => {
    setEmpaquesCart(prev => prev.map(e => {
        if (e.id === id) {
            const n = e.cantidad + delta;
            if (n > e.stockMax) { toast.warning("Stock máx. empaque alcanzado"); return e; }
            if (n < 1) return e; 
            return { ...e, cantidad: n };
        }
        return e;
    }));
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) return toast.error("El carrito está vacío");
    setLoading(true);

    try {
        const payload = {
            clienteId: clienteSeleccionado,
            vendedorId,
            metodoPago,
            items: carrito.map(i => ({
                varianteId: i.varianteId,
                cantidad: i.cantidad,
                precioUnitario: i.precioUnitario,
                precioFinal: i.precioFinal,
                descuentoAplicado: i.descuentoAplicado
            })),
            empaques: empaquesCart.map(e => ({
                tipoEmpaqueId: e.id,
                cantidad: e.cantidad
            }))
        };

        const res = await fetch("/api/admin/ventas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(error);
        }

        toast.success("¡Venta registrada con éxito! 🎉");
        
        setCarrito([]);
        setEmpaquesCart([]);
        setClienteSeleccionado(null);
        setMetodoPago("EFECTIVO");
        
    } catch (error: any) {
        toast.error("Error al procesar venta", { description: error.message });
    } finally {
        setLoading(false);
    }
  };

  // ... (El return del componente es el mismo que tenías, asegúrate de no borrarlo) ...
  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4">
      {/* ... (Tu JSX existente) ... */}
      
      {/* PANEL IZQUIERDO */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* ... Header Filtros ... */}
        <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input 
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="Buscar producto, código..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button onClick={() => setCategoriaActiva("TODAS")} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${categoriaActiva === 'TODAS' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
                {categorias.map(c => (
                    <button key={c.id} onClick={() => setCategoriaActiva(c.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${categoriaActiva === c.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.nombre}</button>
                ))}
            </div>
        </div>

        {/* ... Grid Productos ... */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {productosFiltrados.map(p => (
                    <div key={p.id} onClick={() => abrirSeleccionVariante(p)} className={`bg-white rounded-xl p-3 shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-slate-300 flex flex-col ${p.stockTotal === 0 ? 'opacity-60 grayscale' : ''}`}>
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" />
                            {p.descuentoActivo && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">Oferta</span>}
                            {p.stockTotal === 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/10 font-bold text-gray-600 text-xs">AGOTADO</div>}
                        </div>
                        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-auto leading-tight">{p.nombre}</h3>
                        <div className="mt-2">
                             {p.descuentoActivo ? (
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 line-through">S/ {p.precio.toFixed(2)}</span>
                                    <span className="text-sm font-bold text-red-600">S/ {p.precioFinal.toFixed(2)}</span>
                                </div>
                             ) : (
                                <span className="text-sm font-bold text-slate-900">S/ {p.precio.toFixed(2)}</span>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200">
         <div className="p-4 border-b border-gray-100 bg-slate-50 rounded-t-2xl">
             <div className="flex items-center gap-2 mb-3">
                 <User className="w-4 h-4 text-gray-500" />
                 <select 
                    className="flex-1 bg-white border border-gray-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-slate-900"
                    value={clienteSeleccionado || ""}
                    onChange={e => setClienteSeleccionado(e.target.value || null)}
                 >
                     <option value="">Cliente Público (General)</option>
                     {clientes.map(c => (
                         <option key={c.id} value={c.id}>{c.nombre} - {c.dni || 'S/D'}</option>
                     ))}
                 </select>
             </div>
             <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Carrito de Venta</h2>
         </div>

         {/* Lista Items + Empaques */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Productos */}
             <div className="space-y-3">
                 {carrito.map(item => (
                     <div key={item.tempId} className="flex gap-3 items-start border-b border-gray-50 pb-3 last:border-0">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">x{item.cantidad}</div>
                         <div className="flex-1">
                             <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.nombre}</p>
                             <p className="text-[10px] text-gray-500">{item.talla} • {item.color} {item.descuentoAplicado > 0 && <span className="text-red-500 ml-1">(-S/{item.descuentoAplicado.toFixed(2)})</span>}</p>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                             <span className="text-sm font-bold text-slate-900">S/ {(item.precioFinal * item.cantidad).toFixed(2)}</span>
                             <div className="flex items-center bg-gray-100 rounded-lg">
                                 <button onClick={() => actualizarCantidad(item.tempId, -1)} className="p-1 hover:bg-gray-200 rounded-l-lg"><Minus className="w-3 h-3" /></button>
                                 <button onClick={() => actualizarCantidad(item.tempId, 1)} className="p-1 hover:bg-gray-200 rounded-r-lg"><Plus className="w-3 h-3" /></button>
                             </div>
                             <button onClick={() => eliminarItem(item.tempId)} className="text-[10px] text-red-400 hover:text-red-600 mt-1 underline">Quitar</button>
                         </div>
                     </div>
                 ))}
                 {carrito.length === 0 && <div className="flex flex-col items-center justify-center text-gray-400 opacity-60 py-8"><ShoppingCart className="w-10 h-10 mb-2" /><p className="text-sm">Agrega productos</p></div>}
             </div>

             {/* Empaques */}
             {tiposEmpaque.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <h3 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Empaques (Entrega)</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tiposEmpaque.map(e => {
                            const selected = empaquesCart.some(ex => ex.id === e.id);
                            return <button key={e.id} onClick={() => toggleEmpaque(e.id)} className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${selected ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'}`}>{e.nombre}</button>
                        })}
                    </div>
                    <div className="space-y-2">
                        {empaquesCart.map(e => (
                            <div key={e.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-amber-100">
                                <span className="text-amber-900 font-medium">{e.nombre}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateEmpaqueCant(e.id, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-600 font-bold">-</button>
                                    <span className="font-bold w-4 text-center text-amber-900">{e.cantidad}</span>
                                    <button onClick={() => updateEmpaqueCant(e.id, 1)} className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-600 font-bold">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             )}
         </div>

         {/* Footer Totales */}
         <div className="p-5 bg-gray-50 border-t border-gray-200 rounded-b-2xl space-y-4">
             <div className="space-y-1 text-sm">
                 <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>S/ {totales.subtotal.toFixed(2)}</span></div>
                 {totales.descuento > 0 && <div className="flex justify-between text-red-500 font-medium"><span>Descuento</span><span>- S/ {totales.descuento.toFixed(2)}</span></div>}
                 <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-gray-200"><span>Total</span><span>S/ {totales.total.toFixed(2)}</span></div>
             </div>
             <div className="grid grid-cols-3 gap-2">
                 {['EFECTIVO', 'YAPE', 'PLIN'].map(m => (
                     <button key={m} onClick={() => setMetodoPago(m)} className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${metodoPago === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'}`}>{m}</button>
                 ))}
             </div>
             <button onClick={procesarVenta} disabled={loading || carrito.length === 0} className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} CONFIRMAR COBRO
             </button>
         </div>
      </div>

      {/* Modal Variantes */}
      {productoEnSeleccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Selecciona Variante</h3>
                    <button onClick={() => setProductoEnSeleccion(null)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex gap-3 mb-4">
                        <img src={productoEnSeleccion.imagen} className="w-16 h-16 rounded-lg bg-gray-100 object-cover" alt="" />
                        <div>
                            <p className="font-bold text-sm text-gray-900">{productoEnSeleccion.nombre}</p>
                            <p className="text-xs text-green-600 font-bold">S/ {productoEnSeleccion.precioFinal.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {productoEnSeleccion.variantes.map(v => (
                            <button key={v.id} disabled={v.stockActual <= 0} onClick={() => agregarAlCarrito(productoEnSeleccion, v)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-slate-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                <div className="text-left">
                                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-800">{v.talla.nombre}</span><span className="text-xs text-gray-500">• {v.color.nombre}</span></div>
                                    <span className="text-[10px] text-gray-400">SKU: {v.sku || '---'}</span>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-lg ${v.stockActual > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{v.stockActual > 0 ? `${v.stockActual} un.` : 'Agotado'}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}