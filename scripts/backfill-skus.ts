import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
    console.log("Iniciando backfill de SKUs...");

    const variantsWithoutSku = await prisma.variante.findMany({
        where: {
            sku: null,
        },
        orderBy: {
            id: "asc",
        },
    });

    if (variantsWithoutSku.length === 0) {
        console.log("No hay variantes sin SKU.");
        return;
    }

    console.log(`Encontradas ${variantsWithoutSku.length} variantes sin SKU.`);

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
