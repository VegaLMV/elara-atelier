export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductoCard from "./producto-card";
import HeroSection from "./hero-section";
import FilterSidebar from "./filter-sidebar";
import { Search } from "lucide-react";
import Pagination from "@/components/pagination";

// Cálculo de precios (backend)
function calcularPrecioFinal(precio: number, tipo: string | null, valor: number | null) {
  if (!tipo || !valor) return precio;
  if (tipo === "PORCENTAJE") return precio * (1 - valor / 100);
  return Math.max(0, precio - valor);
}

type SP = {
  q?: string;
  categoria?: string;
  orden?: "recientes" | "precio_asc" | "precio_desc";
  min?: string;
  max?: string;
  page?: string;
};

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const categoriaSlug = (sp.categoria ?? "").trim();
  const orden = (sp.orden ?? "recientes") as SP["orden"];
  const minPrice = Number(sp.min) || 0;
  const maxPrice = Number(sp.max) || 0;
  const currentPage = Number(sp.page) || 1;
  const ITEMS_PER_PAGE = 12;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: Prisma.ProductoWhereInput = { estado: "ACTIVO" };

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoriaSlug) {
    where.categoria = { slug: categoriaSlug };
  }

  if (minPrice > 0 || maxPrice > 0) {
    where.precio = {};
    if (minPrice > 0) where.precio.gte = minPrice;
    if (maxPrice > 0) where.precio.lte = maxPrice;
  }

  const orderBy: Prisma.ProductoOrderByWithRelationInput =
    orden === "precio_asc" ? { precio: "asc" } :
    orden === "precio_desc" ? { precio: "desc" } :
    { creadoEn: "desc" };

  const [totalProductos, productosRaw, categorias] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }], take: 5 },
      },
      orderBy,
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      where: { productos: { some: { estado: "ACTIVO" } } }
    }),
  ]);

  const totalPages = Math.ceil(totalProductos / ITEMS_PER_PAGE);

  const ahora = new Date();
  const productos = productosRaw.map((p) => {
    const precioOriginal = Number(p.precio);
    const inicioValido = !p.descuentoInicio || new Date(p.descuentoInicio) <= ahora;
    const finValido = !p.descuentoFin || new Date(p.descuentoFin) >= ahora;
    const tieneDescuento = p.descuentoActivo && inicioValido && finValido;

    const precioFinal = tieneDescuento
      ? calcularPrecioFinal(precioOriginal, p.descuentoTipo, Number(p.descuentoValor))
      : precioOriginal;

    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      categoria: p.categoria?.nombre,
      imagenes: p.imagenes.map(i => i.url),
      precioOriginal,
      precioFinal,
      tieneDescuento,
      porcentaje: p.descuentoTipo === 'PORCENTAJE' ? Number(p.descuentoValor) : null,
      esNuevo: p.nuevoHasta ? new Date(p.nuevoHasta) >= ahora : false,
      stock: p.stock,
      destacado: p.destacado,
    };
  });

  const categoriaActualNombre = categorias.find(c => c.slug === categoriaSlug)?.nombre;

  return (
    <div className="bg-white min-h-screen">

      {/* 1. HERO SECTION PREMIUM */}
      <HeroSection categoriaNombre={categoriaActualNombre} />

      <div className="max-w-[1600px] mx-auto px-6 py-16" id="catalogo-grid">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* 2. SIDEBAR FILTERS (Sticky) */}
          <div className="hidden lg:block sticky top-8 self-start h-fit">
            <FilterSidebar categorias={categorias} />
          </div>

          <main className="flex-1 space-y-8">
            {/* Header Móvil y Buscador */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{productos.length} Productos Encontrados</p>

              <form action="/catalogo" className="w-full md:w-auto relative group">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar prenda..."
                  className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-full px-10 py-2.5 text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                />
              </form>
            </div>

            {/* GRID PRODUCTOS */}
            {productos.length === 0 ? (
              <div className="py-32 text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="text-6xl opacity-10 grayscale">🛍️</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-medium text-slate-900">No encontramos coincidencias</h3>
                  <p className="text-slate-500 font-light">Intenta con otros términos o explora todas las categorías.</p>
                </div>
                <Link
                  href="/catalogo"
                  className="inline-block bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/30"
                >
                  Ver Todo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                {productos.map((p, idx) => (
                  <div key={p.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 50}ms` }}>
                    <ProductoCard producto={p} />
                  </div>
                ))}
              </div>
            )}

            {/* PAGINACIÓN */}
            <div className="flex justify-center pt-8 border-t border-gray-50/50">
               <Pagination totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}