import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWhatsAppMessage } from "@/lib/parse-whatsapp";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        if (!message) {
            return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
        }

        const parsedItems = parseWhatsAppMessage(message);
        if (parsedItems.length === 0) {
            return NextResponse.json({ error: "No se pudo interpretar el formato del mensaje. Asegúrate de copiar el mensaje completo de la tienda." }, { status: 400 });
        }

        const results = [];

        for (const parsed of parsedItems) {
            const producto = await prisma.producto.findFirst({
                where: {
                    nombre: {
                        contains: parsed.producto,
                        mode: 'insensitive'
                    }
                },
                include: {
                    imagenes: {
                        where: { esPortada: true },
                        take: 1
                    },
                    variantes: {
                        include: {
                            talla: true,
                            color: true
                        }
                    }
                }
            });

            if (!producto) {
                results.push({
                    success: false,
                    error: `Producto "${parsed.producto}" no encontrado`,
                    parsed
                });
                continue;
            }

            let varianteEncontrada = null;
            if (parsed.talla && parsed.color) {
                const cleanTalla = parsed.talla.replace(/\s/g, '').toLowerCase();
                const cleanColor = parsed.color.replace(/\s/g, '').toLowerCase();

                varianteEncontrada = producto.variantes.find(v => {
                    const vTalla = v.talla.nombre.replace(/\s/g, '').toLowerCase();
                    const vColor = v.color.nombre.replace(/\s/g, '').toLowerCase();
                    return vTalla === cleanTalla && vColor === cleanColor;
                });
            }

            results.push({
                success: !!varianteEncontrada,
                parsed,
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    imagenes: producto.imagenes
                },
                variante: varianteEncontrada ? {
                    id: varianteEncontrada.id,
                    talla: varianteEncontrada.talla.nombre,
                    color: varianteEncontrada.color.nombre,
                    stockActual: varianteEncontrada.stockActual
                } : null,
                error: !varianteEncontrada ? `No se detectó la Talla/Color para "${producto.nombre}"` : null
            });
        }

        return NextResponse.json({
            success: true,
            items: results
        });

    } catch (error) {
        console.error("Error parsing order:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
