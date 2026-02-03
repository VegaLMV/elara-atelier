import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

// ============================================================================
// 1. MÉTODO GET: Sincronización (Se mantiene igual)
// ============================================================================
export async function GET(request: Request) {
  try {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    const now = new Date();
    
    // A. ACTIVAR
    const campañasParaActivar = await prisma.descuentoProducto.findMany({
      where: { estado: "PROGRAMADO", startsAt: { lte: now }, endsAt: { gte: now } },
    });

    for (const campana of campañasParaActivar) {
      await prisma.descuentoProducto.update({ where: { id: campana.id }, data: { estado: "ACTIVO" } });
      await prisma.producto.update({
        where: { id: campana.productoId },
        data: {
          descuentoActivo: true, descuentoTipo: campana.tipo, descuentoValor: campana.valor,
          descuentoInicio: campana.startsAt, descuentoFin: campana.endsAt, descuentoActualId: campana.id,
        },
      });
    }

    // B. FINALIZAR
    const campañasParaFinalizar = await prisma.descuentoProducto.findMany({
      where: { estado: "ACTIVO", endsAt: { lt: now } },
    });

    for (const campana of campañasParaFinalizar) {
      await prisma.descuentoProducto.update({ where: { id: campana.id }, data: { estado: "FINALIZADO" } });
      const producto = await prisma.producto.findUnique({ where: { id: campana.productoId }, select: { descuentoActualId: true } });

      if (producto?.descuentoActualId === campana.id) {
        await prisma.producto.update({
          where: { id: campana.productoId },
          data: {
            descuentoActivo: false, descuentoTipo: null, descuentoValor: null,
            descuentoInicio: null, descuentoFin: null, descuentoActualId: null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, activadas: campañasParaActivar.length, finalizadas: campañasParaFinalizar.length });
  } catch (error) {
    return new NextResponse("Error en sincronización", { status: 500 });
  }
}

// ============================================================================
// 2. MÉTODO POST: Crear Nueva Campaña con ALERTA DE CONFLICTO
// ============================================================================
export async function POST(request: Request) {
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });
  const creadorId = (admin as any).id || (admin as any).sub;

  try {
    const body = await request.json();
    const { 
      nombreCampana, descripcion, tipo, valor, startsAt, endsAt, aplicarA, productoIds, categoriaId 
    } = body;

    if (!tipo || !valor || !startsAt || !endsAt) {
      return new NextResponse("Faltan datos obligatorios", { status: 400 });
    }

    // 1. Validar Fechas (No pasado)
    const fechaInicio = new Date(startsAt);
    fechaInicio.setUTCHours(5, 0, 0, 0); // Inicio del día en Perú
    const fechaFin = new Date(endsAt);
    fechaFin.setUTCHours(23 + 5, 59, 59, 999); // Fin del día en Perú

    const hoySinHora = new Date();
    hoySinHora.setHours(0, 0, 0, 0);
    const inicioCheck = new Date(startsAt);
    inicioCheck.setHours(0,0,0,0);

    if (inicioCheck < hoySinHora) {
        return new NextResponse("⚠️ No puedes crear una campaña con fecha de inicio en el pasado.", { status: 400 });
    }
    if (fechaFin < fechaInicio) {
        return new NextResponse("⚠️ La fecha de fin no puede ser anterior a la de inicio", { status: 400 });
    }

    // 2. Identificar Productos
    let idsObjetivo: string[] = [];
    if (aplicarA === "TODOS") {
      const todos = await prisma.producto.findMany({ where: { estado: "ACTIVO" }, select: { id: true } });
      idsObjetivo = todos.map(p => p.id);
    } else if (aplicarA === "CATEGORIA" && categoriaId) {
      const deCategoria = await prisma.producto.findMany({ where: { categoriaId, estado: "ACTIVO" }, select: { id: true } });
      idsObjetivo = deCategoria.map(p => p.id);
    } else if (aplicarA === "SELECCION" && Array.isArray(productoIds)) {
      idsObjetivo = productoIds;
    }

    if (idsObjetivo.length === 0) return new NextResponse("No hay productos seleccionados", { status: 400 });

    // 3. 🛡️ ALERTA DE CONFLICTO (Solo ACTIVO o PROGRAMADO)
    const conflictos = await prisma.descuentoProducto.findMany({
      where: {
        productoId: { in: idsObjetivo },
        estado: { in: ["ACTIVO", "PROGRAMADO"] }, // Ignoramos FINALIZADO/CANCELADO para permitir historial
        AND: [
          { startsAt: { lte: fechaFin } },
          { endsAt: { gte: fechaInicio } }
        ]
      },
      select: {
        producto: { select: { nombre: true } },
        nombreCampana: true,
        startsAt: true,
        endsAt: true,
        estado: true
      },
      take: 1 // Con uno basta para bloquear
    });

    if (conflictos.length > 0) {
      const c = conflictos[0];
      const fInicio = new Date(c.startsAt).toLocaleDateString();
      const fFin = new Date(c.endsAt).toLocaleDateString();
      
      return NextResponse.json({ 
        error: `⚠️ CONFLICTO DETECTADO: El producto "${c.producto.nombre}" ya pertenece a la campaña "${c.nombreCampana}" (${c.estado}) vigente del ${fInicio} al ${fFin}. No se pueden superponer ofertas.` 
      }, { status: 409 });
    }

    // 4. Crear Campaña
    const datosDescuento = idsObjetivo.map(id => ({
      productoId: id, tipo, valor: Number(valor), startsAt: fechaInicio, endsAt: fechaFin,
      estado: "PROGRAMADO" as const, creadoPorId: creadorId,
      nombreCampana: nombreCampana || "Campaña General", descripcion: descripcion || null
    }));

    await prisma.descuentoProducto.createMany({ data: datosDescuento });

    // 5. Activar Inmediatamente si corresponde a HOY
    const ahora = new Date();
    if (ahora >= fechaInicio && ahora <= fechaFin) {
      await prisma.descuentoProducto.updateMany({
        where: { productoId: { in: idsObjetivo }, startsAt: fechaInicio, endsAt: fechaFin, estado: "PROGRAMADO" },
        data: { estado: "ACTIVO" }
      });
      await prisma.producto.updateMany({
        where: { id: { in: idsObjetivo } },
        data: {
          descuentoActivo: true, descuentoTipo: tipo, descuentoValor: Number(valor),
          descuentoInicio: fechaInicio, descuentoFin: fechaFin
        }
      });
    }

    return NextResponse.json({ success: true, mensaje: "Campaña lanzada correctamente" });

  } catch (error) {
    console.error(error);
    return new NextResponse("Error interno", { status: 500 });
  }
}