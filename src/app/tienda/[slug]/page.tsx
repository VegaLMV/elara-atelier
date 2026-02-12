export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoDetalle from "./producto-detalle";
import Link from "next/link";

function calcularPrecioFinal(precio: number, tipo: string | null, valor: number | null) {
  if (!tipo || !valor) return precio;
  if (tipo === "PORCENTAJE") return precio * (1 - valor / 100);
  return Math.max(0, precio - valor);
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Consulta enriquecida: Incluimos imagenesColor
  const producto = await prisma.producto.findUnique({
    where: { slug },
    include: {
      categoria: true,
      imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }] },
      // MEJORA: Traemos las imágenes asociadas a colores
      imagenesColor: {
        include: { color: true }
      },
      variantes: {
        where: { activa: true },
        include: { talla: true, color: true },
      },
    },
  });

  if (!producto || producto.estado === "INACTIVO") return notFound();

  // 2. Validación de Descuento
  const ahora = new Date();
  const inicioValido = !producto.descuentoInicio || new Date(producto.descuentoInicio) <= ahora;
  const finValido = !producto.descuentoFin || new Date(producto.descuentoFin) >= ahora;

  const tieneDescuento =
    producto.descuentoActivo && inicioValido && finValido;

  const precioOriginal = Number(producto.precio);
  const precioFinal = tieneDescuento
    ? calcularPrecioFinal(precioOriginal, producto.descuentoTipo, Number(producto.descuentoValor))
    : precioOriginal;

  // 2. Fetch de Productos Similares
  const productosSimilaresRaw = await prisma.producto.findMany({
    where: {
      estado: "ACTIVO",
      categoriaId: producto.categoriaId,
      NOT: { id: producto.id }
    },
    take: 8,
    include: {
      categoria: true,
      imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }], take: 1 },
      variantes: { select: { stockActual: true } }
    }
  });

  const productosSimilares = productosSimilaresRaw.map(p => {
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
      categoria: p.categoria?.nombre || "Colección",
      imagenes: p.imagenes.map(i => i.url),
      precioOriginal,
      precioFinal,
      tieneDescuento,
      porcentaje: p.descuentoTipo === 'PORCENTAJE' ? Number(p.descuentoValor) : null,
      esNuevo: p.nuevoHasta ? new Date(p.nuevoHasta) >= ahora : false,
      stock: p.variantes.reduce((acc, v) => acc + v.stockActual, 0),
      destacado: p.destacado
    };
  });

  // 3. Transformación de datos
  const data = {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    categoria: producto.categoria?.nombre || "Colección",
    categoriaSlug: producto.categoria?.slug,
    precioOriginal,
    precioFinal,
    tieneDescuento,
    descuentoTag: producto.descuentoTipo === 'PORCENTAJE' ? `-${producto.descuentoValor}%` : 'SALE',
    imagenes: producto.imagenes.map(img => img.url),
    // MEJORA: Mapeamos las imágenes de color para fácil acceso en el cliente
    imagenesColor: producto.imagenesColor.map(ic => ({
      colorNombre: ic.color.nombre, // Usamos nombre para matchear con el selector
      url: ic.url
    })),
    variantes: producto.variantes.map(v => ({
      id: v.id,
      talla: v.talla.nombre,
      color: v.color.nombre,
      hex: v.color.hex,
      stock: v.stockActual
    })),
    similares: productosSimilares
  };

  return (
    <div className="bg-white min-h-screen">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
        <Link href="/" className="hover:text-slate-900 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/tienda/catalogo" className="hover:text-slate-900 transition-colors">Catálogo</Link>
        {data.categoriaSlug && (
          <>
            <span>/</span>
            <Link href={`/tienda/catalogo?categoria=${data.categoriaSlug}`} className="hover:text-slate-900 transition-colors">
              {data.categoria}
            </Link>
          </>
        )}
      </nav>

      <ProductoDetalle producto={data} />
    </div>
  );
}