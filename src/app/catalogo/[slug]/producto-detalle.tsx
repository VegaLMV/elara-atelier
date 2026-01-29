"use client";

import { useEffect, useMemo, useState } from "react";

function soles(v: any) {
  const n = Number(v?.toString?.() ?? v);
  if (Number.isNaN(n)) return `S/ ${String(v)}`;
  return `S/ ${n.toFixed(2)}`;
}

type Props = {
  producto: { id: string; nombre: string; descripcion: string; precio: string; categoria: string };
  imagenes: Array<{ id: string; url: string; esPortada: boolean; orden: number }>;
  variantes: Array<{ id: string; talla: string; tallaOrden: number; color: string; stock: number }>;
  whatsappNumero: string;
  agotado: boolean;
};

export default function ProductoDetalle({ producto, imagenes, variantes, whatsappNumero, agotado }: Props) {
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
    return variantes
      .filter((v) => v.talla === tallaSel)
      .sort((a, b) => a.color.localeCompare(b.color))
      .map((v) => v.color);
  }, [variantes, tallaSel]);

  const [colorSel, setColorSel] = useState<string>(coloresDisponibles[0] ?? "");

  // Mantener color válido si cambia talla
  useEffect(() => {
    if (!coloresDisponibles.includes(colorSel)) {
      setColorSel(coloresDisponibles[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tallaSel, coloresDisponibles.join("|")]);

  const varianteSeleccionada = useMemo(() => {
    return variantes.find((v) => v.talla === tallaSel && v.color === colorSel) ?? null;
  }, [variantes, tallaSel, colorSel]);

  const linkWhatsApp = useMemo(() => {
    const msg = agotado
      ? `Hola, estoy interesado en este producto:
• Producto: ${producto.nombre}
• Precio: ${soles(producto.precio)}

¿Podrían confirmarme cuándo reponen o si se puede separar?`
      : `Hola, quiero este producto:
• Producto: ${producto.nombre}
• Talla: ${tallaSel || "-"}
• Color: ${colorSel || "-"}
• Precio: ${soles(producto.precio)}
• Stock: ${varianteSeleccionada?.stock ?? 0}

¿Está disponible?`;

    const encoded = encodeURIComponent(msg);
    return `https://wa.me/${whatsappNumero}?text=${encoded}`;
  }, [
    agotado,
    whatsappNumero,
    producto.nombre,
    producto.precio,
    tallaSel,
    colorSel,
    varianteSeleccionada?.stock,
  ]);

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <a className="underline" href="/catalogo">
        ← Volver
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IMÁGENES */}
        <div className="space-y-3">
          <div className="aspect-square bg-black rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {portada ? <img src={portada} alt={producto.nombre} className="w-full h-full object-cover" /> : null}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {imagenes.slice(0, 8).map((img) => (
              <div key={img.id} className="aspect-square bg-black rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="img" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* INFO + COMPRA */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold">{producto.nombre}</h1>
            <p className="text-sm opacity-80">{producto.categoria}</p>
          </div>

          <div className="text-lg">{soles(producto.precio)}</div>

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
                  Este producto no tiene stock disponible por ahora. Escríbenos y te avisamos cuando reponga.
                </p>

                <a
                  className="inline-block bg-black text-white rounded-md px-4 py-2"
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noreferrer"
                >
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
                        className={`px-3 py-1 rounded-full border text-sm ${
                          tallaSel === t ? "bg-black text-white" : ""
                        }`}
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
                        key={c}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-sm ${
                          colorSel === c ? "bg-black text-white" : ""
                        }`}
                        onClick={() => setColorSel(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm opacity-80">
                  Stock: <b>{varianteSeleccionada?.stock ?? 0}</b>
                </p>

                <a
                  className="inline-block bg-black text-white rounded-md px-4 py-2"
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noreferrer"
                >
                  Pedir por WhatsApp
                </a>
              </>
            )}

            {!whatsappNumero && (
              <p className="text-xs text-red-600">Falta WHATSAPP_NUMERO en .env</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
