import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/**
 * TAG de caché para el catálogo de productos.
 * Usado para invalidar la caché masivamente cuando hay cambios.
 */
export const TAG_PRODUCTOS = "productos-publicos";

/**
 * Obtiene los productos activos para el catálogo público con caché de Next.js.
 * En lugar de consultar PostgreSQL en cada visita, se sirve desde el Data Cache.
 */
export const obtenerProductosActivos = unstable_cache(
    async () => {
        return await prisma.producto.findMany({
            where: {
                estado: "ACTIVO",
            },
            include: {
                imagenes: {
                    orderBy: { orden: "asc" },
                },
                categoria: {
                    select: { nombre: true, slug: true },
                },
            },
            orderBy: { creadoEn: "desc" },
        });
    },
    ["productos-activos-list"], // Key interna de la caché
    {
        tags: [TAG_PRODUCTOS],
        revalidate: 3600, // Revalidación suave cada hora como fallback
    }
);

/**
 * Invalida la caché del catálogo.
 * Debe llamarse desde las rutas de administración (POST/PUT/DELETE de productos).
 */
export async function revalidarCatalogo() {
    "use server";
    const { revalidateTag } = require("next/cache");
    revalidateTag(TAG_PRODUCTOS);
}