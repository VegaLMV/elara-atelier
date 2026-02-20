import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Update multiple orders at once
 */
export async function PATCH(req: Request) {
    try {
        const { ids, estado } = await req.json();

        if (!ids || !Array.isArray(ids) || !estado) {
            return NextResponse.json({ error: "IDs y estado requeridos" }, { status: 400 });
        }

        const result = await prisma.pedido.updateMany({
            where: {
                id: { in: ids }
            },
            data: { estado }
        });

        return NextResponse.json({
            success: true,
            count: result.count
        });

    } catch (error) {
        console.error("Error batch updating pedidos:", error);
        return NextResponse.json({ error: "Error en la actualización masiva" }, { status: 500 });
    }
}
