export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ProductoCard from "./producto-card"; // <--- IMPORTAMOS EL NUEVO COMPONENTE

// Cálculo de precios (backend)
function calcularPrecioFinal(precio: number, tipo: string | null, valor: number | null) {
  if (!tipo || !valor) return precio;
  if (tipo === "PORCENTAJE") return precio * (1 - valor / 100);
  return Math.max(0, precio - valor);
}

type SP = {
  q?: string;
  categoria?: string;
};

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const categoriaSlug = (sp.categoria ?? "").trim();

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

  const [productosRaw, categorias] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        // MEJORA: Traemos hasta 5 imágenes para el carrusel
        imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }], take: 5 },
      },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      where: { productos: { some: { estado: "ACTIVO" } } }
    }),
  ]);

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
      porcentaje: p.descuentoTipo === 'PORCENTAJE' ? Number(p.descuentoValor) : null
    };
  });

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-slate-50 py-12 md:py-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-900 mb-3 tracking-tight">
            Colección {categoriaSlug ? categorias.find(c => c.slug === categoriaSlug)?.nombre : "Exclusiva"}
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto font-light text-sm md:text-base">
            Piezas diseñadas para resaltar tu esencia con elegancia y confort.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-60 shrink-0 space-y-8">
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscar</h3>
              <form action="/catalogo" className="relative group">
                <input name="q" defaultValue={q} placeholder="Buscar..." className="w-full bg-slate-50 border border-transparent rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:border-slate-200 transition-all outline-none" />
                <button className="absolute right-3 top-2.5 text-slate-300 group-focus-within:text-slate-500">
                   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </form>
            </div>
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorías</h3>
              <div className="flex flex-col gap-1">
                <Link href="/catalogo" className={`text-sm px-3 py-2 rounded-lg transition-colors ${!categoriaSlug ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Ver Todo</Link>
                {categorias.map(cat => (
                  <Link key={cat.id} href={`/catalogo?categoria=${cat.slug}`} className={`text-sm px-3 py-2 rounded-lg transition-colors ${categoriaSlug === cat.slug ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{cat.nombre}</Link>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
               <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{productos.length} Productos</p>
            </div>

            {productos.length === 0 ? (
              <div className="py-20 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-2xl">
                 <div className="text-4xl opacity-20">🛍️</div>
                 <p className="text-slate-500 font-light">No encontramos productos con esos filtros.</p>
                 <Link href="/catalogo" className="text-sm font-bold text-slate-900 underline">Ver todo el catálogo</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {productos.map((p) => (
                  // Usamos el nuevo componente Client-Side
                  <ProductoCard key={p.id} producto={p} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}