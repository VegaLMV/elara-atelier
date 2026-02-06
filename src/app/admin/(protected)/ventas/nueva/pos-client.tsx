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

// --- TIPOS ---
type ProductoPOS = {
  id: string;
  nombre: string;
  precioBase: number;
  categoriaId: string | null;
  imagen: string | null;
  descuento: { tipo: "PORCENTAJE" | "MONTO" | null; valor: number } | null;
  variantes: { id: string; talla: string; color: string; hex: string | null; stock: number }[];
};

type ItemCarrito = {
  uid: string; // ID único para el carrito (por si agrega el mismo prod 2 veces separado)
  tipo: "PRODUCTO" | "EMPAQUE";
  idRef: string; // ID de Variante o Empaque
  titulo: string;
  detalle: string;
  precioUnitario: number;
  precioFinal: number; // Con descuento aplicado
  cantidad: number;
  stockMax: number;
  imagen?: string | null;
  descuentoAplicado?: number; // Monto descontado unitario
  descuentoRazon?: string;
};

type ClientePOS = { id: string; nombre: string; dni: string | null };
type EmpaquePOS = { id: string; nombre: string; stock: number; costo: number; imagenUrl: string | null };

// --- HELPERS ---
const formatMoney = (amount: number) => 
  new Intl.NumberFormat('es-PE', { 
    style: 'currency', 
    currency: 'PEN',
    currencyDisplay: 'symbol'
  }).format(amount);
  
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
  
  // --- ESTADOS ---
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteSel, setClienteSel] = useState<string>(""); // ID cliente
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "YAPE" | "PLIN" | "TRANSFERENCIA">("EFECTIVO");
  
  // UI Estados
  const [busqueda, setBusqueda] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoPOS | null>(null); // Para modal variantes
  const [loading, setLoading] = useState(false);
  const [modoEmpaque, setModoEmpaque] = useState(false); // Toggle ver empaques en grid

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
          // Buscar si ya existe exactamente el mismo ítem (misma variante/empaque)
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
      setProductoSeleccionado(null); // Cerrar modal si estaba abierto
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
  const totalPagar = subtotal - descuentoTotal; // Ojo: item.precioFinal ya podría tener descuento, hay que cuadrar lógica.
  // Ajuste: precioFinal es el precio que paga el cliente. precioUnitario es el base.
  // Total real = sum(precioFinal * cantidad).
  const totalReal = carrito.reduce((acc, i) => acc + (i.precioFinal * i.cantidad), 0);
  // El descuento visual es la diferencia
  const ahorroTotal = subtotal - totalReal;

  // --- PROCESAR VENTA ---
  const procesarVenta = async () => {
      if (carrito.length === 0) return toast.error("Carrito vacío");
      setLoading(true);

      // Separar Productos de Empaques para la API
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
          router.push(`/admin/ventas/${data.id}`); // Ir al detalle/ticket
      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex h-full overflow-hidden">
        
        {/* === COLUMNA IZQ: CATÁLOGO === */}
        <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
            
            {/* Header Buscador */}
            <div className="p-4 bg-white border-b border-gray-200 space-y-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ventas" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            placeholder="Buscar producto..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                
                {/* Filtros rápidos */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button 
                        onClick={() => { setModoEmpaque(false); setCatFiltro(""); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${!modoEmpaque && !catFiltro ? 'bg-slate-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                        Todo Ropa
                    </button>
                    <button 
                        onClick={() => setModoEmpaque(true)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-colors ${modoEmpaque ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Package className="w-3 h-3" /> Empaques
                    </button>
                    {!modoEmpaque && categorias.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => setCatFiltro(c.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${catFiltro === c.id ? 'bg-slate-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {c.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Productos */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                                className="bg-white p-4 rounded-2xl border border-gray-200 cursor-pointer hover:border-orange-400 hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group"
                            >
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                    <Package className="w-8 h-8" />
                                </div>
                                <p className="font-bold text-gray-800 text-sm">{emp.nombre}</p>
                                <p className="text-xs text-gray-500">Stock: {emp.stock}</p>
                            </div>
                        ))
                    ) : (
                        // Modo PRODUCTOS
                        (itemsGrid as ProductoPOS[]).map(prod => (
                            <div 
                                key={prod.id}
                                onClick={() => setProductoSeleccionado(prod)}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                            >
                                <div className="aspect-square bg-gray-100 relative">
                                    {prod.imagen ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={prod.imagen} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">SIN FOTO</div>
                                    )}
                                    {prod.descuento && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            {prod.descuento.tipo === 'PORCENTAJE' ? `-${prod.descuento.valor}%` : `-S/${prod.descuento.valor}`}
                                        </span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{prod.nombre}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-600 font-bold">{formatMoney(prod.precioBase)}</p>
                                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                            {prod.variantes.reduce((acc, v) => acc + v.stock, 0)} unid.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* === COLUMNA DER: CARRITO Y PAGO === */}
        <div className="w-[400px] bg-white flex flex-col h-full shadow-2xl z-10">
            
            {/* Header Carrito */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
                    <ShoppingCart className="w-5 h-5" /> Nueva Venta
                </h2>
                
                {/* Selector Cliente */}
                <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select 
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-slate-900 appearance-none cursor-pointer"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {carrito.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <ShoppingCart className="w-16 h-16 mb-2" />
                        <p className="text-sm">Carrito vacío</p>
                    </div>
                ) : (
                    carrito.map((item) => (
                        <div key={item.uid} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group relative">
                            {/* Imagen Mini */}
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                {item.imagen ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.imagen} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">IMG</div>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{item.titulo}</p>
                                <p className="text-xs text-gray-500 mb-1">{item.detalle}</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm">{formatMoney(item.precioFinal)}</span>
                                    {item.descuentoAplicado ? (
                                        <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded line-through">
                                            {formatMoney(item.precioUnitario)}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* Controles Cantidad */}
                            <div className="flex flex-col items-end gap-2">
                                <button onClick={() => quitarDelCarrito(item.uid)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                    <button onClick={() => cambiarCantidad(item.uid, -1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white rounded shadow-sm transition-all"><Minus className="w-3 h-3"/></button>
                                    <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                                    <button onClick={() => cambiarCantidad(item.uid, 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-white rounded shadow-sm transition-all"><Plus className="w-3 h-3"/></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Totales y Pago */}
            <div className="bg-white border-t border-gray-200 p-5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                
                {/* Resumen */}
                <div className="space-y-2 mb-4 text-sm">
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
                    <div className="flex justify-between text-xl font-black text-slate-900 border-t pt-2 mt-2">
                        <span>Total</span>
                        <span>{formatMoney(totalReal)}</span>
                    </div>
                </div>

                {/* Métodos Pago */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {["EFECTIVO", "YAPE", "PLIN", "TRANSFERENCIA"].map((m) => (
                        <button 
                            key={m}
                            onClick={() => setMetodoPago(m as any)}
                            className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${metodoPago === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={procesarVenta}
                    disabled={loading || carrito.length === 0}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                    Cobrar {formatMoney(totalReal)}
                </button>
            </div>
        </div>

        {/* === MODAL SELECCIÓN VARIANTE === */}
        {productoSeleccionado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="relative h-48 bg-gray-100">
                        {productoSeleccionado.imagen && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={productoSeleccionado.imagen} className="w-full h-full object-cover" alt="" />
                        )}
                        <button 
                            onClick={() => setProductoSeleccionado(null)}
                            className="absolute top-3 right-3 bg-white/80 p-2 rounded-full hover:bg-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <h3 className="text-white font-bold text-xl">{productoSeleccionado.nombre}</h3>
                            <p className="text-white/80 text-sm">Selecciona una variante</p>
                        </div>
                    </div>
                    
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                        <div className="space-y-2">
                            {productoSeleccionado.variantes.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">Sin stock disponible</p>
                            ) : (
                                productoSeleccionado.variantes.map(v => {
                                    // Calcular precio final unitario
                                    let final = productoSeleccionado.precioBase;
                                    let descuento = 0;
                                    if (productoSeleccionado.descuento) {
                                        const { tipo, valor } = productoSeleccionado.descuento;
                                        if (tipo === "PORCENTAJE") {
                                            descuento = final * (valor / 100);
                                            final -= descuento;
                                        } else {
                                            descuento = valor;
                                            final -= valor;
                                        }
                                        if (final < 0) final = 0;
                                    }

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
                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-slate-900 hover:bg-slate-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border shadow-sm" style={{backgroundColor: v.hex || '#eee'}}></div>
                                                <div className="text-left">
                                                    <p className="font-bold text-gray-800 text-sm group-hover:text-slate-900">{v.color} / {v.talla}</p>
                                                    <p className="text-xs text-gray-500">Stock: {v.stock}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">{formatMoney(final)}</p>
                                                {descuento > 0 && <p className="text-[10px] text-red-500 line-through">{formatMoney(productoSeleccionado.precioBase)}</p>}
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