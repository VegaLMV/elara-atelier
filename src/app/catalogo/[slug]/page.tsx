export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoDetalle from "./producto-detalle";
import Link from "next/link";

// Cálculo del precio con descuento (idéntico al catálogo para consistencia)
function calcularPrecioFinal(precio: number, tipo: string | null, valor: number | null) {
  if (!tipo || !valor) return precio;
  if (tipo === "PORCENTAJE") return precio * (1 - valor / 100);
  return Math.max(0, precio - valor);
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Cargar producto con todas sus relaciones necesarias para el cliente
  const producto = await prisma.producto.findUnique({
    where: { slug },
    include: {
      categoria: true,
      imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }] },
      variantes: {
        where: { activa: true },
        include: { talla: true, color: true },
      },
    },
  });

  if (!producto || producto.estado === "INACTIVO") return notFound();

  // 2. Procesar descuento vigente
  const ahora = new Date();
  const tieneDescuento = 
    producto.descuentoActivo && 
    (!producto.descuentoInicio || producto.descuentoInicio <= ahora) && 
    (!producto.descuentoFin || producto.descuentoFin >= ahora);

  const precioOriginal = Number(producto.precio);
  const precioFinal = tieneDescuento 
    ? calcularPrecioFinal(precioOriginal, producto.descuentoTipo, Number(producto.descuentoValor))
    : precioOriginal;

  // 3. Preparar datos para el Componente de Cliente
  const data = {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    categoria: producto.categoria?.nombre || "Colección",
    categoriaSlug: producto.categoria?.slug,
    precioOriginal,
    precioFinal,
    tieneDescuento,
    descuentoTag: producto.descuentoTipo === 'PORCENTAJE' ? `-${producto.descuentoValor}%` : 'OFERTA',
    imagenes: producto.imagenes.map(img => img.url),
    variantes: producto.variantes.map(v => ({
      id: v.id,
      talla: v.talla.nombre,
      color: v.color.nombre,
      hex: v.color.hex,
      stock: v.stockActual
    }))
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs minimalistas */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
        <Link href="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-slate-900 transition-colors">Catálogo</Link>
        {data.categoriaSlug && (
          <>
            <span>/</span>
            <Link href={`/catalogo?categoria=${data.categoriaSlug}`} className="hover:text-slate-900 transition-colors">
              {data.categoria}
            </Link>
          </>
        )}
        <span className="hidden md:inline">/</span>
        <span className="text-slate-900 font-bold hidden md:inline truncate max-w-[200px]">{data.nombre}</span>
      </nav>

      {/* Componente Interactivo */}
      <ProductoDetalle producto={data} />

      {/* Sección de Compromiso Elara */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-3">
             <div className="text-2xl">✨</div>
             <h4 className="text-sm font-serif italic text-slate-900">Diseño Exclusivo</h4>
             <p className="text-xs text-slate-400 font-light leading-relaxed px-10">
               Cada prenda de Elara Atelier es confeccionada bajo estándares de alta costura.
             </p>
          </div>
          <div className="space-y-3">
             <div className="text-2xl">🌿</div>
             <h4 className="text-sm font-serif italic text-slate-900">Materiales Premium</h4>
             <p className="text-xs text-slate-400 font-light leading-relaxed px-10">
               Seleccionamos las mejores fibras para asegurar durabilidad y confort excepcional.
             </p>
          </div>
          <div className="space-y-3">
             <div className="text-2xl">🤝</div>
             <h4 className="text-sm font-serif italic text-slate-900">Atención Personalizada</h4>
             <p className="text-xs text-slate-400 font-light leading-relaxed px-10">
               Nuestras asesoras te acompañarán en cada paso de tu compra.
             </p>
          </div>
        </div>
      </section>
    </div>
  );
}