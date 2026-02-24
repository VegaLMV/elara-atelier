export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/sync-descuentos
 *
 * Endpoint llamado periódicamente por cron-job.org (o similar).
 * Sincroniza los estados de las campañas de descuento:
 *   PROGRAMADO → ACTIVO  (cuando startsAt <= ahora)
 *   ACTIVO     → FINALIZADO (cuando endsAt <= ahora)
 *
 * Seguridad: requiere header  Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
    // ── 1. Validación del secreto ──────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();

    // ── 2. ACTIVAR: PROGRAMADO → ACTIVO ───────────────────────────────────
    // Campañas que ya comenzaron pero siguen como PROGRAMADO.
    // También actualiza los campos de descuento en los productos vinculados.
    const campanasParaActivar = await prisma.campana.findMany({
        where: {
            estado: "PROGRAMADO",
            startsAt: { lte: now },
            endsAt: { gte: now },
        },
        include: { detalles: true },
    });

    for (const campana of campanasParaActivar) {
        const productoIds = campana.detalles.map((d) => d.productoId);

        await prisma.$transaction([
            prisma.campana.update({
                where: { id: campana.id },
                data: { estado: "ACTIVO" },
            }),
            ...(productoIds.length > 0
                ? [
                    prisma.producto.updateMany({
                        where: { id: { in: productoIds } },
                        data: {
                            descuentoActivo: true,
                            descuentoTipo: campana.tipo,
                            descuentoValor: Number(campana.valor),
                            descuentoInicio: campana.startsAt,
                            descuentoFin: campana.endsAt,
                        },
                    }),
                ]
                : []),
        ]);
    }

    // ── 3. FINALIZAR: ACTIVO → FINALIZADO ─────────────────────────────────
    // Campañas que ya vencieron pero siguen como ACTIVO.
    // Limpia los campos de descuento en los productos vinculados.
    const campanasParaFinalizar = await prisma.campana.findMany({
        where: {
            estado: "ACTIVO",
            endsAt: { lt: now },
        },
        include: { detalles: true },
    });

    for (const campana of campanasParaFinalizar) {
        const productoIds = campana.detalles.map((d) => d.productoId);

        await prisma.$transaction([
            prisma.campana.update({
                where: { id: campana.id },
                data: { estado: "FINALIZADO" },
            }),
            ...(productoIds.length > 0
                ? [
                    prisma.producto.updateMany({
                        where: { id: { in: productoIds }, descuentoActivo: true },
                        data: {
                            descuentoActivo: false,
                            descuentoTipo: null,
                            descuentoValor: null,
                            descuentoInicio: null,
                            descuentoFin: null,
                        },
                    }),
                ]
                : []),
        ]);
    }

    // ── 4. Respuesta ───────────────────────────────────────────────────────
    return NextResponse.json({
        ok: true,
        ejecutadoEn: now.toISOString(),
        activadas: campanasParaActivar.length,
        finalizadas: campanasParaFinalizar.length,
    });
}
