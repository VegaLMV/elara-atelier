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
      nombreCampana, 
      descripcion, 
      tipo, 
      valor, 
      startsAt, 
      endsAt, 
      productoIds,
      estado 
    } = body;

    const referencia = await prisma.descuentoProducto.findUnique({
      where: { id },
      select: { nombreCampana: true, estado: true }
    });

    if (!referencia) return new NextResponse("Campaña no encontrada", { status: 404 });
    

    const now = new Date();
    if (referencia.estado === 'FINALIZADO') {
         return new NextResponse("No se puede editar una campaña finalizada.", { status: 400 });
    }

    // 2. Definir fechas
    const fechaInicio = new Date(startsAt);
    const fechaFin = new Date(endsAt);
    fechaFin.setHours(23, 59, 59, 999);

    const esActivaAhora = (
        (estado === 'ACTIVO' || referencia.estado === 'ACTIVO' || referencia.estado === 'PROGRAMADO') &&
        now >= fechaInicio && 
        now <= fechaFin
    );

    const nuevoEstado = esActivaAhora ? 'ACTIVO' : (now > fechaFin ? 'FINALIZADO' : 'PROGRAMADO');
    // Si estaba cancelada y no se manda explícitamente otro estado, mantenemos cancelado? 
    // El usuario pidió "editar canceladas", asumiremos que al editar NO se reactiva sola a menos que se cambie fechas.
    // Para simplificar: Si editamos, recalculamos el estado lógico según fechas, "reviviéndola" si es necesario.
    
    // 3. Identificar productos a Agregar, Mantener y Eliminar
    const descuentosExistentes = await prisma.descuentoProducto.findMany({
      where: { nombreCampana: referencia.nombreCampana },
      select: { id: true, productoId: true }
    });

    const idsExistentes = descuentosExistentes.map(d => d.productoId);
    const idsNuevos = productoIds as string[];

    const aAgregar = idsNuevos.filter(id => !idsExistentes.includes(id));
    const aEliminar = descuentosExistentes.filter(d => !idsNuevos.includes(d.productoId));
    const aActualizarIds = descuentosExistentes
        .filter(d => idsNuevos.includes(d.productoId))
        .map(d => d.id);

    // --- TRANSACCIÓN PRINCIPAL ---
    await prisma.$transaction(async (tx) => {
        
        // A. ELIMINAR (Quitar productos de la campaña)
        if (aEliminar.length > 0) {
            // 1. Borrar registros de descuento
            await tx.descuentoProducto.deleteMany({
                where: { id: { in: aEliminar.map(d => d.id) } }
            });
            
            // 2. Limpiar productos (Si la campaña estaba activa, hay que quitarles la etiqueta YA)
            await tx.producto.updateMany({
                where: { id: { in: aEliminar.map(d => d.productoId) } },
                data: {
                    descuentoActivo: false,
                    descuentoTipo: null,
                    descuentoValor: null,
                    descuentoInicio: null,
                    descuentoFin: null,
                    descuentoActualId: null
                }
            });
        }

        // B. ACTUALIZAR (Productos que se quedan)
        if (aActualizarIds.length > 0) {
            await tx.descuentoProducto.updateMany({
                where: { id: { in: aActualizarIds } },
                data: {
                    nombreCampana,
                    descripcion,
                    tipo,
                    valor: Number(valor),
                    startsAt: fechaInicio,
                    endsAt: fechaFin,
                    estado: nuevoEstado // Actualizamos estado por si cambiaron fechas
                }
            });

            // Si es activa, actualizar la data en el producto
            if (nuevoEstado === 'ACTIVO') {
                await tx.producto.updateMany({
                    where: { id: { in: idsExistentes.filter(id => idsNuevos.includes(id)) } },
                    data: {
                        descuentoActivo: true,
                        descuentoTipo: tipo,
                        descuentoValor: Number(valor),
                        descuentoInicio: fechaInicio,
                        descuentoFin: fechaFin
                    }
                });
            } else {
                // Si dejó de ser activa (p.ej. se movió a futuro), apagar flags
                await tx.producto.updateMany({
                     where: { id: { in: idsExistentes.filter(id => idsNuevos.includes(id)) } },
                     data: { descuentoActivo: false }
                });
            }
        }

        // C. AGREGAR (Nuevos productos a la campaña)
        if (aAgregar.length > 0) {
             // Crear descuentos
             await tx.descuentoProducto.createMany({
                 data: aAgregar.map(prodId => ({
                     productoId: prodId,
                     nombreCampana,
                     descripcion,
                     tipo,
                     valor: Number(valor),
                     startsAt: fechaInicio,
                     endsAt: fechaFin,
                     estado: nuevoEstado,
                     creadoPorId: (admin as any).id
                 }))
             });

             // Si es activa, encender flags en los nuevos productos
             if (nuevoEstado === 'ACTIVO') {
                 await tx.producto.updateMany({
                     where: { id: { in: aAgregar } },
                     data: {
                         descuentoActivo: true,
                         descuentoTipo: tipo,
                         descuentoValor: Number(valor),
                         descuentoInicio: fechaInicio,
                         descuentoFin: fechaFin
                     }
                 });
             }
        }
    });

    return NextResponse.json({ success: true, mensaje: "Campaña actualizada correctamente" });

  } catch (error) {
    console.error("Error al editar campaña:", error);
    return new NextResponse("Error interno al editar", { status: 500 });
  }
}