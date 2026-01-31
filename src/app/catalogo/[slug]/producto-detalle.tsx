"use client";

import { useEffect, useMemo, useState } from "react";

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

type Props = {
  producto: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: string;
    categoria: string;

    // ✅ descuento
    descuentoActivo: boolean;
    descuentoLabel: string;
    precioFinal: string | null; // "12.34"
  };

  imagenes: Array<{ id: string; url: string; esPortada: boolean; orden: number }>;

  // ✅ imágenes por color
  imagenesColor: Array<{ id: string; colorId: string; color: string; hex: string | null; url: string }>;

  variantes: Array<{
    id: string;
    talla: string;
    tallaOrden: number;
    colorId: string;
    color: string;
    colorHex: string | null;
    stock: number;
  }>;

  whatsappNumero: string;
  agotado: boolean;
};

export default function ProductoDetalle({
  producto,
  imagenes,
  imagenesColor,
  variantes,
  whatsappNumero,
  agotado,
}: Props) {
  const portada = imagenes[0]?.url ?? "";

  const tallas = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of variantes) if (!m.has(v.talla)) m.set(v.talla, v.tallaOrden);

    return [...m.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([t]) => t);
  }, [variantes]);

  const [tallaSel, setTallaSel] = useState<string>(tallas[0] ?? "");

  const coloresDisponibles = useMemo(() => {
    const m = new Map<string, { id: string; nombre: string; hex: string | null }>();

    for (const v of variantes) {
      if (v.talla !== tallaSel) continue;
      if (!m.has(v.colorId)) m.set(v.colorId, { id: v.colorId, nombre: v.color, hex: v.colorHex ?? null });
    }

    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [variantes, tallaSel]);

  const [colorSelId, setColorSelId] = useState<string>(coloresDisponibles[0]?.id ?? "");

  // Mantener color válido si cambia talla
  useEffect(() => {
    if (!coloresDisponibles.some((c) => c.id === colorSelId)) {
      setColorSelId(coloresDisponibles[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tallaSel, coloresDisponibles.map((c) => c.id).join("|")]);

  const colorSelNombre = useMemo(() => {
    return coloresDisponibles.find((c) => c.id === colorSelId)?.nombre ?? "";
  }, [coloresDisponibles, colorSelId]);

  // ✅ imagen por color seleccionada
  const imagenPorColor = useMemo(() => {
    return imagenesColor.find((x) => x.colorId === colorSelId)?.url ?? "";
  }, [imagenesColor, colorSelId]);

  const imagenPrincipal = imagenPorColor || portada;

  const linkWhatsApp = useMemo(() => {
    const precioMostrar = producto.descuentoActivo && producto.precioFinal
      ? `S/ ${Number(producto.precioFinal).toFixed(2)} (antes ${soles(producto.precio)})`
      : soles(producto.precio);

    const msg = agotado
      ? `Hola, estoy interesado en este producto:
• Producto: ${producto.nombre}
• Precio: ${precioMostrar}

¿Podrían confirmarme cuándo reponen o si se puede separar?`
      : `Hola, quiero este producto:
• Producto: ${producto.nombre}
• Talla: ${tallaSel || "-"}
• Color: ${colorSelNombre || "-"}
• Precio: ${precioMostrar}

¿Está disponible?`;

    return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(msg)}`;
  }, [agotado, whatsappNumero, producto.nombre, producto.precio, producto.descuentoActivo, producto.precioFinal, tallaSel, colorSelNombre]);

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <a className="underline" href="/catalogo">
        ← Volver
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IMÁGENES */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {imagenPrincipal ? (
              <img src={imagenPrincipal} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : null}

            {producto.descuentoActivo && producto.descuentoLabel && (
              <div className="absolute top-5 right-5 z-10 bg-red-600 text-white text-xs font-bold px-5 py-1 rounded-none shadow">
              {producto.descuentoLabel}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* miniaturas normales */}
            {imagenes.slice(0, 6).map((img) => (
              <div key={img.id} className="aspect-square bg-black rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="img" className="w-full h-full object-cover" />
              </div>
            ))}

            {/* miniatura del color seleccionado (si existe y no está ya) */}
            {imagenPorColor && !imagenes.some((i) => i.url === imagenPorColor) ? (
              <div className="aspect-square bg-black rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagenPorColor} alt="color" className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>
        </div>

        {/* INFO + COMPRA */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold">{producto.nombre}</h1>
            <p className="text-sm opacity-80">{producto.categoria}</p>
          </div>

          {/* ✅ precio con descuento */}
          {producto.descuentoActivo && producto.precioFinal ? (
            <div className="space-y-1">
              <div className="text-lg font-semibold">S/ {Number(producto.precioFinal).toFixed(2)}</div>
              <div className="text-sm opacity-70 line-through">{soles(producto.precio)}</div>
            </div>
          ) : (
            <div className="text-lg">{soles(producto.precio)}</div>
          )}

          {producto.descripcion && (
            <p className="text-sm opacity-90 whitespace-pre-wrap">{producto.descripcion}</p>
          )}

          <div className="border rounded-xl p-4 space-y-3">
            {agotado ? (
              <>
                <div className="inline-block bg-black text-white text-xs px-2 py-1 rounded-full">
                  Agotado
                </div>

                <p className="text-sm opacity-80">
                  Este producto no está disponible por el momento. Escríbenos y te avisamos cuando esté disponible.
                </p>

                <a className="inline-block bg-black text-white rounded-md px-4 py-2" href={linkWhatsApp} target="_blank" rel="noreferrer">
                  Consultar disponibilidad
                </a>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Talla</p>
                  <div className="flex flex-wrap gap-2">
                    {tallas.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-sm ${tallaSel === t ? "bg-black text-white" : ""}`}
                        onClick={() => setTallaSel(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {coloresDisponibles.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-sm ${colorSelId === c.id ? "bg-black text-white" : ""}`}
                        onClick={() => setColorSelId(c.id)}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <a className="inline-block bg-black text-white rounded-md px-4 py-2" href={linkWhatsApp} target="_blank" rel="noreferrer">
                  Comprar
                </a>
              </>
            )}

            {!whatsappNumero && <p className="text-xs text-red-600">Falta WHATSAPP_NUMERO</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
