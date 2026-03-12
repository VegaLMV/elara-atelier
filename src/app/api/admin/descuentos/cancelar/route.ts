export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

/**
 * ============================================================================
 * API: CANCELAR CAMPAÑA DE DESCUENTOS
 * ============================================================================
 * Ruta: POST /api/admin/descuentos/cancelar
 * * Funcionalidad:
 * Este endpoint permite detener una campaña de emergencia o por decisión administrativa.
 * Realiza dos acciones atómicas:
 * 1. Marca la entidad 'Campana' como 'CANCELADO'.
 * 2. Revierte (Rollback) los campos de descuento en la tabla 'Producto' para que 
 * los precios vuelvan a su estado original inmediatamente.
 */
export async function POST(req: Request) {
  // --------------------------------------------------------------------------
  // 1. VERIFICACIÓN DE SEGURIDAD
  // --------------------------------------------------------------------------
  const sesion = await obtenerSesion();
  // Solo permitimos a Administradores realizar esta acción crítica
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // Obtenemos el ID de la Campaña (no del producto, sino de la cabecera)
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Falta el ID de la campaña" }, { status: 400 });
    }

    // --------------------------------------------------------------------------
    // 2. VERIFICACIÓN DE EXISTENCIA
    // --------------------------------------------------------------------------
    // Buscamos la campaña y sus detalles para saber qué productos están involucrados
    const campana = await prisma.campana.findUnique({
        where: { id },
        include: { detalles: true }
    });

    if (!campana) {
        return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    // Si ya está cancelada o finalizada, avisamos (opcional, pero buena práctica)
    if (campana.estado === "CANCELADO") {
        return NextResponse.json({ message: "La campaña ya estaba cancelada" });
    }

    // --------------------------------------------------------------------------
    // 3. CAMBIO DE ESTADO (La "muerte" de la campaña)
    // --------------------------------------------------------------------------
    await prisma.campana.update({
      where: { id },
      data: { estado: "CANCELADO" },
    });

    // --------------------------------------------------------------------------
    // 4. ROLLBACK MASIVO (Limpieza de Productos)
    // --------------------------------------------------------------------------
    // Obtenemos los IDs de todos los productos que pertenecían a esta campaña
    const pids = campana.detalles.map(d => d.productoId);

    if (pids.length > 0) {
        // Ejecutamos una actualización masiva en la tabla Producto.
        // CONDICIÓN DE SEGURIDAD: Solo limpiamos si 'descuentoActivo' es true.
        // Esto evita errores raros si el producto ya había sido limpiado manualmente.
        await prisma.producto.updateMany({
            where: { 
                id: { in: pids },
                descuentoActivo: true 
            },
            data: {
                // Devolvemos el producto a su estado "limpio" (precio normal)
                descuentoActivo: false,
                descuentoTipo: null,
                descuentoValor: null,
                descuentoInicio: null,
                descuentoFin: null
            }
        });
    }

    // --------------------------------------------------------------------------
    // 5. RESPUESTA EXITOSA
    // --------------------------------------------------------------------------
    return NextResponse.json({ 
        success: true, 
        message: `Campaña cancelada y ${pids.length} productos revertidos.` 
    });

  } catch (error) {
    console.error("Error crítico al cancelar campaña:", error);
    return NextResponse.json({ error: "Error interno al procesar la cancelación" }, { status: 500 });
  }
}