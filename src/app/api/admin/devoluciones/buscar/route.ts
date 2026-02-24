export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/sesion";

/**
 * ============================================================================
 * API: BUSCADOR DE REFERENCIAS PARA DEVOLUCIÓN
 * ============================================================================
 * Recibe: ?tipo=CLIENTE|PROVEEDOR&codigo=XXXX
 * * Funcionalidad:
 * 1. Si es CLIENTE: Busca en 'Venta' por código o ID, trayendo productos y fotos.
 * 2. Si es PROVEEDOR: Busca en 'Compra' por ID, trayendo los insumos o ropa.
 */
export async function GET(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo"); // CLIENTE o PROVEEDOR
  const codigo = searchParams.get("codigo")?.trim();

  if (!tipo || !codigo) {
    return NextResponse.json({ error: "Faltan parámetros de búsqueda" }, { status: 400 });
  }

  try {
    // --- CASO A: BUSCAR VENTA DE CLIENTE ---
    if (tipo === "CLIENTE") {
      const venta = await prisma.venta.findFirst({
        where: {
          OR: [
            { codigo: { contains: codigo, mode: "insensitive" } },
            { id: { equals: codigo } },
            { cliente: { nombre: { contains: codigo, mode: "insensitive" } } },
            { clienteNombre: { contains: codigo, mode: "insensitive" } },
            { pedido: { codigo: { contains: codigo, mode: "insensitive" } } }
          ]
        },

        include: {
          cliente: { select: { id: true, nombre: true } },
          items: {
            include: {
              variante: {
                include: {
                  talla: true,
                  color: true,
                  producto: {
                    include: {
                      imagenes: { where: { esPortada: true }, take: 1 }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!venta) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

      return NextResponse.json(venta);
    }

    // --- CASO B: BUSCAR COMPRA A PROVEEDOR ---
    if (tipo === "PROVEEDOR") {
      const compra = await prisma.compra.findFirst({
        where: {
          OR: [
            { id: { equals: codigo } },
            { proveedor: { nombre: { contains: codigo, mode: "insensitive" } } }
          ]
        },
        include: {
          proveedor: { select: { nombre: true } },
          items: {
            include: {
              variante: {
                include: {
                  talla: true,
                  color: true,
                  producto: {
                    include: {
                      imagenes: { where: { esPortada: true }, take: 1 }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!compra) return NextResponse.json({ error: "Registro de compra no encontrado" }, { status: 404 });

      return NextResponse.json(compra);
    }


    return NextResponse.json({ error: "Tipo de búsqueda no válido" }, { status: 400 });

  } catch (error) {
    console.error("Error en búsqueda de devolución:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}