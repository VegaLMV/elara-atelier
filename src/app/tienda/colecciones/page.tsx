import { prisma } from "@/lib/prisma";
import { getCachedHomeSections } from "@/lib/cache";
import { calcularPrecioFinal } from "@/lib/precios";
import LookbookClient from "./_components/lookbook-client";

export const metadata = {
    title: "Lookbook | Élara Atelier",
    description: "Colecciones exclusivas y curadurías de alta costura contemporánea.",
};

export default async function LookbookPage() {
    const ahora = new Date();

    // 1. Obtener Secciones de Lookbook habilitadas
    const allSections = await getCachedHomeSections();
    const lookSectionsRaw = allSections
        .filter(s => s.type === "SHOP_THE_LOOK" && s.enabled === true)
        .sort((a, b) => a.order - b.order);

    if (lookSectionsRaw.length === 0) {
        return (
            <main className="min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-serif text-[#3f2f2f] mb-4 italic">Próximamente</h1>
                <p className="text-[#3f2f2f]/60 uppercase tracking-widest text-[10px] font-black">
                    Nuestras colecciones están siendo preparadas.
                </p>
            </main>
        );
    }

    // 2. Extraer todos los IDs únicos de productos
    const allProductIds = Array.from(new Set(
        lookSectionsRaw.flatMap(s => {
            const ids = (s.content as any)?.manualProductIds;
            return Array.isArray(ids) ? ids : [];
        })
    ));

    // 3. Traer todos los productos necesarios con sus detalles (¡CORREGIDO!)
    const dbProducts = await prisma.producto.findMany({
        where: {
            id: { in: allProductIds },
            estado: "ACTIVO"
        },
        include: {
            imagenes: { orderBy: [{ esPortada: "desc" }, { orden: "asc" }] },
            imagenesColor: {
                include: { color: true }
            },
            variantes: {
                where: { activa: true },
                include: { talla: true, color: true }
            }
        }
    });

    // 4. Formatear productos
    const formatProduct = (p: any) => {
        const precioOriginal = Number(p.precio || 0);
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
            precioOriginal,
            precioFinal,
            imagenes: p.imagenes.map((img: any) => img.url),
            imagenesColor: p.imagenesColor ? p.imagenesColor.map((ic: any) => ({
                colorNombre: ic.color.nombre,
                url: ic.url
            })) : [],
            variantes: p.variantes.map((v: any) => ({
                id: v.id,
                talla: v.talla ? { nombre: v.talla.nombre } : null,
                color: v.color ? { nombre: v.color.nombre, hex: v.color.hex } : null,
                stockActual: v.stockActual
            }))
        };
    };

    const cleanProducts = dbProducts.map(formatProduct);

    // 5. Mapear productos de vuelta a sus secciones
    const sections = lookSectionsRaw.map(s => {
        const content = s.content as any;
        const sectionProductIds = content?.manualProductIds || [];

        const sectionProducts = sectionProductIds
            .map((id: string) => cleanProducts.find(cp => cp.id === id))
            .filter(Boolean);

        return {
            id: s.id,
            title: content?.title || "Colección sin título",
            subtitle: content?.subtitle || "Atelier Curator",
            description: s.descripcion || null,
            imageUrl: content?.imageUrl || null,
            products: sectionProducts
        };
    });

    return <LookbookClient sections={sections} />;
}