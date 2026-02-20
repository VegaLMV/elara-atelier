import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWhatsAppMessage } from "@/lib/parse-whatsapp";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        if (!message) {
            return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
        }

        const parsed = parseWhatsAppMessage(message);
        if (!parsed) {
            return NextResponse.json({ error: "No se pudo interpretar el formato del mensaje. Asegúrate de copiar el mensaje completo de la tienda." }, { status: 400 });
        }

        // 1. Buscar el producto por nombre (insensible a mayúsculas/minúsculas)
        console.log("Parsing: Intentando buscar producto:", parsed.producto);
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
            return NextResponse.json({
                error: `Producto "${parsed.producto}" no encontrado en la base de datos`,
                parsed
            }, { status: 404 });
        }

        // 2. Intentar encontrar la variante exacta (Fuzzy matching)
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

        // 3. Stock Virtual (Es igual al Stock Actual porque ya se bloqueó al crear Pedidos)
        let stockVirtual = varianteEncontrada ? varianteEncontrada.stockActual : 0;

        return NextResponse.json({
            success: true,
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
                stockActual: varianteEncontrada.stockActual,
                stockVirtual: stockVirtual
            } : null,
            posiblesVariantes: producto.variantes.map(v => ({
                id: v.id,
                talla: v.talla.nombre,
                color: v.color.nombre,
                stock: v.stockActual
            }))
        });

    } catch (error) {
        console.error("Error parsing order:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
