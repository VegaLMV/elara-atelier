import { prisma } from "./prisma";

/**
 * Genera el siguiente bloque de SKUs numéricos de 5 dígitos (ej. 10001).
 * Busca el SKU más alto en la base de datos para continuar la secuencia.
 */
export async function generateNextSkus(count: number): Promise<string[]> {
    // 1. Buscar el SKU más alto que sea numérico
    const lastVariant = await prisma.variante.findFirst({
        where: {
            sku: {
                not: null,
            },
        },
        orderBy: {
            sku: "desc",
        },
    });

    let nextNumber = 10000; // Valor inicial si no hay ninguno

    if (lastVariant?.sku) {
        const currentMax = parseInt(lastVariant.sku, 10);
        if (!isNaN(currentMax)) {
            nextNumber = currentMax;
        }
    }

    const skus: string[] = [];
    for (let i = 1; i <= count; i++) {
        const nextVal = nextNumber + i;
        // Aseguramos que sea al menos de 5 dígitos con padding
        skus.push(nextVal.toString().padStart(5, "0"));
    }

    return skus;
}
