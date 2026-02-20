export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductoCard from "../_components/shared/producto-card"; // Import path adjusted
import FilterSidebar from "./_components/filter-sidebar"; // Import path adjusted
import {
  Search,
  ArrowLeft
} from "lucide-react";
import { formatMoney, calcularPrecioFinal } from "@/lib/precios";
import Pagination from "@/components/ui/pagination";
import ScrollReveal from "@/components/ui/scroll-reveal";


type SP = {
  q?: string;
  categoria?: string;
  orden?: "recientes" | "precio_asc" | "precio_desc";
  min?: string;
  max?: string;
  page?: string;
};

export default async function CatalogoGridPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const categoriaSlug = (sp.categoria ?? "").trim();
  const orden = (sp.orden ?? "recientes") as SP["orden"];
  const minPrice = Number(sp.min) || 0;
  const maxPrice = Number(sp.max) || 0;
  const currentPage = Number(sp.page) || 1;
  const ITEMS_PER_PAGE = 12;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const ahora = new Date();

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
      select: {
        id: true,
        nombre: true,
        slug: true,
        precio: true,
        descuentoActivo: true,
        descuentoTipo: true,
        descuentoValor: true,
        descuentoInicio: true,
        descuentoFin: true,
        nuevoHasta: true,
        destacado: true,
        categoria: { select: { nombre: true } },
        imagenes: {
          select: { url: true },
          orderBy: [{ esPortada: "desc" }, { orden: "asc" }],
          take: 2
        },
        variantes: { select: { stockActual: true } }
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
  const productos = productosRaw.map((p) => {
    const precioOriginal = Number(p.precio);
    const inicioValido = !p.descuentoInicio || new Date(p.descuentoInicio) <= ahora;
    const finValido = !p.descuentoFin || new Date(p.descuentoFin) >= ahora;
    const tieneDescuento = p.descuentoActivo && inicioValido && finValido;

    const precioFinal = tieneDescuento
      ? calcularPrecioFinal(precioOriginal, p.descuentoTipo, Number(p.descuentoValor))
      : precioOriginal;

    const stock = p.variantes.reduce((acc, v) => acc + v.stockActual, 0);

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
      destacado: p.destacado,
      stock,
    };
  });

  const categoriaActualNombre = categorias.find(c => c.slug === categoriaSlug)?.nombre;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1600px] mx-auto px-6 py-12" id="catalogo-grid">

        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link href="/tienda" className="inline-flex items-center text-sm text-slate-500 hover:text-[#864d2d] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Inicio
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-20">
          <div className="hidden lg:block sticky top-8 self-start h-fit w-72">
            <FilterSidebar categorias={categorias} />
          </div>

          <main className="flex-1 space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
              <div className="space-y-1">
                <h1 className="text-3xl font-serif font-medium text-slate-900">
                  {categoriaActualNombre || "Toda la Colección"}
                </h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{totalProductos} Piezas Disponibles</p>
              </div>

              <form action="/tienda/catalogo" className="w-full md:w-auto relative group">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-[#864d2d] transition-colors" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar en el atelier..."
                  className="w-full md:w-96 bg-slate-50 border border-slate-200 rounded-2xl px-12 py-3.5 text-sm focus:bg-white focus:border-[#e6dad1] focus:ring-4 focus:ring-[#864d2d]/10 transition-all outline-none"
                />
              </form>
            </div>

            {productos.length === 0 ? (
              <div className="py-32 text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="text-6xl opacity-10 grayscale">🛍️</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-medium text-slate-900">No encontramos coincidencias</h3>
                  <p className="text-slate-500 font-light">Intenta con otros términos o explora todas las categorías.</p>
                </div>
                <Link
                  href="/tienda/catalogo"
                  className="inline-block bg-[#3f2f2f] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-[#864d2d] transition-all shadow-xl hover:shadow-[#864d2d]/30"
                >
                  Ver Todo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
                {productos.map((p, idx) => (
                  <div key={p.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 50}ms` }}>
                    {/* Nota: ProductoCard usa Link href="/catalogo/[slug]". Deberemos actualizar ProductoCard para que use "/tienda/[slug]" */}
                    <ProductoCard producto={p} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center pt-16 border-t border-slate-50">
              <Pagination totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div >
  );
}
