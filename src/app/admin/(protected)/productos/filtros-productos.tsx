"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();

      const qTrim = q.trim();
      if (qTrim) params.set("q", qTrim);
      if (categoria) params.set("categoria", categoria);
      if (estado) params.set("estado", estado);
      if (stock && stock !== "todas") params.set("stock", stock);
      if (descuento && descuento !== "todas") params.set("descuento", descuento);
      if (orden && orden !== "recientes") params.set("orden", orden);
      if (vista && vista !== "tabla") params.set("vista", vista);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);

    return () => clearTimeout(t);
  }, [q, categoria, estado, stock, descuento, orden, vista, router, pathname]);

  const limpiarFiltros = () => {
    setQ("");
    setCategoria("");
    setEstado("");
    setStock("todas");
    setDescuento("todas");
    setOrden("recientes");
    // Vista la mantenemos
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <span>🔍</span> Filtrar Catálogo
        </h2>
        <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vista:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setVista("tabla")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${vista === 'tabla' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Tabla
                </button>
                <button
                    onClick={() => setVista("portada")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${vista === 'portada' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Portada
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Buscador Principal */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Búsqueda</label>
          <div className="relative group">
             <input
               value={q}
               onChange={(e) => setQ(e.target.value)}
               placeholder="Nombre, descripción o slug..."
               className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400 group-hover:border-gray-400"
             />
             <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Categoría */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all cursor-pointer hover:border-gray-400"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all cursor-pointer hover:border-gray-400"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

        {/* Stock */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inventario</label>
          <select
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all cursor-pointer hover:border-gray-400"
          >
            <option value="todas">Cualquiera</option>
            <option value="con">Con stock</option>
            <option value="sin">Sin stock</option>
          </select>
        </div>

        {/* Descuento */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ofertas</label>
          <select
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all cursor-pointer hover:border-gray-400"
          >
            <option value="todas">Cualquiera</option>
            <option value="con">Con descuento</option>
            <option value="sin">Sin descuento</option>
          </select>
        </div>

        {/* Ordenamiento (Fila 2) */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ordenar por</label>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all cursor-pointer hover:border-gray-400"
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="nombre_asc">Nombre (A-Z)</option>
            <option value="nombre_desc">Nombre (Z-A)</option>
            <option value="precio_asc">Precio (Bajo a Alto)</option>
            <option value="precio_desc">Precio (Alto a Bajo)</option>
          </select>
        </div>

        {/* Botón Limpiar */}
        <div className="md:col-span-2 flex items-end">
            <button
                onClick={limpiarFiltros}
                className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                title="Restablecer todos los filtros"
            >
                Restablecer
            </button>
        </div>
      </div>
    </div>
  );
}