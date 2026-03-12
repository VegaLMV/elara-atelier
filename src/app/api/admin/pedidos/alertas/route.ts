import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export async function GET() {
    const admin = await sesionAdmin();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    try {
        const hoy = new Date();
        const limiteUrgencia = new Date(hoy);
        limiteUrgencia.setDate(hoy.getDate() - 3);

        const limiteCritico = new Date(hoy);
        limiteCritico.setDate(hoy.getDate() - 4);

        const [urgentes, criticos] = await Promise.all([
            prisma.pedido.findMany({
                where: {
                    estado: "PENDIENTE",
                    creadoEn: {
                        lte: limiteUrgencia,
                        gt: limiteCritico
                    }
                },
                select: { id: true, codigo: true, creadoEn: true }
            }),
            // Críticos (4 o más días)
            prisma.pedido.findMany({
                where: {
                    estado: "PENDIENTE",
                    creadoEn: {
                        lte: limiteCritico
                    }
                },
                select: { id: true, codigo: true, creadoEn: true }
            })
        ]);

        return NextResponse.json({
            urgentes,
            criticos,
            totalAlertas: urgentes.length + criticos.length
        });
    } catch (error) {
        console.error("Error fetching order alerts:", error);
        return NextResponse.json({ error: "Error al cargar alertas de pedidos" }, { status: 500 });
    }
}
