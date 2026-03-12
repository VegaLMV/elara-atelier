"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatMoney, calcularPrecioProducto } from "@/lib/precios";
import {
  Search,
  RotateCcw,
  Users,
  Truck,
  Package,
  Wallet,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Undo2,
  X,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";

// --- TIPOS ---
type ItemReferencia = {
  varianteId: string;
  nombre: string;
  detalle: string;
  cantidadOriginal: number;
  cantidadADevolver: number;
  precioUnitario: number;
  imagen?: string | null;
  hex?: string | null;
};

type ItemIntercambio = {
  id: string;
  nombre: string;
  detalle: string;
  precio: number;
  cantidad: number;
  imagen?: string;
};

function getColorStyle(hex: string | null) {
  if (!hex) return { backgroundColor: '#fff' };
  const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
  if (codes.length <= 1) return { backgroundColor: codes[0] || '#fff' };

  const percentage = 100 / codes.length;
  const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
  return { background: `linear-gradient(135deg, ${stops})` };
}

export default function DevolucionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- ESTADOS DE CONFIGURACIÓN ---
  const [tipo, setTipo] = useState<"CLIENTE" | "PROVEEDOR">("CLIENTE");
  const [accion, setAccion] = useState<"CAMBIO" | "SALDO_A_FAVOR" | "REEMBOLSO">("CAMBIO");
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // --- BUSCADOR PRODUCTOS (INTERCAMBIO) ---
  const [showBuscador, setShowBuscador] = useState(false);
  const [qProducto, setQProducto] = useState("");
  const [resultadosProd, setResultadosProd] = useState<any[]>([]);
  const [itemsNuevos, setItemsNuevos] = useState<ItemIntercambio[]>([]);

  // --- ESTADOS DE DATOS ---
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [referencia, setReferencia] = useState<any>(null);
  const [items, setItems] = useState<ItemReferencia[]>([]);
  const [motivo, setMotivo] = useState("");

  // --- AUTO-CARGA DESDE URL ---
  useEffect(() => {
    const refId = searchParams.get("refId");
    const tipoUrl = searchParams.get("tipo") as "CLIENTE" | "PROVEEDOR";

    if (refId) {
      setCodigoBusqueda(refId);
      if (tipoUrl) setTipo(tipoUrl);

      const autoBuscar = async () => {
        setBuscando(true);
        try {
          const res = await fetch(`/api/admin/devoluciones/buscar?tipo=${tipoUrl || "CLIENTE"}&codigo=${refId}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "No se encontró la referencia");

          setReferencia(data);
          const itemsMapeados = data.items?.map((it: any) => {
           const precioReal = tipoUrl === "PROVEEDOR" ? it.costoUnitario : (it.precioFinal || it.costoUnitario);
            const precioLimpio = Math.round(Number(precioReal) * 100) / 100;

            return {
              varianteId: it.varianteId,
              nombre: it.variante.producto.nombre,
              detalle: `${it.variante.talla.nombre} / ${it.variante.color.nombre}`,
              cantidadOriginal: it.cantidad,
              cantidadADevolver: 0,
              precioUnitario: precioLimpio, 
              imagen: it.variante.producto.imagenes[0]?.url || null,
              hex: it.variante.color.hex
            };
          }) || [];
          setItems(itemsMapeados);
          toast.success(`Referencia de ${tipoUrl || "CLIENTE"} cargada automáticamente`);
        } catch (error: any) {
          toast.error(error.message);
        } finally {
          setBuscando(false);
        }
      };
      autoBuscar();
    }
  }, [searchParams]);

  // --- LÓGICA DE BÚSQUEDA ---
  const buscarReferencia = async () => {
    if (!codigoBusqueda.trim()) return toast.error("Ingresa un código de referencia");

    setBuscando(true);
    setReferencia(null);

    try {
      const res = await fetch(`/api/admin/devoluciones/buscar?tipo=${tipo}&codigo=${codigoBusqueda}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se encontró la referencia");

      setReferencia(data);
      const itemsMapeados = data.items?.map((it: any) => {
        const precioReal = tipo === "PROVEEDOR" ? it.costoUnitario : (it.precioFinal || it.costoUnitario);
        const precioLimpio = Math.round(Number(precioReal) * 100) / 100;

        return {
          varianteId: it.varianteId,
          nombre: it.variante.producto.nombre,
          detalle: `${it.variante.talla.nombre} / ${it.variante.color.nombre}`,
          cantidadOriginal: it.cantidad,
          cantidadADevolver: 0,
          precioUnitario: precioLimpio,
          imagen: it.variante.producto.imagenes[0]?.url || null,
          hex: it.variante.color.hex
        };
      }) || [];
      setItems(itemsMapeados);
      toast.success("Referencia encontrada");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBuscando(false);
    }
  };

  // --- LÓGICA DE SELECCIÓN ---
  const actualizarCantidad = (id: string, cant: number) => {
    setItems(prev => prev.map(it =>
      it.varianteId === id
        ? { ...it, cantidadADevolver: Math.min(Math.max(0, cant), it.cantidadOriginal) }
        : it
    ));
  };

  const actualizarPrecioNuevo = (id: string, nuevoPrecio: number) => {
    setItemsNuevos(prev => prev.map(it =>
      it.id === id ? { ...it, precio: Math.max(0, nuevoPrecio) } : it
    ));
  };

  const montoTotalDevolucion = useMemo(() => {
    const sum = items.reduce((acc, it) => acc + (it.cantidadADevolver * it.precioUnitario), 0);
    return Math.round(sum * 100) / 100;
  }, [items]);

  const montoTotalNuevos = useMemo(() => {
    const sum = itemsNuevos.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
    return Math.round(sum * 100) / 100;
  }, [itemsNuevos]);

  const diferencia = Math.round((montoTotalNuevos - montoTotalDevolucion) * 100) / 100;
  
  // --- ENVÍO FINAL ---
  const buscarProductos = async (q: string) => {
    if (!q.trim()) {
        setResultadosProd([]);
        return;
    }
    try {
        const res = await fetch(`/api/admin/productos/buscar?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Error de red");
        
        const data = await res.json();
        
        const filtrados = data
            .filter((p: any) => p.variantes && p.variantes.length > 0)
            .map((p: any) => {
                
                const calculoOficial = calcularPrecioProducto({
                    precio: Number(p.precio),
                    descuentoActivo: p.descuentoActivo,
                    descuentoTipo: p.descuentoTipo,
                    descuentoValor: p.descuentoValor ? Number(p.descuentoValor) : null,
                    descuentoInicio: p.descuentoInicio,
                    descuentoFin: p.descuentoFin
                });
                
                return {
                    ...p,
                    precioFinal: calculoOficial.precioFinal, 
                    precioOriginal: Number(p.precio)
                };
            });
        
        setResultadosProd(filtrados);
    } catch (error) {
        console.error("Error buscando productos:", error);
    }
  };

  const agregarNuevo = (prod: any, variante: any) => {
    const existe = itemsNuevos.find(i => i.id === variante.id);
    if (existe) {
      setItemsNuevos(prev => prev.map(i => i.id === variante.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      
      // LÓGICA INTELIGENTE DE COSTOS PARA PROVEEDORES Y CLIENTES
      let precioSugerido = 0;
      
      if (tipo === "PROVEEDOR") {
        const itemOriginal = items.find(it => it.varianteId === variante.id);
        if (itemOriginal) {
           precioSugerido = itemOriginal.precioUnitario;
        } else {
           precioSugerido = 0;
        }
      } else {
        precioSugerido = prod.precioFinal !== undefined ? prod.precioFinal : Number(prod.precio);
      }

      setItemsNuevos(prev => [...prev, {
        id: variante.id,
        nombre: prod.nombre,
        detalle: `${variante.talla.nombre} / ${variante.color.nombre}`,
        precio: precioSugerido,
        cantidad: 1,
        imagen: prod.imagenes?.[0]?.url
      }]);
    }
    setShowBuscador(false);
    setQProducto("");
  };

  const procesarDevolucion = async () => {
    const itemsFiltrados = items.filter(it => it.cantidadADevolver > 0);
    
    if (itemsFiltrados.length === 0) {
        toast.error("Selecciona al menos un producto para devolver");
        return;
    }
    
    if (!motivo.trim()) {
        toast.error("Ingresa el motivo de la devolución");
        return;
    }

    setLoading(true);
    try {
      const payload = {
          tipo,
          accion,
          referenciaId: referencia.id,
          clienteId: referencia.clienteId || null,
          items: itemsFiltrados.map(it => ({ 
              varianteId: it.varianteId, 
              cantidad: Number(it.cantidadADevolver) 
          })),
          motivo: motivo.trim(),
          montoTotal: Number(montoTotalDevolucion),
          itemsNuevos: accion === "CAMBIO" ? itemsNuevos.map(i => ({ 
              varianteId: i.id, 
              cantidad: Number(i.cantidad),
              precioAlternativo: Number(i.precio) 
          })) : [],
          metodoPagoDiferencia: "EFECTIVO"
      };

      const res = await fetch("/api/admin/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error en el servidor");
      }

      toast.success("Proceso completado exitosamente");
      router.push("/admin/devoluciones");
      router.refresh();
    } catch (error: any) {
      console.error("Error capturado:", error);
      toast.error(error.message || "Ocurrió un error inesperado. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-5 pb-20">

      {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y BUSQUEDA */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Undo2 className="w-5 h-5 text-indigo-600" /> 1. Identificación
          </h2>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Origen del Retorno</label>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => { setTipo("CLIENTE"); setReferencia(null); setItemsNuevos([]); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${tipo === 'CLIENTE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-4 h-4" /> De Cliente
              </button>
              <button
                type="button"
                onClick={() => { setTipo("PROVEEDOR"); setReferencia(null); setItemsNuevos([]); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${tipo === 'PROVEEDOR' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Truck className="w-4 h-4" /> A Proveedor
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">
              {tipo === 'CLIENTE' ? 'Código / Nombre (Venta o Pedido)' : 'Nombre de Proveedor o ID'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="Buscar..."
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                />
              </div>
              <button
                onClick={buscarReferencia}
                disabled={buscando}
                className="bg-slate-900 text-white px-4 rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {buscando ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {referencia && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in zoom-in-95">
              <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Documento Encontrado</p>
              <p className="text-sm font-bold text-indigo-900">
                {tipo === 'CLIENTE' ? `Cliente: ${referencia.cliente?.nombre || 'General'}` : `Proveedor: ${referencia.proveedor?.nombre}`}
              </p>
              <p className="text-xs text-indigo-600 mt-1">Fecha original: {new Date(referencia.fechaVenta || referencia.fechaCompra).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: SELECCIÓN Y RESOLUCIÓN */}
      <div className="lg:col-span-2 space-y-5">

        {/* 2. TABLA DE SELECCIÓN DE PRODUCTOS */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" /> 2. Productos a Devolver
            </h2>
          </div>

          {!referencia ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-gray-400 opacity-50">
              <Search className="w-12 h-12 mb-4" />
              <p className="text-sm font-medium">Busca una referencia para ver los productos</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4 text-center">Comprados</th>
                    <th className="px-6 py-4 text-center">Devolver</th>
                    <th className="px-6 py-4 text-right">
                        {tipo === 'CLIENTE' ? 'Precio Final' : 'Tu Costo'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((it) => (
                    <tr key={it.varianteId} className={`transition-colors ${it.cantidadADevolver > 0 ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            {it.imagen ? <img src={it.imagen} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px]">IMG</div>}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1 max-w-[200px]">{it.nombre}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 font-bold">{it.detalle}</span>
                              {it.hex && <div className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-sm" style={getColorStyle(it.hex)} />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-gray-400">x{it.cantidadOriginal}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl p-1 w-28 mx-auto shadow-sm">
                          <button
                            type="button"
                            onClick={() => actualizarCantidad(it.varianteId, it.cantidadADevolver - 1)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-sm w-4 text-center">{it.cantidadADevolver}</span>
                          <button
                            type="button"
                            onClick={() => actualizarCantidad(it.varianteId, it.cantidadADevolver + 1)}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{formatMoney(it.precioUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2.5 INTERCAMBIO (Solo si es Cambio) */}
        {accion === "CAMBIO" && referencia && (
          <div className="bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-sm p-6 space-y-4 animate-in fade-in">
            <h2 className="text-lg font-black text-indigo-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" /> 
                  {tipo === 'CLIENTE' ? 'Productos de Reemplazo' : 'Mercadería que Recibes'}
              </span>
              {!showBuscador && (
                <button onClick={() => setShowBuscador(true)} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-md active:scale-95">
                  + Agregar Producto
                </button>
              )}
            </h2>

            {/* Buscador Premium Rediseñado */}
            {showBuscador && (
              <div className="relative bg-white p-5 rounded-2xl shadow-xl border border-indigo-100 mb-4 animate-in zoom-in-95 z-10">
                <button
                  type="button"
                  onClick={() => setShowBuscador(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-sm font-bold text-gray-800 mb-3">Buscar nuevo producto</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ej: Blusa Siena..."
                    value={qProducto}
                    onChange={e => { setQProducto(e.target.value); buscarProductos(e.target.value); }}
                    autoFocus
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                  {resultadosProd.length === 0 && qProducto.trim().length > 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No se encontraron productos.</p>
                  )}
                  {resultadosProd.map(prod => (
                    <div key={prod.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="w-16 h-16 rounded-lg bg-gray-200 border border-gray-200 overflow-hidden shrink-0">
                        {prod.imagenes?.[0]?.url ? (
                          <img src={prod.imagenes[0].url} className="w-full h-full object-cover" alt={prod.nombre} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">IMG</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-gray-900 text-sm leading-tight max-w-[200px]">{prod.nombre}</p>
                            <div className="text-right ml-2">
                              <p className="font-black text-indigo-600 text-sm whitespace-nowrap">
                                {tipo === 'CLIENTE' ? formatMoney(prod.precioFinal) : 'Costo Asignable'}
                                </p>
                                {tipo === 'CLIENTE' && prod.descuentoActivo && (
                                <p className="text-[10px] text-red-400 line-through">
                                  {formatMoney(prod.precioOriginal)}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {prod.variantes?.map((v: any) => {
                            const sinStock = tipo === 'CLIENTE' ? (v.stockActual <= 0) : false;
                            return (
                              <button
                                type="button"
                                key={v.id}
                                disabled={sinStock}
                                onClick={() => agregarNuevo(prod, v)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                                  sinStock
                                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 active:scale-95"
                                }`}
                              >
                                <span>{v.talla.nombre} - {v.color.nombre}</span>
                                {tipo === 'CLIENTE' && (
                                    <span className={`text-[10px] ${sinStock ? "text-red-400" : "text-emerald-500"}`}>
                                    ({v.stockActual || 0})
                                    </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista Nuevos */}
            {itemsNuevos.length > 0 ? (
              <div className="space-y-2">
                {itemsNuevos.map(it => (
                  <div key={it.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-indigo-100 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {it.imagen && <img src={it.imagen} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-bold text-indigo-900 text-sm line-clamp-1">{it.nombre}</p>
                        <p className="text-[10px] text-indigo-500 font-bold">{it.detalle}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        {/* Editor de Precio Manual (Fundamental para Proveedores) */}
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">S/</span>
                            <input 
                                type="number"
                                value={it.precio}
                                onChange={(e) => actualizarPrecioNuevo(it.id, Number(e.target.value))}
                                className={`w-20 text-sm font-mono font-black border-b-2 outline-none p-1 text-right transition-colors ${tipo === 'PROVEEDOR' ? 'border-orange-300 focus:border-orange-500 text-orange-700 bg-orange-50 rounded' : 'border-transparent focus:border-indigo-300 bg-transparent'}`}
                                title={tipo === 'PROVEEDOR' ? "Editar costo del material a recibir" : "Precio del producto"}
                                disabled={tipo === 'CLIENTE'}
                            />
                        </div>
                        
                      <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                        <button type="button" className="hover:bg-gray-100 w-6 h-6 rounded flex items-center justify-center border border-gray-200" onClick={() => setItemsNuevos(p => p.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad - 1 } : x).filter(x => x.cantidad > 0))}>-</button>
                        <span className="font-bold w-4 text-center">x{it.cantidad}</span>
                        <button type="button" className="hover:bg-gray-100 w-6 h-6 rounded flex items-center justify-center border border-gray-200" onClick={() => setItemsNuevos(p => p.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad + 1 } : x))}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-indigo-100">
                  <span className="text-sm font-bold text-indigo-900">Total a Favor de la Tienda</span>
                  <span className="font-black text-indigo-600">{formatMoney(montoTotalNuevos)}</span>
                </div>
              </div>
            ) : (
              !showBuscador && <p className="text-center text-sm text-indigo-300 italic py-4">No has seleccionado productos de reemplazo</p>
            )}
          </div>
        )}
      </div>

      {/* 3. RESOLUCIÓN FINAL */}
      {referencia && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
            <Wallet className="w-5 h-5 text-indigo-600" /> 3. Resolución Financiera
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "CAMBIO", label: "Cambio Directo", icon: RotateCcw, color: "blue", desc: tipo === 'CLIENTE' ? "Talla o producto diferente" : "Cambio por otra mercadería" },
              { id: "SALDO_A_FAVOR", label: "Saldo a Favor", icon: Wallet, color: "indigo", desc: tipo === 'CLIENTE' ? "Crédito al cliente" : "Crédito a tu favor" },
              { id: "REEMBOLSO", label: "Reembolso", icon: AlertTriangle, color: "red", desc: "Retorno de dinero físico" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccion(opt.id as any)}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${accion === opt.id ? `border-${opt.color}-500 bg-${opt.color}-50/50 ring-4 ring-${opt.color}-500/10` : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
              >
                <opt.icon className={`w-6 h-6 mb-3 ${accion === opt.id ? `text-${opt.color}-600` : 'text-gray-400'}`} />
                <div className="font-black text-sm text-gray-900">{opt.label}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1 leading-tight">{opt.desc}</div>
                {accion === opt.id && <CheckCircle2 className={`absolute top-3 right-3 w-5 h-5 text-${opt.color}-600`} />}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Motivo Detallado (Para Auditoría)</label>
            <textarea
              className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all placeholder:text-gray-300"
              placeholder={tipo === 'CLIENTE' ? "Ej: El cliente indica prenda muy ajustada..." : "Ej: Devolvemos 2 polos rasgados de fábrica por 2 de buen estado."}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance de Operación</p>
              {accion === "CAMBIO" ? (
                <div className="flex flex-col mt-1">
                  {diferencia > 0 ? (
                    <>
                      <span className={`text-xs flex items-center gap-1 ${tipo === 'CLIENTE' ? 'text-emerald-400' : 'text-orange-400'}`}>
                          <ArrowUpCircle className="w-3 h-3" /> 
                          {tipo === 'CLIENTE' ? 'Cliente Paga Diferencia' : 'Nosotros Pagamos Diferencia (Proveedor)'}
                      </span>
                      <p className="text-3xl font-black text-white">{formatMoney(diferencia)}</p>
                    </>
                  ) : diferencia < 0 ? (
                    <>
                      <span className={`text-xs flex items-center gap-1 ${tipo === 'CLIENTE' ? 'text-orange-400' : 'text-emerald-400'}`}>
                          <ArrowDownCircle className="w-3 h-3" /> 
                          {tipo === 'CLIENTE' ? 'A favor del Cliente' : 'A favor nuestro (Proveedor)'}
                      </span>
                      <p className="text-3xl font-black text-white">{formatMoney(Math.abs(diferencia))}</p>
                    </>
                  ) : (
                    <>
                      <span className={`text-xs flex items-center gap-1 text-gray-400`}>
                          <CheckCircle2 className="w-3 h-3" /> 
                          Intercambio Exacto
                      </span>
                      <p className="text-3xl font-black text-white">{formatMoney(0)}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-3xl font-black text-white mt-1">{formatMoney(montoTotalDevolucion)}</p>
              )}
            </div>
            <button
              onClick={procesarDevolucion}
              disabled={loading || montoTotalDevolucion === 0}
              className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-400 px-8 py-4 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Finalizar Proceso"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Minus(props: any) { return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path></svg>; }
function Plus(props: any) { return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6"></path></svg>; }