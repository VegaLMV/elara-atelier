import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      nombreCampana, descripcion, tipo, valor, startsAt, endsAt, productoIds, estado 
    } = body;

    const referencia = await prisma.descuentoProducto.findUnique({
      where: { id },
      select: { nombreCampana: true, estado: true }
    });

    if (!referencia) return new NextResponse("Campaña no encontrada", { status: 404 });
    if (referencia.estado === 'FINALIZADO') {
         return new NextResponse("⚠️ No puedes editar una campaña que ya finalizó.", { status: 400 });
    }

    // Validar fechas
    const hoySinHora = new Date();
    hoySinHora.setHours(0, 0, 0, 0);
    const inicioCheck = new Date(startsAt);
    inicioCheck.setHours(0,0,0,0);

    if (inicioCheck < hoySinHora) {
        return new NextResponse("⚠️ La nueva fecha de inicio no puede ser en el pasado.", { status: 400 });
    }

    const now = new Date();
    const fechaInicio = new Date(startsAt);
    const fechaFin = new Date(endsAt);
    fechaFin.setHours(23, 59, 59, 999);

    const esActivaAhora = (
        (estado === 'ACTIVO' || referencia.estado === 'ACTIVO' || referencia.estado === 'PROGRAMADO') &&
        now >= fechaInicio && now <= fechaFin
    );
    const nuevoEstado = esActivaAhora ? 'ACTIVO' : (now > fechaFin ? 'FINALIZADO' : 'PROGRAMADO');

    // Identificar productos nuevos o mantenidos
    const idsNuevos = productoIds as string[];

    // 🛡️ ALERTA DE CONFLICTO EN EDICIÓN
    // Buscamos si alguno de los productos (idsNuevos) choca con OTRA campaña activa
    const conflictos = await prisma.descuentoProducto.findMany({
      where: {
        productoId: { in: idsNuevos },
        nombreCampana: { not: referencia.nombreCampana }, // IMPORTANTE: Excluir la campaña actual
        estado: { in: ["ACTIVO", "PROGRAMADO"] },
        AND: [
          { startsAt: { lte: fechaFin } },
          { endsAt: { gte: fechaInicio } }
        ]
      },
      select: {
        producto: { select: { nombre: true } },
        nombreCampana: true,
        startsAt: true,
        endsAt: true
      },
      take: 1
    });

    if (conflictos.length > 0) {
      const c = conflictos[0];
      const fInicio = new Date(c.startsAt).toLocaleDateString();
      const fFin = new Date(c.endsAt).toLocaleDateString();
      return NextResponse.json({ 
        error: `⚠️ CONFLICTO: El producto "${c.producto.nombre}" ya está en OTRA campaña ("${c.nombreCampana}") del ${fInicio} al ${fFin}. Quítalo de esa campaña primero.` 
      }, { status: 409 });
    }

    // --- Lógica de Actualización (Sin cambios, solo la alerta previa) ---
    const descuentosExistentes = await prisma.descuentoProducto.findMany({
      where: { nombreCampana: referencia.nombreCampana, estado: { not: 'CANCELADO' } },
      select: { id: true, productoId: true }
    });
    const idsExistentes = descuentosExistentes.map(d => d.productoId);
    
    const aAgregar = idsNuevos.filter(id => !idsExistentes.includes(id));
    const aEliminar = descuentosExistentes.filter(d => !idsNuevos.includes(d.productoId));
    const aActualizarIds = descuentosExistentes.filter(d => idsNuevos.includes(d.productoId)).map(d => d.id);

    await prisma.$transaction(async (tx) => {
        // A. CANCELAR (Soft Delete)
        if (aEliminar.length > 0) {
            await tx.descuentoProducto.updateMany({
                where: { id: { in: aEliminar.map(d => d.id) } },
                data: { estado: 'CANCELADO' }
            });
            await tx.producto.updateMany({
                where: { id: { in: aEliminar.map(d => d.productoId) } },
                data: { descuentoActivo: false, descuentoActualId: null }
            });
        }
        // B. ACTUALIZAR
        if (aActualizarIds.length > 0) {
            await tx.descuentoProducto.updateMany({
                where: { id: { in: aActualizarIds } },
                data: {
                    nombreCampana, descripcion, tipo, valor: Number(valor),
                    startsAt: fechaInicio, endsAt: fechaFin, estado: nuevoEstado 
                }
            });
            // Update flags en productos si es activo
            if (nuevoEstado === 'ACTIVO') {
                await tx.producto.updateMany({
                    where: { id: { in: idsExistentes.filter(id => idsNuevos.includes(id)) } },
                    data: { descuentoActivo: true, descuentoTipo: tipo, descuentoValor: Number(valor), descuentoInicio: fechaInicio, descuentoFin: fechaFin }
                });
            } else {
                await tx.producto.updateMany({
                     where: { id: { in: idsExistentes.filter(id => idsNuevos.includes(id)) } },
                     data: { descuentoActivo: false }
                });
            }
        }
        // C. AGREGAR
        if (aAgregar.length > 0) {
             await tx.descuentoProducto.createMany({
                 data: aAgregar.map(prodId => ({
                     productoId: prodId, nombreCampana, descripcion, tipo, valor: Number(valor),
                     startsAt: fechaInicio, endsAt: fechaFin, estado: nuevoEstado, creadoPorId: (admin as any).id
                 }))
             });
             if (nuevoEstado === 'ACTIVO') {
                 await tx.producto.updateMany({
                     where: { id: { in: aAgregar } },
                     data: { descuentoActivo: true, descuentoTipo: tipo, descuentoValor: Number(valor), descuentoInicio: fechaInicio, descuentoFin: fechaFin }
                 });
             }
        }
    });

    return NextResponse.json({ success: true, mensaje: "Campaña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    return new NextResponse("Error interno", { status: 500 });
  }
}