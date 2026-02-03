export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Formateador de moneda local
function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

// Cálculo del precio con descuento
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

  // 1. Construir el filtro de búsqueda
  const where: Prisma.ProductoWhereInput = {
    estado: "ACTIVO", // Solo productos visibles
  };

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { descripcion: { contains: q, mode: "insensitive" } },
    ];
  }

  if (categoriaSlug) {
    where.categoria = { slug: categoriaSlug };
  }

  // 2. Ejecutar consultas en paralelo (Productos y Categorías)
  const [productosRaw, categorias] = await Promise.all([
    prisma.producto.findMany({
      where,
      include: {
        categoria: true,
        imagenes: { orderBy: { esPortada: "desc" }, take: 1 },
      },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      where: { productos: { some: { estado: "ACTIVO" } } } // Solo categorías con productos activos
    }),
  ]);

  // 3. Procesar datos para la UI
  const ahora = new Date();
  const productos = productosRaw.map((p) => {
    const precioOriginal = Number(p.precio);
    
    // Verificar si el descuento es vigente
    const tieneDescuento = 
      p.descuentoActivo && 
      (!p.descuentoInicio || p.descuentoInicio <= ahora) && 
      (!p.descuentoFin || p.descuentoFin >= ahora);

    const precioFinal = tieneDescuento 
      ? calcularPrecioFinal(precioOriginal, p.descuentoTipo, Number(p.descuentoValor))
      : precioOriginal;

    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      categoria: p.categoria?.nombre,
      imagen: p.imagenes[0]?.url,
      precioOriginal,
      precioFinal,
      tieneDescuento,
      porcentaje: p.descuentoTipo === 'PORCENTAJE' ? Number(p.descuentoValor) : null
    };
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Hero / Header del Catálogo */}
      <section className="bg-slate-50 py-12 md:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-slate-900 mb-4 tracking-tight">
            Nuestra Colección
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-light text-lg">
            Piezas exclusivas diseñadas para resaltar tu esencia. Calidad artesanal y estilo atemporal en cada detalle.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar de Filtros */}
          <aside className="lg:w-64 shrink-0 space-y-10">
            {/* Buscador */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscar</h3>
              <form action="/catalogo" className="relative">
                <input 
                  name="q"
                  defaultValue={q}
                  placeholder="¿Qué buscas hoy?"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-200 transition-all outline-none"
                />
                <button className="absolute right-3 top-3 text-slate-300">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </button>
              </form>
            </div>

            {/* Categorías */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categorías</h3>
              <div className="flex flex-col gap-2">
                <Link 
                  href="/catalogo"
                  className={`text-sm py-1 transition-colors ${!categoriaSlug ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Todas las piezas
                </Link>
                {categorias.map(cat => (
                  <Link 
                    key={cat.id}
                    href={`/catalogo?categoria=${cat.slug}`}
                    className={`text-sm py-1 transition-colors ${categoriaSlug === cat.slug ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {cat.nombre}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Grilla de Productos */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
               <p className="text-slate-400 text-sm font-light">
                  Mostrando <span className="text-slate-900 font-medium">{productos.length}</span> resultados
               </p>
            </div>

            {productos.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                 <div className="text-5xl opacity-10">✨</div>
                 <h2 className="text-xl font-medium text-slate-800">No encontramos lo que buscas</h2>
                 <p className="text-slate-400">Intenta ajustando los filtros o buscando otro término.</p>
                 <Link href="/catalogo" className="inline-block text-slate-900 underline underline-offset-4 font-medium pt-4">
                    Limpiar todos los filtros
                 </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {productos.map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/catalogo/${p.slug}`}
                    className="group flex flex-col h-full"
                  >
                    {/* Imagen con Aspect Ratio Fijo */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 rounded-2xl mb-4 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200">
                      {p.imagen ? (
                        <img 
                          src={p.imagen} 
                          alt={p.nombre}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Sin imagen</div>
                      )}
                      
                      {/* Badges de Oferta */}
                      {p.tieneDescuento && (
                        <div className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                          OFERTA {p.porcentaje ? `-${p.porcentaje}%` : ''}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{p.categoria}</span>
                      <h2 className="text-slate-800 font-serif text-lg group-hover:text-slate-500 transition-colors leading-tight">
                        {p.nombre}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-900 font-bold">
                          {soles(p.precioFinal)}
                        </span>
                        {p.tieneDescuento && (
                          <span className="text-slate-300 text-sm line-through decoration-slate-300/50">
                            {soles(p.precioOriginal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer Simple para el catálogo */}
      <footer className="py-20 border-t border-slate-100 text-center">
         <div className="max-w-xs mx-auto space-y-6">
            <h4 className="text-xl font-serif text-slate-900 italic">Elara Atelier</h4>
            <div className="h-px bg-slate-100 w-12 mx-auto"></div>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Inspirando elegancia y autenticidad en cada prenda.
            </p>
         </div>
      </footer>
    </div>
  );
}