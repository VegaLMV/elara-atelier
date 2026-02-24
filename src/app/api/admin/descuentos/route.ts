export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

/**
 * NOTA: La sincronización automática (GET) ha sido movida a:
 * /api/cron/sync-descuentos
 * para ser ejecutada por un Cron Job real de forma segura.
 */

/**
 * ============================================================================
 * 2. MÉTODO POST: CREAR CAMPAÑA CON ALERTA DE CONFLICTO
 * ============================================================================
 * Crea un registro 'Campana' y vincula los productos seleccionados.
 * Incluye lógica para prevenir superposición de ofertas.
 */
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return new NextResponse("No autorizado", { status: 401 });

  // --- CORRECCIÓN: Extracción segura del ID ---
  const adminId = (sesion as any).id || (sesion as any).sub || null;

  try {
    const body = await request.json();
    const {
      nombre,
      descripcion,
      tipo,
      valor,
      startsAt,
      endsAt,
      aplicarA,
      productoIds,
      categoriaId,
      imagenUrl
    } = body;

    // --- 1. Validaciones Básicas ---
    if (!nombre || !tipo || !valor || !startsAt || !endsAt) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // --- 2. Lógica de Fechas (Perú UTC-5) ---
    const now = new Date();

    // Si el usuario elige "2026-02-25", queremos que inicie a las 00:00 de Perú.
    // 00:00 Lima = 05:00 UTC.
    const fechaInicio = new Date(`${startsAt}T05:00:00.000Z`);

    // Y queremos que termine a las 23:59:59 de Perú del día seleccionado.
    // 23:59:59 Lima = 04:59:59 UTC del día siguiente.
    const fechaFin = new Date(`${endsAt}T04:59:59.999Z`);
    fechaFin.setUTCDate(fechaFin.getUTCDate() + 1);

    // Calcular Estado Inicial anticipadamente para validaciones
    let estadoInicial = "PROGRAMADO";
    if (now >= fechaInicio && now <= fechaFin) estadoInicial = "ACTIVO";

    // Para validación "no pasado", comparamos con el inicio del día hoy en Lima.
    const hoyLima = new Date();
    hoyLima.setUTCHours(5, 0, 0, 0);

    if (fechaInicio < hoyLima && estadoInicial !== "ACTIVO") {
      // Nota: Permitimos iniciar hoy si la hora actual > 05:00 UTC
      if (fechaInicio.getTime() + (24 * 60 * 60 * 1000) < hoyLima.getTime()) {
        return NextResponse.json({ error: "⚠️ No puedes crear una campaña con fecha de inicio en el pasado." }, { status: 400 });
      }
    }

    if (fechaFin < fechaInicio) {
      return NextResponse.json({ error: "⚠️ La fecha de fin no puede ser anterior a la de inicio" }, { status: 400 });
    }

    // --- 3. Identificar Productos Objetivo ---
    let idsObjetivo: string[] = [];

    if (aplicarA === "TODOS") {
      const todos = await prisma.producto.findMany({
        where: { estado: "ACTIVO" },
        select: { id: true }
      });
      idsObjetivo = todos.map(p => p.id);
    } else if (aplicarA === "CATEGORIA" && categoriaId) {
      const deCategoria = await prisma.producto.findMany({
        where: { categoriaId, estado: "ACTIVO" },
        select: { id: true }
      });
      idsObjetivo = deCategoria.map(p => p.id);
    } else if (aplicarA === "SELECCION" && Array.isArray(productoIds)) {
      idsObjetivo = productoIds;
    }

    if (idsObjetivo.length === 0) {
      return NextResponse.json({ error: "No hay productos seleccionados para esta campaña" }, { status: 400 });
    }

    // --- 4. 🛡️ DETECCIÓN DE CONFLICTOS ---
    const conflictos = await prisma.descuentoProducto.findFirst({
      where: {
        productoId: { in: idsObjetivo },
        campana: {
          estado: { in: ["ACTIVO", "PROGRAMADO"] },
          AND: [
            { startsAt: { lte: fechaFin } },
            { endsAt: { gte: fechaInicio } }
          ]
        }
      },
      include: {
        producto: { select: { nombre: true } },
        campana: { select: { nombre: true, startsAt: true, endsAt: true, estado: true } }
      }
    });

    if (conflictos) {
      const c = conflictos.campana;
      const p = conflictos.producto;
      const fmt = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' });
      const fInicio = fmt.format(new Date(c.startsAt));
      const fFin = fmt.format(new Date(c.endsAt));

      return NextResponse.json({
        error: `⚠️ CONFLICTO: El producto "${p.nombre}" ya está en la campaña "${c.nombre}" (${c.estado}) del ${fInicio} al ${fFin}.`
      }, { status: 409 });
    }

    // --- 6. Crear Campaña y Vínculos ---
    const nuevaCampana = await prisma.campana.create({
      data: {
        nombre,
        descripcion,
        tipo,
        valor: Number(valor),
        startsAt: fechaInicio,
        endsAt: fechaFin,
        estado: estadoInicial as any,
        creadorId: adminId,
        imagenUrl: imagenUrl || null,
        detalles: {
          create: idsObjetivo.map((pid: string) => ({
            productoId: pid
          }))
        }
      }
    });

    // --- 7. Activación Instantánea (Si corresponde) ---
    if (estadoInicial === "ACTIVO") {
      await prisma.producto.updateMany({
        where: { id: { in: idsObjetivo } },
        data: {
          descuentoActivo: true,
          descuentoTipo: tipo,
          descuentoValor: Number(valor),
          descuentoInicio: fechaInicio,
          descuentoFin: fechaFin
        }
      });
    }

    return NextResponse.json({ success: true, mensaje: "Campaña creada correctamente", data: nuevaCampana });

  } catch (error) {
    console.error("Error creando campaña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}