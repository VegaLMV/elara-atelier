import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
    console.log("Iniciando backfill de SKUs...");

    // 1. Obtener todas las variantes sin SKU
    const variantsWithoutSku = await prisma.variante.findMany({
        where: {
            sku: null,
        },
        orderBy: {
            creadoEn: "asc",
        },
    });

    if (variantsWithoutSku.length === 0) {
        console.log("No hay variantes sin SKU.");
        return;
    }

    console.log(`Encontradas ${variantsWithoutSku.length} variantes sin SKU.`);

    // 2. Buscar el SKU más alto actual para empezar desde ahí
    const lastVariant = await prisma.variante.findFirst({
        where: {
            sku: { not: null },
        },
        orderBy: {
            sku: "desc",
        },
    });

    let nextNumber = 10000;
    if (lastVariant?.sku) {
        const currentMax = parseInt(lastVariant.sku, 10);
        if (!isNaN(currentMax)) {
            nextNumber = currentMax;
        }
    }

    // 3. Actualizar una por una para asegurar correlación (podría hacerse en lote pero para asegurar secuencia es mejor así)
    for (const variant of variantsWithoutSku) {
        nextNumber++;
        const newSku = nextNumber.toString().padStart(5, "0");
        await prisma.variante.update({
            where: { id: variant.id },
            data: { sku: newSku },
        });
        console.log(`Variante ${variant.id} actualizada con SKU: ${newSku}`);
    }

    console.log("Backfill completado con éxito.");
}

backfill()
    .catch((e) => {
        console.error("Error en backfill:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
