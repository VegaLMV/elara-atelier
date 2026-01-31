export type TipoDescuento = "PORCENTAJE" | "MONTO";

export function descuentoVigente(p: {
  descuentoActivo: boolean;
  descuentoTipo: TipoDescuento | null;
  descuentoValor: string | number | null;
  descuentoInicio?: Date | null;
  descuentoFin?: Date | null;
}, now = new Date()) {
  if (!p.descuentoActivo) return false;
  if (!p.descuentoTipo) return false;
  if (p.descuentoValor === null || p.descuentoValor === undefined) return false;

  const ini = p.descuentoInicio ? new Date(p.descuentoInicio) : null;
  const fin = p.descuentoFin ? new Date(p.descuentoFin) : null;

  if (ini && now < ini) return false;
  if (fin && now > fin) return false;

  return true;
}

export function calcularPrecioFinal(p: {
  precio: string | number;
  descuentoActivo: boolean;
  descuentoTipo: TipoDescuento | null;
  descuentoValor: string | number | null;
  descuentoInicio?: Date | null;
  descuentoFin?: Date | null;
}, now = new Date()) {
  const precio = Number(p.precio);
  if (!Number.isFinite(precio)) return { precioFinal: 0, aplica: false, etiqueta: null as string | null };

  const aplica = descuentoVigente(p, now);
  if (!aplica) return { precioFinal: precio, aplica: false, etiqueta: null as string | null };

  const valor = Number(p.descuentoValor);
  if (!Number.isFinite(valor) || valor < 0) return { precioFinal: precio, aplica: false, etiqueta: null };

  let precioFinal = precio;

  if (p.descuentoTipo === "PORCENTAJE") {
    const pct = Math.min(100, valor);
    precioFinal = precio * (1 - pct / 100);
    return { precioFinal: Math.max(0, round2(precioFinal)), aplica: true, etiqueta: `-${pct}%` };
  }

  // MONTO
  precioFinal = precio - valor;
  return { precioFinal: Math.max(0, round2(precioFinal)), aplica: true, etiqueta: `-S/ ${round2(valor).toFixed(2)}` };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
