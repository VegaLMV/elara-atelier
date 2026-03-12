export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const sesion = await obtenerSesion();
    if (!sesion || sesion.rol !== "ADMIN") return new NextResponse("No autorizado", { status: 401 });

    try {
        const { id } = await params;
        const body = await request.json();

        const {
            nombre,
            descripcion,
            tipo,
            valor,
            startsAt,
            endsAt,
            productoIds,
            imagenUrl
        } = body;

        const campanaActual = await prisma.campana.findUnique({
            where: { id },
            include: { detalles: true }
        });

        if (!campanaActual) return new NextResponse("Campaña no encontrada", { status: 404 });
        if (campanaActual.estado === 'FINALIZADO') return NextResponse.json({ error: "No puedes editar una campaña finalizada." }, { status: 400 });
        if (campanaActual.estado === 'CANCELADO') return NextResponse.json({ error: "No puedes editar una campaña cancelada." }, { status: 400 });

        // LÓGICA DE FECHAS (Forzando UTC-5 para Perú)
        const now = new Date();
        const fechaInicio = new Date(`${startsAt}T00:00:00-05:00`);
        const fechaFin = new Date(`${endsAt}T23:59:59-05:00`);

        if (fechaFin < fechaInicio) {
            return NextResponse.json({ error: "La fecha fin debe ser posterior al inicio" }, { status: 400 });
        }

        const hoyLimaStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(now);
        const hoyLimaInicio = new Date(`${hoyLimaStr}T00:00:00-05:00`);

        if (fechaInicio < hoyLimaInicio && campanaActual.estado === 'PROGRAMADO') {
            return NextResponse.json({ error: "La nueva fecha de inicio no puede ser en el pasado." }, { status: 400 });
        }

        const esActivaAhora = (now >= fechaInicio && now <= fechaFin);
        const nuevoEstado = esActivaAhora ? 'ACTIVO' : (now > fechaFin ? 'FINALIZADO' : 'PROGRAMADO');

        const idsNuevos = productoIds as string[];
        const idsActuales = campanaActual.detalles.map(d => d.productoId);
        const productosAAgregar = idsNuevos.filter(id => !idsActuales.includes(id));

        if (productosAAgregar.length > 0) {
            const conflictos = await prisma.campana.findFirst({
                where: {
                    id: { not: id },
                    estado: { in: ["ACTIVO", "PROGRAMADO"] },
                    AND: [
                        { startsAt: { lte: fechaFin } },
                        { endsAt: { gte: fechaInicio } }
                    ],
                    detalles: { some: { productoId: { in: productosAAgregar } } }
                },
                include: { detalles: { include: { producto: true } } }
            });

            if (conflictos) {
                const prodCulpable = conflictos.detalles.find(d => productosAAgregar.includes(d.productoId))?.producto.nombre;
                return NextResponse.json({
                    error: `El producto "${prodCulpable}" ya está en la campaña "${conflictos.nombre}" que se cruza con estas fechas.`
                }, { status: 409 });
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.campana.update({
                where: { id },
                data: {
                    nombre,
                    descripcion,
                    tipo,
                    valor: Number(valor),
                    startsAt: fechaInicio,
                    endsAt: fechaFin,
                    estado: nuevoEstado as any,
                    imagenUrl: imagenUrl || null
                }
            });

            const aEliminar = idsActuales.filter(oldId => !idsNuevos.includes(oldId));
            if (aEliminar.length > 0) {
                await tx.descuentoProducto.deleteMany({
                    where: { campanaId: id, productoId: { in: aEliminar } }
                });
                await tx.producto.updateMany({
                    where: { id: { in: aEliminar } },
                    data: {
                        descuentoActivo: false,
                        descuentoTipo: null,
                        descuentoValor: null,
                        descuentoInicio: null,
                        descuentoFin: null
                    }
                });
            }

            if (productosAAgregar.length > 0) {
                await tx.descuentoProducto.createMany({
                    data: productosAAgregar.map(pid => ({
                        campanaId: id,
                        productoId: pid
                    }))
                });
            }

            if (nuevoEstado === 'ACTIVO') {
                await tx.producto.updateMany({
                    where: { id: { in: idsNuevos } },
                    data: {
                        descuentoActivo: true,
                        descuentoTipo: tipo,
                        descuentoValor: Number(valor),
                        descuentoInicio: fechaInicio,
                        descuentoFin: fechaFin
                    }
                });
            } else {
                await tx.producto.updateMany({
                    where: { id: { in: idsNuevos } },
                    data: { descuentoActivo: false }
                });
            }
        });

        return NextResponse.json({ success: true, mensaje: "Campaña actualizada correctamente" });
    } catch (error) {
        console.error("Error al editar campaña:", error);
        return NextResponse.json({ error: "Error interno al procesar la edición" }, { status: 500 });
    }
}