"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, LayoutGrid, Table, RotateCcw } from "lucide-react";

type Categoria = { id: string; nombre: string };

export default function FiltrosProductos({
  categorias,
  initial,
}: {
  categorias: Categoria[];
  initial: {
    q: string;
    categoria: string;
    estado: string;
    stock: string;
    descuento: string;
    orden: string;
    vista: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initial.q);
  const [categoria, setCategoria] = useState(initial.categoria);
  const [estado, setEstado] = useState(initial.estado);
  const [stock, setStock] = useState(initial.stock);
  const [descuento, setDescuento] = useState(initial.descuento);
  const [orden, setOrden] = useState(initial.orden);
  const [vista, setVista] = useState(initial.vista);

  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setCategoria(sp.get("categoria") ?? "");
    setEstado(sp.get("estado") ?? "");
    setStock(sp.get("stock") ?? "todas");
    setDescuento(sp.get("descuento") ?? "todas");
    setOrden(sp.get("orden") ?? "recientes");
    setVista(sp.get("vista") ?? "tabla");
  }, [sp]);

  // Debounce para aplicar filtros
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (categoria) params.set("categoria", categoria);
      if (estado) params.set("estado", estado);
      if (stock !== "todas") params.set("stock", stock);
      if (descuento !== "todas") params.set("descuento", descuento);
      if (orden !== "recientes") params.set("orden", orden);
      if (vista !== "tabla") params.set("vista", vista);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [q, categoria, estado, stock, descuento, orden, vista, router, pathname]);

  const limpiarFiltros = () => {
    setQ(""); setCategoria(""); setEstado(""); setStock("todas"); setDescuento("todas"); setOrden("recientes");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" /> Filtros Avanzados
        </h2>
        
        {/* Selector Vista */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setVista("tabla")}
                className={`p-1.5 rounded-md transition-all ${vista === 'tabla' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vista Tabla"
            >
                <Table className="w-4 h-4" />
            </button>
            <button
                onClick={() => setVista("portada")}
                className={`p-1.5 rounded-md transition-all ${vista === 'portada' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vista Galería"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Buscador */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Búsqueda</label>
          <div className="relative group">
             <input
               value={q}
               onChange={(e) => setQ(e.target.value)}
               placeholder="Nombre, SKU o Slug..."
               className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all placeholder:text-gray-400 font-medium"
             />
             <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-slate-900 transition-colors" />
          </div>
        </div>

        {/* Categoría */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Categoría</label>
          <div className="relative">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
          </div>
        </div>

        {/* Estado & Stock */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Estado / Stock</label>
          <div className="flex gap-2">
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
              <select
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all cursor-pointer"
              >
                <option value="todas">Todos</option>
                <option value="con">Con stock</option>
                <option value="sin">Sin stock</option>
              </select>
          </div>
        </div>

        {/* Ofertas & Orden */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Ofertas / Orden</label>
          <div className="flex gap-2">
              <select
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all cursor-pointer"
              >
                <option value="todas">Todos</option>
                <option value="con">Con descuento</option>
                <option value="sin">Sin descuento</option>
              </select>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="w-1/2 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all cursor-pointer"
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguos">Más antiguos</option>
                <option value="precio_asc">Precio: Bajo a Alto</option>
                <option value="precio_desc">Precio: Alto a Bajo</option>
              </select>
          </div>
        </div>

        {/* Botón Reset */}
        <div className="md:col-span-1 pb-0.5">
            <button
                onClick={limpiarFiltros}
                className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm"
                title="Limpiar filtros"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
}