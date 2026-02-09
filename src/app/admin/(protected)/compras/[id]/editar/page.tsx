import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";
import { notFound, redirect } from "next/navigation";
import CompraForm from "../../nueva/compra-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>
};

/**
 * ============================================================================
 * PÁGINA: EDITAR COMPRA EXISTENTE
 * ============================================================================
 * Carga la compra actual y datos maestros para permitir correcciones.
 */
export default async function EditarCompraPage({ params }: Props) {
    const admin = await sesionAdmin();
    if (!admin) redirect("/admin/login");

    const { id } = await params;
    if (!id) return notFound();

    // 1. Obtener Compra y Datos Maestros en paralelo
    const [compraDB, proveedoresDB, productosDB, empaquesDB] = await Promise.all([
        prisma.compra.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        variante: { include: { producto: { include: { imagenes: true } }, talla: true, color: true } },
                        tipoEmpaque: true
                    }
                }
            }
        }),
        prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
        prisma.producto.findMany({
            where: { estado: "ACTIVO" },
            orderBy: { nombre: "asc" },
            include: {
                imagenes: { select: { url: true, esPortada: true }, orderBy: { esPortada: 'desc' }, take: 1 },
                imagenesColor: { select: { url: true, colorId: true } },
                variantes: {
                    include: { talla: true, color: true },
                    orderBy: [{ talla: { orden: 'asc' } }]
                },
            },
        }),
        prisma.tipoEmpaque.findMany({
            where: { activo: true },
            orderBy: { nombre: "asc" },
            select: { id: true, nombre: true, stock: true, costoUnitario: true, imagenUrl: true }
        })
    ]);

    if (!compraDB) return notFound();

    // 2. Normalizar Datos (Decimal -> Number)
    const productosProcesados = productosDB.map(p => ({
        ...p,
        precio: Number(p.precio),
        descuentoValor: p.descuentoValor ? Number(p.descuentoValor) : 0,
        proveedorSugerido: null,
        variantes: p.variantes.map(v => ({
            ...v,
            color: { ...v.color, hex: v.color.hex }
        }))
    }));

    const empaquesProcesados = empaquesDB.map(e => ({
        ...e,
        costoUnitario: Number(e.costoUnitario)
    }));

    const editData = {
        id: compraDB.id,
        proveedorId: compraDB.proveedorId ?? "",
        fechaCompra: compraDB.fechaCompra.toISOString().split('T')[0],
        notas: compraDB.notas ?? "",
        costoEnvio: compraDB.costoEnvio?.toString() ?? "",
        otrosCostos: compraDB.otrosCostos?.toString() ?? "",
        items: compraDB.items.map(it => {
            let titulo = "";
            let hexColor = null;
            let imagenUrl = null;
            let precioVenta = undefined;

            if (it.variante) {
                titulo = `${it.variante.producto.nombre} · ${it.variante.talla.nombre} · ${it.variante.color.nombre}`;
                hexColor = it.variante.color.hex;
                imagenUrl = it.variante.producto.imagenes[0]?.url || null;
                precioVenta = it.variante.producto.precio.toString();
            } else if (it.tipoEmpaque) {
                titulo = `📦 ${it.tipoEmpaque.nombre}`;
                imagenUrl = it.tipoEmpaque.imagenUrl;
            }

            return {
                id: it.varianteId || it.tipoEmpaqueId || "",
                tipo: it.varianteId ? "PRODUCTO" as const : "EMPAQUE" as const,
                titulo,
                stockActual: it.variante?.stockActual ?? it.tipoEmpaque?.stock ?? 0,
                cantidad: it.cantidad,
                costoUnitario: it.costoUnitario.toString(),
                precioVenta,
                imagenUrl,
                hexColor
            };
        })
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-8 bg-gray-50/50 min-h-screen">

            {/* Header */}
            <div className="mb-8 border-b border-gray-200 pb-6 flex items-center gap-4">
                <Link
                    href={`/admin/compras/${id}`}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Editar Compra</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Realiza ajustes en la compra registrada.
                    </p>
                </div>
            </div>

            <CompraForm
                proveedores={proveedoresDB}
                productos={productosProcesados}
                empaques={empaquesProcesados}
                editData={editData}
            />
        </div>
    );
}
