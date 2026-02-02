import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesionAdmin } from "@/lib/sesion";

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
    // Verificamos si alguno de los productos seleccionados YA tiene un descuento vigente en ese rango.
    // Lógica de intersección: (InicioA <= FinB) Y (FinA >= InicioB)
    const conflictos = await prisma.descuentoProducto.findMany({
      where: {
        productoId: { in: idsObjetivo },
        estado: { not: "CANCELADO" }, // Ignoramos los cancelados/históricos borrados
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
      take: 5 // Solo necesitamos ver unos pocos para dar el error
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
    // Usamos map para preparar los datos
    const datosDescuento = idsObjetivo.map(id => ({
      productoId: id,
      tipo,
      valor: Number(valor),
      startsAt: fechaInicio,
      endsAt: fechaFin,
      estado: "PROGRAMADO" as const,
      creadoPorId: creadorId,
      nombreCampana: nombreCampana || "Campaña General", 
      descripcion: descripcion || null
    }));

    await prisma.descuentoProducto.createMany({
      data: datosDescuento
    });

    // 7. Actualizar productos en TIEMPO REAL si la fecha ya es vigente (HOY)
    const ahora = new Date();
    
    if (ahora >= fechaInicio && ahora <= fechaFin) {
      await prisma.producto.updateMany({
        where: { id: { in: idsObjetivo } },
        data: {
          descuentoActivo: true,
          descuentoTipo: tipo,
          descuentoValor: Number(valor),
          descuentoInicio: fechaInicio,
          descuentoFin: fechaFin,
        }
      });
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