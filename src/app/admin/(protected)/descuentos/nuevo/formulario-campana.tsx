"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

// Definición de tipos más completa
type ProductoInput = {
  id: string;
  nombre: string;
  categoriaId: string | null;
  imagen: string | null;
  precio: number;
  stockTotal: number;
  estado: string;
};

type Props = {
  categorias: { id: string; nombre: string }[];
  productos: ProductoInput[];
};

export default function FormularioCampana({ categorias, productos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DEL FORMULARIO ---
  const [nombreCampana, setNombreCampana] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<"PORCENTAJE" | "MONTO">("PORCENTAJE");
  const [valor, setValor] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // --- LÓGICA DE SELECCIÓN ---
  const [modoAlcance, setModoAlcance] = useState<"TODOS" | "CATEGORIA" | "SELECCION">("SELECCION");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);
  
  // --- FILTROS VISUALES ---
  const [busquedaProd, setBusquedaProd] = useState("");
  const [ocultarSinStock, setOcultarSinStock] = useState(true); // Recomendación por defecto

  // --- MODAL DE PREVISUALIZACIÓN ---
  const [productoEnModal, setProductoEnModal] = useState<ProductoInput | null>(null);

  // 1. Efecto: Cuando se selecciona una categoría, pre-llenamos la selección manual
  // Esto permite "Quitar algunos relacionados a esa categoría"
  useEffect(() => {
    if (modoAlcance === "CATEGORIA" && categoriaSeleccionada) {
      const idsDeCategoria = productos
        .filter(p => p.categoriaId === categoriaSeleccionada)
        // Opcional: Si quieres que al elegir categoría NO se seleccionen los de stock 0, descomenta:
        // .filter(p => !ocultarSinStock || p.stockTotal > 0) 
        .map(p => p.id);
      
      setProductosSeleccionados(idsDeCategoria);
    }
  }, [modoAlcance, categoriaSeleccionada, productos]); 
  // Nota: No incluimos ocultarSinStock en dependencias para evitar reselecciones accidentales al cambiar filtros visuales

  // 2. Filtrado VISUAL de productos (Grid)
  const productosVisibles = useMemo(() => {
    let lista = productos;

    // Filtro 1: Si estamos en modo Categoría, solo mostramos esa categoría visualmente
    if (modoAlcance === "CATEGORIA" && categoriaSeleccionada) {
       lista = lista.filter(p => p.categoriaId === categoriaSeleccionada);
    }

    // Filtro 2: Búsqueda por texto
    if (busquedaProd) {
       const q = busquedaProd.toLowerCase();
       lista = lista.filter(p => p.nombre.toLowerCase().includes(q));
    }

    // Filtro 3: Ocultar sin stock (Mejora solicitada)
    if (ocultarSinStock) {
        lista = lista.filter(p => p.stockTotal > 0);
    }
    
    return lista;
  }, [productos, categoriaSeleccionada, modoAlcance, busquedaProd, ocultarSinStock]);


  // 3. Manejador de selección individual (Toggle)
  const toggleSeleccion = (id: string) => {
    // Si estamos en modo Categoría y el usuario desmarca uno, conceptualmente pasamos a "SELECCION"
    // para que el backend reciba la lista exacta de IDs y no "Toda la categoría".
    // Visualmente mantenemos el filtro de categoría para no confundir.
    
    setProductosSeleccionados(prev => {
      if (prev.includes(id)) {
        return prev.filter(pId => pId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!valor || !startsAt || !endsAt) {
        alert("Completa los campos obligatorios de la oferta (Valor y Fechas).");
        return;
    }
    
    // Determinar qué enviamos al backend
    let aplicarA_Final = modoAlcance;
    let ids_Final = productosSeleccionados;

    // Lógica especial: Si el usuario eligió CATEGORIA pero luego modificó la selección manualmente,
    // enviamos como SELECCION MANUAL para respetar las exclusiones.
    if (modoAlcance === "CATEGORIA") {
        const totalEnCategoria = productos.filter(p => p.categoriaId === categoriaSeleccionada).length;
        // Si la selección es diferente al total, significa que hubo exclusiones manuales
        if (productosSeleccionados.length !== totalEnCategoria) {
            aplicarA_Final = "SELECCION";
        }
    }

    if (aplicarA_Final === "SELECCION" && ids_Final.length === 0) {
        alert("Selecciona al menos un producto.");
        return;
    }

    if (aplicarA_Final === "CATEGORIA" && !categoriaSeleccionada) {
        alert("Selecciona una categoría.");
        return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/descuentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCampana, 
          descripcion,
          tipo,
          valor: Number(valor),
          startsAt,
          endsAt,
          aplicarA: aplicarA_Final,
          categoriaId: categoriaSeleccionada,
          productoIds: ids_Final
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear campaña");
      }

      const data = await res.json();
      alert(data.mensaje || "Campaña creada con éxito");
      router.push("/admin/descuentos");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* Info Básica */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">
                 📝 Detalles
              </h2>
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase">Nombre</label>
                 <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-black/5 outline-none"
                    placeholder="Ej: Liquidación Verano 2026"
                    value={nombreCampana}
                    onChange={e => setNombreCampana(e.target.value)}
                 />
              </div>
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase">Descripción</label>
                 <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-black/5 outline-none h-20 resize-none"
                    placeholder="Notas internas..."
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                 />
              </div>
           </div>

           {/* Reglas de Descuento */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">
                 💰 Reglas
              </h2>
              
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Tipo</label>
                 <div className="flex rounded-lg shadow-sm">
                    <button 
                       type="button"
                       onClick={() => setTipo("PORCENTAJE")}
                       className={`flex-1 py-2.5 text-xs font-bold rounded-l-lg border transition-all ${tipo === 'PORCENTAJE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                       % Porcentaje
                    </button>
                    <button 
                       type="button"
                       onClick={() => setTipo("MONTO")}
                       className={`flex-1 py-2.5 text-xs font-bold rounded-r-lg border-t border-b border-r transition-all ${tipo === 'MONTO' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                       S/ Monto Fijo
                    </button>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Valor</label>
                 <div className="relative">
                    <input 
                       type="number" step="0.01" required
                       className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 font-bold text-lg focus:ring-2 focus:ring-black/5 outline-none"
                       value={valor}
                       onChange={e => setValor(e.target.value)}
                       placeholder="0"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold pointer-events-none">
                       {tipo === "PORCENTAJE" ? "%" : "S/"}
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Inicio</label>
                    <input 
                       type="date" required
                       className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                       value={startsAt}
                       onChange={e => setStartsAt(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Fin</label>
                    <input 
                       type="date" required
                       className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                       value={endsAt}
                       onChange={e => setEndsAt(e.target.value)}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* COLUMNA DERECHA: SELECCIÓN DE PRODUCTOS */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[700px] flex flex-col">
              
              {/* Header de la sección */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4 gap-4">
                 <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <span>🎯 Alcance</span>
                 </h2>
                 
                 {/* Filtro Stock (Mejora 4) */}
                 <label className="flex items-center gap-2 text-xs cursor-pointer select-none bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <input 
                        type="checkbox"
                        checked={ocultarSinStock}
                        onChange={e => setOcultarSinStock(e.target.checked)}
                        className="rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-medium text-gray-600">Ocultar sin Stock (0)</span>
                 </label>
              </div>

              {/* Tabs de Modo */}
              <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-50 rounded-xl w-full sm:w-fit">
                 <button 
                    type="button"
                    onClick={() => { setModoAlcance("SELECCION"); setCategoriaSeleccionada(""); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${modoAlcance === 'SELECCION' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    Manual
                 </button>
                 <button 
                    type="button"
                    onClick={() => setModoAlcance("CATEGORIA")}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${modoAlcance === 'CATEGORIA' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    Por Categoría
                 </button>
                 <button 
                    type="button"
                    onClick={() => { setModoAlcance("TODOS"); setCategoriaSeleccionada(""); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${modoAlcance === 'TODOS' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    Todo el Catálogo
                 </button>
              </div>

              {/* Contenido Dinámico */}
              <div className="flex-1 flex flex-col">
                 
                 {/* Barra de Herramientas (Buscador y Dropdown Categoría) */}
                 <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <input 
                           className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none placeholder:text-gray-400"
                           placeholder="Buscar producto..."
                           value={busquedaProd}
                           onChange={e => setBusquedaProd(e.target.value)}
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>

                    {modoAlcance === 'CATEGORIA' && (
                       <select 
                          className="w-full sm:w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none animate-in fade-in zoom-in-95 duration-200"
                          value={categoriaSeleccionada}
                          onChange={e => setCategoriaSeleccionada(e.target.value)}
                       >
                          <option value="">-- Selecciona Categoría --</option>
                          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                       </select>
                    )}
                 </div>

                 {/* GRID DE PRODUCTOS */}
                 <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex-1 relative min-h-[400px]">
                    <div className="absolute inset-0 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 custom-scrollbar content-start">
                       
                       {productosVisibles.length === 0 ? (
                          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 h-full mt-20">
                             <span className="text-4xl mb-3 opacity-20">📦</span>
                             <p className="text-sm font-medium">No hay productos que coincidan.</p>
                          </div>
                       ) : (
                          productosVisibles.map(p => {
                             // Lógica visual: ¿Está seleccionado?
                             const isSelected = productosSeleccionados.includes(p.id);
                             const isAllMode = modoAlcance === 'TODOS';
                             const isActive = isSelected || isAllMode;
                             
                             // En modo TODOS, no permitimos deseleccionar individualmente (limitación lógica simple), 
                             // o podríamos permitir exclusiones, pero simplificamos UX.
                             const canInteract = modoAlcance !== 'TODOS';

                             return (
                                <div 
                                   key={p.id}
                                   className={`relative group bg-white border rounded-xl overflow-hidden transition-all shadow-sm flex flex-col h-full ${
                                      isActive ? 'ring-2 ring-slate-900 border-transparent' : 'hover:border-gray-400'
                                    } ${
                                      !isActive ? 'opacity-70 hover:opacity-100' : ''
                                    }`}
                                >
                                   {/* Imagen y Botón Zoom */}
                                   <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                      {p.imagen ? (
                                         // eslint-disable-next-line @next/next/no-img-element
                                         <img src={p.imagen} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">SIN FOTO</div>
                                      )}
                                      
                                      {/* Checkbox Visual */}
                                      {canInteract && (
                                         <div 
                                            onClick={() => toggleSeleccion(p.id)}
                                            className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors shadow-sm cursor-pointer ${isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                                         >
                                            {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                                         </div>
                                      )}

                                      {/* Botón Ver (Modal) - Mejora 2 */}
                                      <button
                                         type="button"
                                         onClick={(e) => { e.stopPropagation(); setProductoEnModal(p); }}
                                         className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-slate-900 hover:scale-110 transition-all shadow-sm z-20"
                                         title="Ver detalle grande"
                                      >
                                         👁️
                                      </button>
                                   </div>
                                   
                                   {/* Info del Producto */}
                                   <div 
                                      className={`p-3 flex-1 flex flex-col cursor-pointer ${canInteract ? '' : 'cursor-default'}`}
                                      onClick={() => canInteract && toggleSeleccion(p.id)}
                                   >
                                      {/* Nombre con más espacio - Mejora 1 */}
                                      <p className="text-xs font-semibold text-gray-800 leading-tight mb-2 line-clamp-3 min-h-[2.5em]" title={p.nombre}>
                                         {p.nombre}
                                      </p>
                                      
                                      <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500 font-mono pt-2 border-t border-gray-50">
                                          <span className={`${p.stockTotal === 0 ? 'text-red-500 font-bold' : ''}`}>
                                            Stock: {p.stockTotal}
                                          </span>
                                          <span className="font-bold text-slate-700">
                                            S/ {p.precio.toFixed(2)}
                                          </span>
                                      </div>
                                   </div>
                                </div>
                             )
                          })
                       )}
                    </div>
                 </div>
                 
                 {/* Footer de estado de selección */}
                 <div className="mt-4 flex justify-between items-center text-xs text-gray-500 px-1">
                     <span>Mostrando {productosVisibles.length} productos</span>
                     <span className="font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                        {modoAlcance === 'TODOS' ? 'Seleccionados TODOS' : `Seleccionados: ${productosSeleccionados.length}`}
                     </span>
                 </div>

              </div>
           </div>
        </div>
      </div>

      {/* Footer Fijo de Acción */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-500 hidden sm:block">
               {modoAlcance === 'TODOS' ? (
                   <span>Se aplicará a <b>TODO el catálogo</b>.</span>
               ) : (
                   <span>Se aplicará a <b>{productosSeleccionados.length}</b> productos seleccionados.</span>
               )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-end">
               <button 
                  type="button" 
                  onClick={() => router.back()}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
               >
                  Cancelar
               </button>
               <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
               >
                  {loading ? "Guardando..." : "🚀 Lanzar Campaña"}
               </button>
            </div>
         </div>
      </div>
    </form>

    {/* --- MODAL DE DETALLE (Mejora 2) --- */}
    {productoEnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setProductoEnModal(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="relative h-64 bg-gray-100">
                    {productoEnModal.imagen ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={productoEnModal.imagen} alt="" className="w-full h-full object-contain mix-blend-multiply p-4" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">Sin Imagen</div>
                    )}
                    <button 
                        onClick={() => setProductoEnModal(null)}
                        className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-black font-bold transition-transform hover:scale-110"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            {productoEnModal.nombre}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            ID: <span className="font-mono text-xs">{productoEnModal.id}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 py-4 border-t border-b border-gray-100">
                        <div className="flex-1 text-center border-r border-gray-100">
                            <p className="text-xs text-gray-500 uppercase font-bold">Precio Actual</p>
                            <p className="text-2xl font-bold text-slate-900">S/ {productoEnModal.precio.toFixed(2)}</p>
                        </div>
                        <div className="flex-1 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold">Stock Total</p>
                            <p className={`text-2xl font-bold ${productoEnModal.stockTotal === 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {productoEnModal.stockTotal} un.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {productosSeleccionados.includes(productoEnModal.id) ? (
                            <button
                                onClick={() => { toggleSeleccion(productoEnModal.id); setProductoEnModal(null); }}
                                className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                            >
                                Quitar de la Campaña
                            </button>
                        ) : (
                            <button
                                onClick={() => { toggleSeleccion(productoEnModal.id); setProductoEnModal(null); }}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                Agregar a Campaña
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
}