"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { formatMoney } from "@/lib/precios"; // IMPORTANTE: Usar el formateador global

// --- TIPOS ---
type ItemReferencia = {
  varianteId: string;
  nombre: string;
  detalle: string; // Talla / Color
  cantidadOriginal: number;
  cantidadADevolver: number;
  precioUnitario: number;
  imagen?: string | null;
  hex?: string | null;
};

type ItemIntercambio = {
  id: string; // varianteId
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

/**
 * ============================================================================
 * INTERFAZ PREMIUM DE DEVOLUCIONES Y CAMBIOS
 * ============================================================================
 * Proceso guiado en 3 pasos:
 * 1. Identificación: ¿Quién devuelve y qué documento es la referencia?
 * 2. Selección: ¿Qué productos regresan y en qué cantidad?
 * 3. Resolución: ¿Cómo se compensa (Cambio, Saldo o Reembolso)?
 */
export default function DevolucionForm() {
  const router = useRouter();

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
  const [referencia, setReferencia] = useState<any>(null); // Datos de la Venta/Compra
  const [items, setItems] = useState<ItemReferencia[]>([]);
  const [motivo, setMotivo] = useState("");

  // --- LÓGICA DE BÚSQUEDA ---
  const buscarReferencia = async () => {
    if (!codigoBusqueda.trim()) return toast.error("Ingresa un código de referencia");

    setBuscando(true);
    setReferencia(null);

    try {
      // Endpoint que deberás crear para buscar la data de la venta o compra
      const res = await fetch(`/api/admin/devoluciones/buscar?tipo=${tipo}&codigo=${codigoBusqueda}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No se encontró la referencia");

      setReferencia(data);
      // Mapear items de la venta/compra al formato del formulario
      const itemsMapeados = data.items.map((it: any) => ({
        varianteId: it.varianteId,
        nombre: it.variante.producto.nombre,
        detalle: `${it.variante.talla.nombre} / ${it.variante.color.nombre}`,
        cantidadOriginal: it.cantidad,
        cantidadADevolver: 0,
        precioUnitario: Number(it.precioFinal || it.costoUnitario),
        imagen: it.variante.producto.imagenes[0]?.url || null,
        hex: it.variante.color.hex
      }));
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

  const montoTotalDevolucion = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.cantidadADevolver * it.precioUnitario), 0);
  }, [items]);

  const montoTotalNuevos = useMemo(() => {
    return itemsNuevos.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
  }, [itemsNuevos]);

  const diferencia = montoTotalNuevos - montoTotalDevolucion; // + Cliente paga, - Saldo a favor

  // --- ENVÍO FINAL ---
  const buscarProductos = async (q: string) => {
    if (!q) return;
    const res = await fetch(`/api/admin/productos`); // Ojo: Ideal filtrar por query en API, pero cargamos todo por ahora como 'pos-client'
    const data = await res.json();
    // Filtro cliente simple
    const filtrados = data.filter((p: any) => p.nombre.toLowerCase().includes(q.toLowerCase()));
    setResultadosProd(filtrados.slice(0, 5));
  };

  const agregarNuevo = (prod: any, variante: any) => {
    const existe = itemsNuevos.find(i => i.id === variante.id);
    if (existe) {
      setItemsNuevos(prev => prev.map(i => i.id === variante.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setItemsNuevos(prev => [...prev, {
        id: variante.id,
        nombre: prod.nombre,
        detalle: `${variante.talla.nombre} / ${variante.color.nombre}`,
        precio: Number(prod.precio), // Simplificacion MVP
        cantidad: 1,
        imagen: prod.imagenes[0]?.url
      }]);
    }
    setShowBuscador(false);
    setQProducto("");
  };

  const procesarDevolucion = async () => {
    const itemsFiltrados = items.filter(it => it.cantidadADevolver > 0);
    if (itemsFiltrados.length === 0) return toast.error("Selecciona al menos un producto para devolver");
    if (!motivo.trim()) return toast.error("Ingresa el motivo de la devolución");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          accion,
          referenciaId: referencia.id,
          clienteId: referencia.clienteId, // Solo si es cliente
          items: itemsFiltrados.map(it => ({ varianteId: it.varianteId, cantidad: it.cantidadADevolver })),
          motivo,
          montoTotal: montoTotalDevolucion,
          // Nuevos campos
          itemsNuevos: accion === "CAMBIO" ? itemsNuevos.map(i => ({ varianteId: i.id, cantidad: i.cantidad })) : [],
          metodoPagoDiferencia: "EFECTIVO" // Default por ahora
        })
      })


      if (!res.ok) throw new Error("Error en el servidor");

      toast.success("Proceso completado exitosamente");
      router.push("/admin/devoluciones");
      router.refresh();
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">

      {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y BUSQUEDA */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Undo2 className="w-5 h-5 text-indigo-600" /> 1. Identificación
          </h2>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Origen del Retorno</label>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => { setTipo("CLIENTE"); setReferencia(null); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${tipo === 'CLIENTE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-4 h-4" /> De Cliente
              </button>
              <button
                type="button"
                onClick={() => { setTipo("PROVEEDOR"); setReferencia(null); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${tipo === 'PROVEEDOR' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Truck className="w-4 h-4" /> A Proveedor
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">
              {tipo === 'CLIENTE' ? 'Código de Venta (WhatsApp)' : 'Código de Compra / RUC'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  placeholder="Ej: V-1025..."
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
      <div className="lg:col-span-2 space-y-6">

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
                    <th className="px-6 py-4 text-center">En Venta</th>
                    <th className="px-6 py-4 text-center">Devolver</th>
                    <th className="px-6 py-4 text-right">Valor Unit.</th>
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
                            <p className="font-bold text-gray-900">{it.nombre}</p>
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
                      <td className="px-6 py-4 text-right font-bold text-slate-700">S/ {it.precioUnitario.toFixed(2)}</td>
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
              <span className="flex items-center gap-2"><Package className="w-5 h-5 text-indigo-600" /> Productos de Reemplazo</span>
              <button onClick={() => setShowBuscador(!showBuscador)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-bold transition-colors">
                + Agregar Producto
              </button>
            </h2>

            {/* Buscador Simple */}
            {showBuscador && (
              <div className="bg-white p-4 rounded-xl shadow-lg border border-indigo-100 mb-4 animate-in zoom-in-95">
                <input
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm mb-2"
                  placeholder="Buscar producto por nombre..."
                  value={qProducto}
                  onChange={e => { setQProducto(e.target.value); buscarProductos(e.target.value); }}
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {resultadosProd.map(prod => (
                    <div key={prod.id} className="text-sm">
                      <p className="font-bold text-gray-800">{prod.nombre}</p>
                      <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                        {prod.variantes.map((v: any) => (
                          <button key={v.id} onClick={() => agregarNuevo(prod, v)} className="text-[10px] bg-gray-100 hover:bg-indigo-100 px-2 py-1 rounded border border-gray-200">
                            {v.talla.nombre} - {v.color.nombre}
                          </button>
                        ))}
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
                  <div key={it.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {it.imagen && <img src={it.imagen} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-bold text-indigo-900 text-sm">{it.nombre}</p>
                        <p className="text-[10px] text-indigo-500 font-bold">{it.detalle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm">S/ {it.precio.toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                        <button onClick={() => setItemsNuevos(p => p.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad - 1 } : x).filter(x => x.cantidad > 0))}>-</button>
                        <span>x{it.cantidad}</span>
                        <button onClick={() => setItemsNuevos(p => p.map(x => x.id === it.id ? { ...x, cantidad: x.cantidad + 1 } : x))}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-indigo-100">
                  <span className="text-sm font-bold text-indigo-900">Total Nuevos</span>
                  <span className="font-black text-indigo-600">S/ {montoTotalNuevos.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-indigo-300 italic py-4">No has seleccionado productos de reemplazo</p>
            )}
          </div>
        )}
      </div>

      {/* 3. RESOLUCIÓN FINAL */}
      {referencia && (
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
            <Wallet className="w-5 h-5 text-indigo-600" /> 3. Resolución Financiera
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "CAMBIO", label: "Cambio Directo", icon: RotateCcw, color: "blue", desc: "Talla o color diferente" },
              { id: "SALDO_A_FAVOR", label: "Saldo a Favor", icon: Wallet, color: "indigo", desc: "Crédito para WhatsApp" },
              { id: "REEMBOLSO", label: "Reembolso", icon: AlertTriangle, color: "red", desc: "Devolución de dinero" },
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
              placeholder="Ej: El cliente indica que la prenda le queda muy ajustada en hombros..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance Final</p>
              {accion === "CAMBIO" ? (
                <div className="flex flex-col">
                  {diferencia > 0 ? (
                    <>
                      <span className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpCircle className="w-3 h-3" /> Cliente Paga Diferencia</span>
                      <p className="text-3xl font-black text-white">S/ {diferencia.toFixed(2)}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-orange-400 flex items-center gap-1"><ArrowDownCircle className="w-3 h-3" /> A favor del Cliente</span>
                      <p className="text-3xl font-black text-white">S/ {Math.abs(diferencia).toFixed(2)}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-3xl font-black text-white">S/ {montoTotalDevolucion.toFixed(2)}</p>
              )}
            </div>
            <button
              onClick={procesarDevolucion}
              disabled={loading || montoTotalDevolucion === 0}
              className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-400 px-10 py-4 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
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

// Subcomponentes simples para el control de cantidad
function Minus(props: any) { return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path></svg>; }
function Plus(props: any) { return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6"></path></svg>; }