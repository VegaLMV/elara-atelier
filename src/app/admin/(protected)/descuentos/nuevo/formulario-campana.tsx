"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Props = {
  categorias: { id: string; nombre: string }[];
  productos: { id: string; nombre: string; categoriaId: string | null; imagen: string | null }[];
};

export default function FormularioCampana({ categorias, productos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. Datos de la Campaña (Metadata)
  const [nombreCampana, setNombreCampana] = useState("");
  const [descripcion, setDescripcion] = useState("");
  
  // 2. Configuración de Oferta
  const [tipo, setTipo] = useState<"PORCENTAJE" | "MONTO">("PORCENTAJE");
  const [valor, setValor] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  
  // 3. Selección de Productos
  const [aplicarA, setAplicarA] = useState<"TODOS" | "CATEGORIA" | "SELECCION">("SELECCION");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busquedaProd, setBusquedaProd] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>([]);

  // Filtrado de productos para la selección manual
  const productosFiltrados = useMemo(() => {
    let lista = productos;
    
    // Si estamos en modo categoría, pre-filtramos visualmente
    if (categoriaSeleccionada && aplicarA === "CATEGORIA") {
       lista = lista.filter(p => p.categoriaId === categoriaSeleccionada);
    }
    
    // Búsqueda por texto dentro del selector
    if (busquedaProd) {
       const q = busquedaProd.toLowerCase();
       lista = lista.filter(p => p.nombre.toLowerCase().includes(q));
    }
    
    return lista;
  }, [productos, categoriaSeleccionada, aplicarA, busquedaProd]);

  // Manejador de selección manual
  const toggleSeleccion = (id: string) => {
    if (productosSeleccionados.includes(id)) {
      setProductosSeleccionados(prev => prev.filter(pId => pId !== id));
    } else {
      setProductosSeleccionados(prev => [...prev, id]);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validaciones
    if (!valor || !startsAt || !endsAt) {
        alert("Completa los campos obligatorios de la oferta (Valor y Fechas).");
        return;
    }
    
    if (aplicarA === "SELECCION" && productosSeleccionados.length === 0) {
        alert("Selecciona al menos un producto para aplicar el descuento.");
        return;
    }

    if (aplicarA === "CATEGORIA" && !categoriaSeleccionada) {
        alert("Selecciona una categoría.");
        return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/descuentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Metadata (Nuevos campos)
          nombreCampana, 
          descripcion,
          // Oferta
          tipo,
          valor: Number(valor),
          startsAt,
          endsAt,
          // Alcance
          aplicarA,
          categoriaId: categoriaSeleccionada,
          productoIds: productosSeleccionados
        }),
      });

      if (!res.ok) {
        throw new Error("Error al crear campaña");
      }

      const data = await res.json();
      alert(data.mensaje || "Campaña creada con éxito");
      router.push("/admin/descuentos");
      router.refresh();
    } catch (error) {
      alert("Ocurrió un error inesperado al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* Card: Info Básica */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">
                 📝 Detalles de Campaña
              </h2>
              <div className="space-y-3">
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Nombre (Opcional)</label>
                    <input 
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-black/5 outline-none placeholder:text-gray-300"
                       placeholder="Ej: Liquidación Verano 2026"
                       value={nombreCampana}
                       onChange={e => setNombreCampana(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Descripción</label>
                    <textarea 
                       className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-black/5 outline-none h-20 resize-none placeholder:text-gray-300"
                       placeholder="Notas internas sobre esta oferta..."
                       value={descripcion}
                       onChange={e => setDescripcion(e.target.value)}
                    />
                 </div>
              </div>
           </div>

           {/* Card: Reglas de Descuento */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">
                 💰 Reglas de Descuento
              </h2>
              
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Tipo de Descuento</label>
                 <div className="flex rounded-lg shadow-sm">
                    <button 
                       type="button"
                       onClick={() => setTipo("PORCENTAJE")}
                       className={`flex-1 py-2.5 text-xs font-bold rounded-l-lg border transition-all ${tipo === 'PORCENTAJE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                       Porcentaje %
                    </button>
                    <button 
                       type="button"
                       onClick={() => setTipo("MONTO")}
                       className={`flex-1 py-2.5 text-xs font-bold rounded-r-lg border-t border-b border-r transition-all ${tipo === 'MONTO' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                       Monto Fijo S/
                    </button>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Valor del Descuento</label>
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
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[600px] flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4 gap-4">
                 <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <span>🎯 Alcance de la Campaña</span>
                 </h2>
                 <span className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-600 font-medium border border-gray-200">
                    {aplicarA === 'SELECCION' ? `${productosSeleccionados.length} productos seleccionados` : aplicarA === 'CATEGORIA' ? 'Por Categoría completa' : 'Todo el catálogo'}
                 </span>
              </div>

              {/* Tabs de Alcance */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-50 rounded-xl w-fit">
                 <button 
                    type="button"
                    onClick={() => setAplicarA("SELECCION")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aplicarA === 'SELECCION' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    Selección Manual
                 </button>
                 <button 
                    type="button"
                    onClick={() => setAplicarA("CATEGORIA")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aplicarA === 'CATEGORIA' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    Por Categoría
                 </button>
                 <button 
                    type="button"
                    onClick={() => setAplicarA("TODOS")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aplicarA === 'TODOS' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                 >
                    Todo el Catálogo
                 </button>
              </div>

              {/* Contenido Dinámico */}
              <div className="flex-1 flex flex-col">
                 
                 {/* Filtros Internos */}
                 <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <input 
                           className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none placeholder:text-gray-400"
                           placeholder="Buscar producto por nombre..."
                           value={busquedaProd}
                           onChange={e => setBusquedaProd(e.target.value)}
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>

                    {aplicarA === 'CATEGORIA' && (
                       <select 
                          className="w-full sm:w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none"
                          value={categoriaSeleccionada}
                          onChange={e => setCategoriaSeleccionada(e.target.value)}
                       >
                          <option value="">Selecciona una categoría...</option>
                          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                       </select>
                    )}
                 </div>

                 {/* Grid de Productos con Imágenes */}
                 <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex-1 relative min-h-[300px]">
                    <div className="absolute inset-0 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 custom-scrollbar">
                       {productosFiltrados.length === 0 ? (
                          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 h-full">
                             <span className="text-3xl mb-2 opacity-30">📦</span>
                             <p className="text-sm font-medium">No se encontraron productos</p>
                          </div>
                       ) : (
                          productosFiltrados.map(p => {
                             // Lógica visual de selección
                             const isManualSelected = productosSeleccionados.includes(p.id);
                             const isCategorySelected = aplicarA === 'CATEGORIA' && p.categoriaId === categoriaSeleccionada;
                             const isAllSelected = aplicarA === 'TODOS';
                             
                             const isActive = (aplicarA === 'SELECCION' && isManualSelected) || isCategorySelected || isAllSelected;
                             const isManualMode = aplicarA === 'SELECCION';
                             
                             return (
                                <div 
                                   key={p.id}
                                   onClick={() => isManualMode && toggleSeleccion(p.id)}
                                   className={`relative group bg-white border rounded-lg overflow-hidden transition-all cursor-pointer select-none flex flex-col shadow-sm ${
                                      isActive 
                                         ? 'ring-2 ring-slate-900 border-transparent' 
                                         : 'hover:border-gray-300'
                                   } ${!isManualMode && !isActive ? 'opacity-50 grayscale' : ''}`}
                                >
                                   {/* Checkbox visual para manual */}
                                   {isManualMode && (
                                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors shadow-sm ${isManualSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-gray-200'}`}>
                                         {isManualSelected && <span className="text-white text-xs font-bold">✓</span>}
                                      </div>
                                   )}

                                   <div className="aspect-square bg-gray-100 relative">
                                      {p.imagen ? (
                                         // eslint-disable-next-line @next/next/no-img-element
                                         <img src={p.imagen} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium">SIN FOTO</div>
                                      )}
                                      
                                      {/* Overlay de selección automática */}
                                      {!isManualMode && isActive && (
                                         <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center pointer-events-none">
                                            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">INCLUIDO</span>
                                         </div>
                                      )}
                                   </div>
                                   
                                   <div className="p-3 flex-1 flex flex-col justify-center">
                                      <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight text-center">{p.nombre}</p>
                                   </div>
                                </div>
                             )
                          })
                       )}
                    </div>
                 </div>
                 
              </div>
           </div>
        </div>
      </div>

      {/* Footer Fijo con Acciones */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-500 hidden sm:block">
               {aplicarA === 'SELECCION' ? (
                  <span>Se aplicará a <b>{productosSeleccionados.length}</b> productos seleccionados.</span>
               ) : aplicarA === 'CATEGORIA' ? (
                  <span>Se aplicará a toda la categoría <b>{categorias.find(c => c.id === categoriaSeleccionada)?.nombre || "..."}</b>.</span>
               ) : (
                  <span>Se aplicará a <b>todo el catálogo</b> activo.</span>
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
                  {loading ? "Creando Campaña..." : "🚀 Lanzar Campaña"}
               </button>
            </div>
         </div>
      </div>

    </form>
  );
}