"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  LayoutGrid,
  Filter
} from "lucide-react";

// --- Tipos ---
type ProductoInput = {
  id: string;
  nombre: string;
  categoriaId: string | null;
  imagen: string | null;
  precio: number;
  stockTotal: number;
  estado: string;
};

type CategoriaInfo = {
  id: string;
  nombre: string;
};

type Props = {
  initialData?: any;
  categorias?: CategoriaInfo[];
  productos?: ProductoInput[];
};

export default function FormularioCampana({ initialData, categorias = [], productos = [] }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- OBTENER FECHA LOCAL (Para inputs date) ---
  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  // --- ESTADOS ---
  // Nota: Usamos 'nombre' porque el modelo Campana tiene 'nombre', no 'nombreCampana'
  const [nombre, setNombre] = useState(initialData?.nombre || "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
  const [tipo, setTipo] = useState<"PORCENTAJE" | "MONTO">(initialData?.tipo || "PORCENTAJE");
  const [valor, setValor] = useState(initialData?.valor ? String(initialData.valor) : "");
  
  const defaultStart = initialData?.startsAt ? new Date(initialData.startsAt).toISOString().split('T')[0] : "";
  const defaultEnd = initialData?.endsAt ? new Date(initialData.endsAt).toISOString().split('T')[0] : "";
  
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);

  // --- ALCANCE ---
  const [modoAlcance, setModoAlcance] = useState<"TODOS" | "CATEGORIA" | "SELECCION">("SELECCION");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  // Si editamos, initialData.productoIds viene pre-llenado desde el servidor
  const [productosSeleccionados, setProductosSeleccionados] = useState<string[]>(initialData?.productoIds || []);
   
  // --- FILTROS UI ---
  const [busquedaProd, setBusquedaProd] = useState("");
  const [ocultarSinStock, setOcultarSinStock] = useState(true);

  // 1. Efecto: Pre-llenar selección si elige Categoría
  useEffect(() => {
    if (modoAlcance === "CATEGORIA" && categoriaSeleccionada && productos.length > 0) {
      const idsDeCategoria = productos
        .filter(p => p.categoriaId === categoriaSeleccionada)
        .map(p => p.id);
      
      setProductosSeleccionados(idsDeCategoria);
    }
  }, [modoAlcance, categoriaSeleccionada, productos]); 

  // 2. Filtrado VISUAL (Grid)
  const productosVisibles = useMemo(() => {
    let lista = productos;

    // Si estamos en modo manual, mostramos todo salvo lo filtrado por texto
    // Si estamos en modo categoría, mostramos solo esa categoría para confirmar visualmente
    if (modoAlcance === "CATEGORIA" && categoriaSeleccionada) {
       lista = lista.filter(p => p.categoriaId === categoriaSeleccionada);
    }

    if (busquedaProd) {
       const q = busquedaProd.toLowerCase();
       lista = lista.filter(p => p.nombre.toLowerCase().includes(q));
    }

    if (ocultarSinStock) {
       lista = lista.filter(p => p.stockTotal > 0);
    }
    
    return lista;
  }, [productos, categoriaSeleccionada, modoAlcance, busquedaProd, ocultarSinStock]);

  // 3. Toggle Selección
  const toggleSeleccion = (id: string) => {
    setProductosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // --- SUBMIT ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validaciones
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) { toast.error("Ingresa un valor de descuento válido"); return; }
    if (!startsAt || !endsAt) { toast.error("Define el rango de fechas"); return; }

    if (endsAt < startsAt) {
        toast.error("La fecha fin no puede ser anterior al inicio");
        return;
    }
    
    // Preparar Payload
    let aplicarA_Final = modoAlcance;
    let ids_Final = productosSeleccionados;

    // Si eligió categoría pero modificó la selección manualmente, pasa a ser selección manual
    if (modoAlcance === "CATEGORIA" && productos.length > 0) {
        const totalEnCat = productos.filter(p => p.categoriaId === categoriaSeleccionada).length;
        if (productosSeleccionados.length !== totalEnCat) {
            aplicarA_Final = "SELECCION";
        }
    }

    if (aplicarA_Final === "SELECCION" && ids_Final.length === 0) {
        toast.error("Selecciona al menos un producto");
        return;
    }
    if (aplicarA_Final === "CATEGORIA" && !categoriaSeleccionada) {
        toast.error("Selecciona una categoría");
        return;
    }
    if (aplicarA_Final === "TODOS") {
        ids_Final = productos.map(p => p.id); // Enviamos todos los IDs explícitamente para el backend
    }

    setLoading(true);

    try {
      const url = initialData ? `/api/admin/descuentos/${initialData.id}` : `/api/admin/descuentos`;
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, 
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

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
             toast.error("Conflicto detectado", { description: json.error, duration: 6000 });
        } else {
             throw new Error(json.error || "Error desconocido");
        }
        return;
      }

      toast.success(initialData ? "Campaña actualizada" : "Campaña creada con éxito");
      router.push("/admin/descuentos");
      router.refresh();
    } catch (error: any) {
      toast.error("Error al guardar", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === COLUMNA IZQUIERDA: CONFIGURACIÓN (4 cols) === */}
        <div className="lg:col-span-4 space-y-6">
            
           {/* Card: Detalles */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                 <Tag className="w-4 h-4 text-blue-600" /> Configuración Básica
              </h2>
              
              <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Campaña</label>
                     <input 
                        className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-gray-300"
                        placeholder="Ej: Cyber Days 2026"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descripción</label>
                     <textarea 
                        className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all h-24 resize-none placeholder:text-gray-300"
                        placeholder="Notas internas..."
                        value={descripcion}
                        onChange={e => setDescripcion(e.target.value)}
                     />
                  </div>
              </div>
           </div>

           {/* Card: Reglas */}
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="w-24 h-24" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-yellow-500" /> Reglas de Precio
              </h2>
              
              <div className="space-y-5 relative z-10">
                  <div className="flex bg-gray-50 p-1 rounded-xl">
                    <button 
                       type="button"
                       onClick={() => setTipo("PORCENTAJE")}
                       className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tipo === 'PORCENTAJE' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                       % Porcentaje
                    </button>
                    <button 
                       type="button"
                       onClick={() => setTipo("MONTO")}
                       className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tipo === 'MONTO' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                       S/ Fijo
                    </button>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Valor Descuento</label>
                     <div className="relative mt-1">
                        <input 
                           type="number" step="0.01" min="0"
                           className="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-3 font-mono font-bold text-2xl text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                           value={valor}
                           onChange={e => setValor(e.target.value)}
                           placeholder="0"
                        />
                        <span className="absolute right-4 top-4 text-gray-400 font-bold">
                           {tipo === "PORCENTAJE" ? "%" : "S/"}
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Desde</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                               type="date" 
                               min={!initialData ? todayStr : undefined} 
                               className="w-full border border-gray-200 rounded-xl pl-9 pr-2 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-medium text-gray-600"
                               value={startsAt}
                               onChange={e => setStartsAt(e.target.value)}
                            />
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Hasta</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                               type="date" 
                               min={startsAt || todayStr}
                               className="w-full border border-gray-200 rounded-xl pl-9 pr-2 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-medium text-gray-600"
                               value={endsAt}
                               onChange={e => setEndsAt(e.target.value)}
                            />
                        </div>
                     </div>
                  </div>
              </div>
           </div>
        </div>

        {/* === COLUMNA DERECHA: SELECCIÓN (8 cols) === */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[600px] flex flex-col">
              
              {/* Header Selector */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-5 mb-5 gap-4">
                 <div>
                     <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-purple-600" /> Alcance de la Promoción
                     </h2>
                     <p className="text-xs text-gray-400 mt-1">Selecciona qué productos recibirán el descuento.</p>
                 </div>
                 
                 <label className="flex items-center gap-2 text-xs cursor-pointer select-none bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <input 
                       type="checkbox"
                       checked={ocultarSinStock}
                       onChange={e => setOcultarSinStock(e.target.checked)}
                       className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                    />
                    <span className="font-medium text-gray-600">Ocultar Agotados</span>
                 </label>
              </div>

              {/* Tabs de Modo */}
              <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-xl w-full md:w-fit border border-gray-100">
                 {[
                    { id: "SELECCION", label: "Selección Manual" },
                    { id: "CATEGORIA", label: "Por Categoría" },
                    { id: "TODOS", label: "Todo el Catálogo" }
                 ].map((m) => (
                     <button 
                        key={m.id}
                        type="button"
                        onClick={() => { 
                            setModoAlcance(m.id as any); 
                            if (m.id !== "CATEGORIA") setCategoriaSeleccionada("");
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${modoAlcance === m.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                     >
                        {m.label}
                     </button>
                 ))}
              </div>

              {/* Barra de Filtros */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                 <div className="relative flex-1 group">
                     <input 
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                        placeholder="Buscar producto por nombre..."
                        value={busquedaProd}
                        onChange={e => setBusquedaProd(e.target.value)}
                     />
                     <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-slate-900" />
                 </div>

                 {modoAlcance === 'CATEGORIA' && (
                    <div className="relative w-full md:w-1/3 animate-in fade-in slide-in-from-left-2">
                        <select 
                           className="w-full border border-gray-200 rounded-xl pl-10 pr-8 py-2.5 text-sm bg-white focus:ring-2 focus:ring-slate-900 outline-none appearance-none cursor-pointer"
                           value={categoriaSeleccionada}
                           onChange={e => setCategoriaSeleccionada(e.target.value)}
                        >
                           <option value="">-- Selecciona --</option>
                           {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                 )}
              </div>

              {/* Grid de Productos */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50 flex-1 relative min-h-[400px]">
                 <div className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {productosVisibles.length === 0 ? (
                           <div className="col-span-full flex flex-col items-center justify-center text-gray-400 h-60">
                              <Search className="w-10 h-10 mb-2 opacity-20" />
                              <p className="text-sm font-medium">No se encontraron productos</p>
                           </div>
                        ) : (
                           productosVisibles.map(p => {
                              const isSelected = productosSeleccionados.includes(p.id);
                              const isAllMode = modoAlcance === 'TODOS';
                              const isActive = isSelected || isAllMode;
                              const canInteract = modoAlcance !== 'TODOS';

                              return (
                                 <div 
                                    key={p.id}
                                    onClick={() => canInteract && toggleSeleccion(p.id)}
                                    className={`relative group bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
                                       isActive 
                                         ? 'ring-2 ring-blue-600 border-transparent shadow-md transform scale-[1.02]' 
                                         : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                    } ${
                                       !isActive && !canInteract ? 'opacity-50 grayscale' : ''
                                    }`}
                                 >
                                    {/* Badge Selección */}
                                    {isActive && (
                                        <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-1 shadow-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </div>
                                    )}

                                    {/* Imagen */}
                                    <div className="aspect-square bg-gray-100 relative">
                                       {p.imagen ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={p.imagen} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">Sin Foto</div>
                                       )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="p-3">
                                       <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug h-8 mb-2" title={p.nombre}>
                                          {p.nombre}
                                       </p>
                                       <div className="flex items-end justify-between pt-2 border-t border-gray-50">
                                           <div>
                                               <p className="text-[10px] text-gray-400 uppercase font-bold">Precio</p>
                                               <p className="text-xs font-bold text-slate-700">S/{p.precio.toFixed(2)}</p>
                                           </div>
                                           <div className="text-right">
                                               <p className="text-[10px] text-gray-400 uppercase font-bold">Stock</p>
                                               <span className={`text-xs font-bold ${p.stockTotal === 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                   {p.stockTotal}
                                               </span>
                                           </div>
                                       </div>
                                    </div>
                                 </div>
                              )
                           })
                        )}
                    </div>
                 </div>
              </div>
              
              {/* Footer Grid Stats */}
              <div className="mt-4 flex justify-between items-center text-xs text-gray-500 font-medium">
                 <span>Mostrando {productosVisibles.length} de {productos.length}</span>
                 <span className={`bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 ${productosSeleccionados.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    {modoAlcance === 'TODOS' ? 'Todos seleccionados' : `${productosSeleccionados.length} productos seleccionados`}
                 </span>
              </div>

           </div>
        </div>
      </div>

      {/* FOOTER FLOTANTE */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
         <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block">
               <p className="text-sm font-bold text-gray-900">
                  {initialData ? `Editando: ${initialData.nombre}` : "Nueva Campaña"}
               </p>
               <p className="text-xs text-gray-500">
                  {modoAlcance === 'TODOS' ? 'Se aplicará a todo el catálogo' : `${productosSeleccionados.length} productos seleccionados`}
               </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-end">
               <button 
                  type="button" 
                  onClick={() => router.back()}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
               >
                  Cancelar
               </button>
               <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
               >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {initialData ? "Guardar Cambios" : "Lanzar Campaña"}
               </button>
            </div>
         </div>
      </div>
    </form>
  );
}