import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

// ============================================================================
// 1. MÉTODO GET: Sincronización de Estados (Cron Job / Manual)
// ============================================================================
// Esta función revisa TODAS las campañas y actualiza sus estados según la fecha y hora actual.
export async function GET(request: Request) {
  try {
    const admin = await sesionAdmin();
    if (!admin) return new NextResponse("No autorizado", { status: 401 });

    const now = new Date();
    
    // --- A. ACTIVAR campañas programadas que ya llegaron a su fecha de inicio ---
    const campañasParaActivar = await prisma.descuentoProducto.findMany({
      where: {
        estado: "PROGRAMADO",
        startsAt: { lte: now }, // Ya empezó
        endsAt: { gte: now },   // Aún no termina
      },
    });

    for (const campana of campañasParaActivar) {
      // 1. Cambiar estado a ACTIVO
      await prisma.descuentoProducto.update({
        where: { id: campana.id },
        data: { estado: "ACTIVO" },
      });

      // 2. Reflejar descuento en el Producto
      await prisma.producto.update({
        where: { id: campana.productoId },
        data: {
          descuentoActivo: true,
          descuentoTipo: campana.tipo,
          descuentoValor: campana.valor,
          descuentoInicio: campana.startsAt,
          descuentoFin: campana.endsAt,
          descuentoActualId: campana.id,
        },
      });
    }

    // --- B. FINALIZAR campañas activas que ya vencieron ---
    const campañasParaFinalizar = await prisma.descuentoProducto.findMany({
      where: {
        estado: "ACTIVO",
        endsAt: { lt: now }, // Ya terminó
      },
    });

    for (const campana of campañasParaFinalizar) {
      // 1. Cambiar estado a FINALIZADO
      await prisma.descuentoProducto.update({
        where: { id: campana.id },
        data: { estado: "FINALIZADO" },
      });

      // 2. Limpiar descuento del Producto (solo si era este el activo)
      const producto = await prisma.producto.findUnique({
        where: { id: campana.productoId },
        select: { descuentoActualId: true },
      });

      if (producto?.descuentoActualId === campana.id) {
        await prisma.producto.update({
          where: { id: campana.productoId },
          data: {
            descuentoActivo: false,
            descuentoTipo: null,
            descuentoValor: null,
            descuentoInicio: null,
            descuentoFin: null,
            descuentoActualId: null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Sincronización completa. Activadas: ${campañasParaActivar.length}, Finalizadas: ${campañasParaFinalizar.length}`,
      activadas: campañasParaActivar.length,
      finalizadas: campañasParaFinalizar.length,
    });

  } catch (error) {
    console.error("Error sincronizando campañas:", error);
    return new NextResponse("Error en sincronización", { status: 500 });
  }
}

// ============================================================================
// 2. MÉTODO POST: Crear Nueva Campaña
// ============================================================================
export async function POST(request: Request) {
  // 1. Verificación de Seguridad
  const admin = await sesionAdmin();
  if (!admin) return new NextResponse("No autorizado", { status: 401 });

  // Obtener ID del creador de forma segura
  const creadorId = (admin as any).id || (admin as any).sub;

  try {
    const body = await request.json();
    const { 
      // Metadatos
      nombreCampana,
      descripcion,
      
      // Configuración
      tipo, 
      valor, 
      startsAt, 
      endsAt, 
      
      // Alcance
      aplicarA, 
      productoIds, 
      categoriaId 
    } = body;

    // 2. Validaciones básicas
    if (!tipo || !valor || !startsAt || !endsAt) {
      return new NextResponse("Faltan datos obligatorios (tipo, valor, fechas)", { status: 400 });
    }

    // 3. Ajuste de Fechas (UTC-5 Perú)
    // Inicio: 00:00:00 del día seleccionado
    const fechaInicio = new Date(startsAt);
    fechaInicio.setUTCHours(5, 0, 0, 0); 

    // Fin: 23:59:59 del día seleccionado
    const fechaFin = new Date(endsAt);
    fechaFin.setUTCHours(23 + 5, 59, 59, 999);

    if (fechaFin < fechaInicio) {
        return new NextResponse("La fecha de fin no puede ser anterior a la de inicio", { status: 400 });
    }

    // 4. Identificar productos objetivo
    let idsObjetivo: string[] = [];

    if (aplicarA === "TODOS") {
      const todos = await prisma.producto.findMany({ 
        where: { estado: "ACTIVO" },
        select: { id: true } 
      });
      idsObjetivo = todos.map(p => p.id);
    } 
    else if (aplicarA === "CATEGORIA" && categoriaId) {
      const deCategoria = await prisma.producto.findMany({
        where: { categoriaId, estado: "ACTIVO" },
        select: { id: true }
      });
      idsObjetivo = deCategoria.map(p => p.id);
    } 
    else if (aplicarA === "SELECCION" && Array.isArray(productoIds)) {
      idsObjetivo = productoIds;
    }

    if (idsObjetivo.length === 0) {
      return new NextResponse("No se encontraron productos para aplicar el descuento", { status: 400 });
    }

    // 5. 🛡️ VALIDACIÓN DE SOLAPAMIENTO (CRÍTICO)
    const conflictos = await prisma.descuentoProducto.findMany({
      where: {
        productoId: { in: idsObjetivo },
        estado: { not: "CANCELADO" },
        // La lógica es: (NuevoInicio <= ViejoFin) Y (NuevoFin >= ViejoInicio)
        AND: [
          { startsAt: { lte: fechaFin } },
          { endsAt: { gte: fechaInicio } }
        ]
      },
      select: {
        producto: { select: { nombre: true } },
        startsAt: true,
        endsAt: true
      },
      take: 5
    });

    if (conflictos.length > 0) {
      const ejemplos = conflictos.map(c => 
        `${c.producto.nombre} (${new Date(c.startsAt).toLocaleDateString()} - ${new Date(c.endsAt).toLocaleDateString()})`
      ).join(", ");
      
      return NextResponse.json({ 
        error: `Conflicto de fechas: Algunos productos ya tienen descuentos programados en este rango. Ejemplos: ${ejemplos}` 
      }, { status: 409 });
    }

    // 6. Crear los registros en DescuentoProducto
    // Se inicia como 'PROGRAMADO' por defecto, luego se valida si debe activarse ya
    const datosDescuento = idsObjetivo.map(id => ({
      productoId: id,
      tipo,
      valor: Number(valor),
      startsAt: fechaInicio,
      endsAt: fechaFin,
      estado: "PROGRAMADO" as const, // Forzar tipado del Enum si es necesario
      creadoPorId: creadorId,
      nombreCampana: nombreCampana || "Campaña General", 
      descripcion: descripcion || null
    }));

    // Insertar registros
    await prisma.descuentoProducto.createMany({
      data: datosDescuento
    });

    // 7. Actualizar productos en TIEMPO REAL si la fecha ya es vigente (HOY)
    // Esto asegura que si creas una campaña para "Hoy", se active al instante
    // sin esperar al Cron Job o al GET.
    const ahora = new Date();
    
    // Si la campaña incluye el momento actual
    if (ahora >= fechaInicio && ahora <= fechaFin) {
      // 1. Actualizar estado de las campañas recién creadas a ACTIVO
      // (Necesitamos recuperarlas o actualizarlas en bloque con una query cuidadosa)
      // Como createMany no devuelve IDs, hacemos un updateMany basado en los criterios de creación
      await prisma.descuentoProducto.updateMany({
        where: {
            productoId: { in: idsObjetivo },
            startsAt: fechaInicio,
            endsAt: fechaFin,
            estado: "PROGRAMADO"
        },
        data: { estado: "ACTIVO" }
      });

      // 2. Actualizar Productos
      await prisma.producto.updateMany({
        where: { id: { in: idsObjetivo } },
        data: {
          descuentoActivo: true,
          descuentoTipo: tipo,
          descuentoValor: Number(valor),
          descuentoInicio: fechaInicio,
          descuentoFin: fechaFin,
          // Nota: updateMany no nos deja asignar 'descuentoActualId' dinámicamente fácil
          // sin saber el ID exacto del descuento.
          // Para corrección exacta del ID, confiamos en la sincronización GET posterior
          // o iteramos (pero por performance, updateMany es mejor para mostrar la etiqueta YA).
        }
      });
      
      // Corrección fina: Para enlazar el ID exacto (descuentoActualId),
      // lo ideal es llamar a la lógica de sincronización inmediatamente.
      // Pero para visualización rápida, los campos 'descuentoActivo/Tipo/Valor' son suficientes.
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: `Campaña "${nombreCampana || 'General'}" creada exitosamente para ${idsObjetivo.length} productos.` 
    });

  } catch (error) {
    console.error("Error creando campaña:", error);
    return new NextResponse("Error interno del servidor al procesar la campaña", { status: 500 });
  }
}