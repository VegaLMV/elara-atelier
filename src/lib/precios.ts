import { Prisma } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

export interface ItemConPrecio {
    precio: number | Decimal;
    descuentoActivo: boolean;
    descuentoTipo: string | null;
    descuentoValor: number | Decimal | null;
    descuentoInicio?: Date | null | string;
    descuentoFin?: Date | null | string;
}

export interface ResultadoPrecio {
    precioOriginal: number;
    precioFinal: number;
    ahorro: number;
    etiquetaDescuento: string | null;
    tieneDescuento: boolean;
    estadoDescuento: "ACTIVO" | "PROGRAMADO" | "VENCIDO" | null;
}

/**
 * Calcula el precio final de un producto aplicando descuentos activos y vigentes por fecha.
 * Utiliza conversión segura a number para visualización.
 * 
 * @param producto Objeto con las propiedades de precio y descuento
 * @returns ResultadoPrecio con desglose de valores
 */
export function calcularPrecioProducto(producto: ItemConPrecio): ResultadoPrecio {
    // Conversión segura a números para cálculos estándar
    const pOriginal = typeof producto.precio === 'object'
        ? Number((producto.precio as Decimal).toString())
        : Number(producto.precio);

    let pFinal = pOriginal;
    let etiqueta: string | null = null;
    let ahorro = 0;
    let estadoDescuento: ResultadoPrecio["estadoDescuento"] = null;

    // Lógica de fechas
    const ahora = new Date();
    let esVigente = false;

    if (producto.descuentoActivo && producto.descuentoValor) {
        // Si hay fechas, validarlas
        const inicio = producto.descuentoInicio ? new Date(producto.descuentoInicio) : null;
        const fin = producto.descuentoFin ? new Date(producto.descuentoFin) : null;

        if (inicio && inicio > ahora) {
            estadoDescuento = "PROGRAMADO";
        } else if (fin) {
            fin.setHours(23, 59, 59, 999); // Final del día
            if (fin < ahora) {
                estadoDescuento = "VENCIDO";
            } else {
                esVigente = true;
                estadoDescuento = "ACTIVO";
            }
        } else {
            // Sin fechas o fecha inicio pasada y sin fecha fin
            esVigente = true;
            estadoDescuento = "ACTIVO";
        }
    }

    // Aplicar descuento SOLO si es VIGENTE
    if (esVigente && producto.descuentoValor) {
        const valor = typeof producto.descuentoValor === 'object'
            ? Number((producto.descuentoValor as Decimal).toString())
            : Number(producto.descuentoValor);

        if (valor > 0) {
            if (producto.descuentoTipo === "PORCENTAJE") {
                // Descuento porcentual
                const descuentoMonto = pOriginal * (valor / 100);
                pFinal = pOriginal - descuentoMonto;
                etiqueta = `-${valor}%`;
                ahorro = descuentoMonto;
            } else {
                // Descuento fijo (Monto)
                pFinal = pOriginal - valor;
                etiqueta = `-S/ ${valor.toFixed(2)}`;
                ahorro = valor;
            }
        }
    }

    // Asegurar que no sea negativo
    pFinal = Math.max(0, pFinal);

    // Si por redondeo el ahorro es despreciable (< 0.01), ignorarlo
    if (ahorro < 0.01) {
        pFinal = pOriginal;
        ahorro = 0;
        // Mantenemos la etiqueta visual si es programado, pero no aplicamos descuento
    }

    return {
        precioOriginal: pOriginal,
        precioFinal: pFinal,
        ahorro,
        etiquetaDescuento: etiqueta,
        tieneDescuento: ahorro > 0,
        estadoDescuento
    };
}

/**
 * Helper para formatear moneda consistente en todo el app
 */
export const formatMoney = (amount: number | Decimal) => {
    const val = typeof amount === 'object' ? Number(amount.toString()) : Number(amount);
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
    }).format(val);
};

/**
 * Versión simplificada para calcular precio final.
 * Útil cuando solo necesitas el precio final sin metadata adicional.
 */
export function calcularPrecioFinal(
    precio: number,
    tipo: string | null,
    valor: number | null
): number {
    if (!tipo || !valor) return precio;
    if (tipo === "PORCENTAJE") return precio * (1 - valor / 100);
    return Math.max(0, precio - valor);
}


/**
 * Parsea una fecha en formato YYYY-MM-DD a un objeto Date (Mediodía para evitar desfases)
 */
export function parseFechaYYYYMMDD(s: any): Date | null {
    const t = String(s ?? "").trim();
    if (!t) return null;
    return new Date(`${t}T12:00:00`);
}

/**
 * Parsea y valida los datos de un descuento proveniente de un request body.
 */
export function parseDescuentoFromBody(body: any) {
    const descuentoActivo = Boolean(body?.descuentoActivo);

    if (!descuentoActivo) {
        return {
            descuentoActivo: false,
            descuentoTipo: null,
            descuentoValor: null,
            descuentoInicio: null,
            descuentoFin: null,
            error: null as string | null,
        };
    }

    const tipo = String(body?.descuentoTipo ?? "").trim().toUpperCase();
    if (tipo !== "PORCENTAJE" && tipo !== "MONTO") {
        return { error: "descuentoTipo inválido (PORCENTAJE | MONTO)" };
    }

    const rawVal = body?.descuentoValor;
    const valNum = Number(rawVal);
    if (!Number.isFinite(valNum) || valNum <= 0) {
        return { error: "descuentoValor inválido" };
    }
    if (tipo === "PORCENTAJE" && (valNum <= 0 || valNum > 100)) {
        return { error: "En PORCENTAJE, descuentoValor debe ser > 0 y <= 100" };
    }

    const inicio = parseFechaYYYYMMDD(body?.descuentoInicio);
    const fin = parseFechaYYYYMMDD(body?.descuentoFin);
    if (inicio && fin && inicio.getTime() > fin.getTime()) {
        return { error: "descuentoInicio no puede ser mayor que descuentoFin" };
    }

    return {
        descuentoActivo: true,
        descuentoTipo: tipo as "PORCENTAJE" | "MONTO",
        descuentoValor: new Prisma.Decimal(String(rawVal)),
        descuentoInicio: inicio,
        descuentoFin: fin,
        error: null as string | null,
    };
}
