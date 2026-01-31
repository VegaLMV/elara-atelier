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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

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

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm">Buscar</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o slug..."
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Stock</label>
          <select
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="todas">Todos</option>
            <option value="con">Con stock</option>
            <option value="sin">Sin stock</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Descuento</label>
          <select
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="todas">Todos</option>
            <option value="con">Con descuento</option>
            <option value="sin">Sin descuento</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm">Orden</label>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="nombre_asc">Nombre A–Z</option>
            <option value="nombre_desc">Nombre Z–A</option>
            <option value="precio_asc">Precio menor a mayor</option>
            <option value="precio_desc">Precio mayor a menor</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Vista</label>
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="tabla">Tabla</option>
            <option value="portada">Portada</option>
          </select>
        </div>

        <div className="flex gap-3 md:col-span-3">
          <button
            type="button"
            className="underline self-center"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
