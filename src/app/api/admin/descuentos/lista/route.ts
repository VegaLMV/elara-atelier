export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function GET() {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    try {
        const campanas = await prisma.campana.findMany({
            where: {
                estado: { in: ["ACTIVO", "PROGRAMADO"] }
            },
            orderBy: { startsAt: "asc" },
            include: {
                detalles: {
                    include: {
                        producto: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true,
                                imagenes: { take: 1, orderBy: { esPortada: "desc" } }
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(campanas);
    } catch (error) {
        console.error("Error listing campaigns:", error);
        return new NextResponse("Error interno", { status: 500 });
    }
}
