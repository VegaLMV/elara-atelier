import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { redirect } from "next/navigation";
import PosClient from "./pos-client";

export const dynamic = "force-dynamic";

// Recibimos searchParams para leer ?clienteId=...
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function NuevaVentaPage({ searchParams }: Props) {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  // Leer ID del cliente si viene en la URL
  const sp = await searchParams;
  const prefillClienteId = typeof sp.clienteId === 'string' ? sp.clienteId : undefined;

  // Cargar datos
  const [categorias, productos, clientes, tiposEmpaque] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
    prisma.producto.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true, nombre: true, precio: true, categoriaId: true,
        descuentoActivo: true, descuentoTipo: true, descuentoValor: true,
        imagenes: { where: { esPortada: true }, take: 1, select: { url: true } },
        variantes: {
          where: { activa: true },
          select: { id: true, talla: { select: { nombre: true } }, color: { select: { nombre: true, hex: true } }, stockActual: true, sku: true }
        }
      },
      orderBy: { nombre: 'asc' }
    }),
    prisma.cliente.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true, dni: true } }),
    prisma.tipoEmpaque.findMany({
        where: { activo: true, stock: { gt: 0 } },
        select: { id: true, nombre: true, costoUnitario: true, stock: true }
    })
  ]);

  // Formatear Decimales
  const empaquesFormateados = tiposEmpaque.map(e => ({
      ...e, costoUnitario: Number(e.costoUnitario)
  }));

  const productosFormateados = productos.map(p => {
     const stockTotal = p.variantes.reduce((acc, v) => acc + v.stockActual, 0);
     let precioFinal = Number(p.precio);
     
     if (p.descuentoActivo && p.descuentoValor) {
        if (p.descuentoTipo === 'PORCENTAJE') {
           precioFinal = precioFinal - (precioFinal * (Number(p.descuentoValor) / 100));
        } else {
           precioFinal = precioFinal - Number(p.descuentoValor);
        }
     }

     return {
       ...p,
       precio: Number(p.precio),
       descuentoValor: p.descuentoValor ? Number(p.descuentoValor) : 0,
       stockTotal,
       precioFinal,
       imagen: p.imagenes[0]?.url || "/placeholder.png"
     };
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-100 overflow-hidden">
       <PosClient 
          productosIniciales={productosFormateados} 
          categorias={categorias}
          clientes={clientes}
          tiposEmpaque={empaquesFormateados}
          vendedorId={(admin as any).id}
          // Pasamos el cliente pre-seleccionado
          initialClienteId={prefillClienteId} 
       />
    </div>
  );
}