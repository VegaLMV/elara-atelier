export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

/**
 * ============================================================================
 * MÉTODO PATCH: EDITAR CAMPAÑA EXISTENTE
 * ============================================================================
 * Actualiza los datos de la Campaña y sincroniza la lista de productos.
 * Maneja inteligentemente la adición y eliminación de productos.
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Verificación de Seguridad
    const sesion = await obtenerSesion();
    if (!sesion || sesion.rol !== "ADMIN") return new NextResponse("No autorizado", { status: 401 });

    try {
        const { id } = await params; // ID de la Campaña
        const body = await request.json();

        // Extraemos campos, usando 'nombre' en lugar de 'nombreCampana' según el nuevo schema
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

        // 2. Verificar existencia y estado
        const campanaActual = await prisma.campana.findUnique({
            where: { id },
            include: { detalles: true }
        });

        if (!campanaActual) return new NextResponse("Campaña no encontrada", { status: 404 });

        if (campanaActual.estado === 'FINALIZADO') {
            return NextResponse.json({ error: "⚠️ No puedes editar una campaña que ya finalizó." }, { status: 400 });
        }
        if (campanaActual.estado === 'CANCELADO') {
            return NextResponse.json({ error: "⚠️ No puedes editar una campaña cancelada." }, { status: 400 });
        }

        // 3. Validación de Fechas
        const hoySinHora = new Date();
        hoySinHora.setHours(0, 0, 0, 0);
        const inicioCheck = new Date(startsAt);
        inicioCheck.setHours(0, 0, 0, 0);

        // Permitimos editar fecha inicio solo si aún no empieza o es hoy
        // Si ya empezó (ayer), no deberíamos dejar cambiar el inicio al futuro lejano sin cuidado, 
        // pero por flexibilidad permitimos si es >= hoy.
        if (inicioCheck < hoySinHora && campanaActual.estado === 'PROGRAMADO') {
            return NextResponse.json({ error: "⚠️ La nueva fecha de inicio no puede ser en el pasado." }, { status: 400 });
        }

        const now = new Date();
        const fechaInicio = new Date(startsAt);
        const fechaFin = new Date(endsAt);
        fechaFin.setHours(23, 59, 59, 999);

        if (fechaFin < fechaInicio) {
            return NextResponse.json({ error: "⚠️ La fecha fin debe ser posterior al inicio" }, { status: 400 });
        }

        // 4. Calcular Nuevo Estado
        // Si la editamos para que empiece hoy, pasa a ACTIVO. Si la posponemos, PROGRAMADO.
        const esActivaAhora = (now >= fechaInicio && now <= fechaFin);
        const nuevoEstado = esActivaAhora ? 'ACTIVO' : (now > fechaFin ? 'FINALIZADO' : 'PROGRAMADO');

        // 5. Identificar Productos (Nuevos vs Viejos)
        const idsNuevos = productoIds as string[]; // Lo que viene del form
        const idsActuales = campanaActual.detalles.map(d => d.productoId);

        // 6. 🛡️ ALERTA DE CONFLICTO (Para productos NUEVOS solamente)
        // No validamos conflicto en productos que YA estaban en esta campaña (sería conflicto con ella misma)
        const productosAAgregar = idsNuevos.filter(id => !idsActuales.includes(id));

        if (productosAAgregar.length > 0) {
            const conflictos = await prisma.campana.findFirst({
                where: {
                    id: { not: id }, // Excluir esta campaña
                    estado: { in: ["ACTIVO", "PROGRAMADO"] },
                    // Que se solape en fechas
                    AND: [
                        { startsAt: { lte: fechaFin } },
                        { endsAt: { gte: fechaInicio } }
                    ],
                    // Y que contenga alguno de los productos nuevos
                    detalles: {
                        some: {
                            productoId: { in: productosAAgregar }
                        }
                    }
                },
                include: { detalles: { include: { producto: true } } }
            });

            if (conflictos) {
                // Buscamos cuál producto fue el culpable para el mensaje
                const prodCulpable = conflictos.detalles.find(d => productosAAgregar.includes(d.productoId))?.producto.nombre;
                return NextResponse.json({
                    error: `⚠️ CONFLICTO: El producto "${prodCulpable}" ya está en la campaña "${conflictos.nombre}" que se cruza con estas fechas.`
                }, { status: 409 });
            }
        }

        // 7. EJECUCIÓN ATÓMICA (Update + Sync Relaciones)
        await prisma.$transaction(async (tx) => {

            // A. Actualizar Cabecera de Campaña
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

            // B. Sincronizar Detalles (Productos)

            // B1. Eliminar los que se quitaron
            const aEliminar = idsActuales.filter(oldId => !idsNuevos.includes(oldId));
            if (aEliminar.length > 0) {
                // Borramos la relación en la tabla intermedia
                await tx.descuentoProducto.deleteMany({
                    where: {
                        campanaId: id,
                        productoId: { in: aEliminar }
                    }
                });
                // Limpiamos el producto (cache)
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

            // B2. Agregar los nuevos
            if (productosAAgregar.length > 0) {
                await tx.descuentoProducto.createMany({
                    data: productosAAgregar.map(pid => ({
                        campanaId: id,
                        productoId: pid
                    }))
                });
            }

            // C. Actualización Masiva de Precios (Caché en Producto)
            // Si la campaña queda ACTIVA, actualizamos TODOS los productos (nuevos y viejos)
            // para asegurar que tengan el nuevo valor/fechas.
            if (nuevoEstado === 'ACTIVO') {
                await tx.producto.updateMany({
                    where: { id: { in: idsNuevos } }, // Todos los seleccionados
                    data: {
                        descuentoActivo: true,
                        descuentoTipo: tipo,
                        descuentoValor: Number(valor),
                        descuentoInicio: fechaInicio,
                        descuentoFin: fechaFin
                    }
                });
            } else {
                // Si pasó a PROGRAMADO (ej. se pospuso), limpiamos todos los productos
                // porque ya no deberían tener descuento activo hoy.
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