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

    // --- 2. Lógica de Fechas ---
    const fechaInicio = new Date(startsAt);
    const fechaFin = new Date(endsAt);
    fechaFin.setHours(23, 59, 59, 999);

    const hoySinHora = new Date();
    hoySinHora.setHours(0, 0, 0, 0);
    const inicioCheck = new Date(startsAt);
    inicioCheck.setHours(0, 0, 0, 0);

    if (inicioCheck < hoySinHora) {
      return NextResponse.json({ error: "⚠️ No puedes crear una campaña con fecha de inicio en el pasado." }, { status: 400 });
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
      const fInicio = new Date(c.startsAt).toLocaleDateString();
      const fFin = new Date(c.endsAt).toLocaleDateString();

      return NextResponse.json({
        error: `⚠️ CONFLICTO: El producto "${p.nombre}" ya está en la campaña "${c.nombre}" (${c.estado}) del ${fInicio} al ${fFin}.`
      }, { status: 409 });
    }

    // --- 5. Determinar Estado Inicial ---
    const now = new Date();
    let estadoInicial = "PROGRAMADO";
    if (now >= fechaInicio && now <= fechaFin) estadoInicial = "ACTIVO";

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