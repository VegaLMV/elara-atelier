"use client";

import { useState, useMemo, useEffect } from "react";
import SimilarProductsSection from "./similar-products-section";

type Variante = {
  id: string;
  talla: string;
  color: string;
  hex: string | null;
  stock: number;
};

type Props = {
  producto: {
    nombre: string;
    descripcion: string | null;
    categoria: string;
    precioOriginal: number;
    precioFinal: number;
    tieneDescuento: boolean;
    descuentoTag: string;
    imagenes: string[];
    imagenesColor: { colorNombre: string; url: string }[];
    variantes: Variante[];
    similares: any[];
  };
};

export default function ProductoDetalle({ producto }: Props) {
  const [imgActiva, setImgActiva] = useState<string | null>(producto.imagenes[0] || null);
  const [tallaSel, setTallaSel] = useState<string | null>(null);
  const [colorSel, setColorSel] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const imagenParaMensaje = useMemo(() => {
    if (colorSel) {
      const imgColor = producto.imagenesColor.find(ic => ic.colorNombre === colorSel);
      return imgColor ? imgColor.url : producto.imagenes[0];
    }
    return producto.imagenes[0];
  }, [colorSel, producto.imagenesColor, producto.imagenes]);

  useEffect(() => {
    if (colorSel) {
      const imgColor = producto.imagenesColor.find(ic => ic.colorNombre === colorSel);
      if (imgColor) setImgActiva(imgColor.url);
    }
  }, [colorSel, producto.imagenesColor]);

  const tallasDisponibles = useMemo(() => {
    return Array.from(new Set(producto.variantes.map(v => v.talla)));
  }, [producto.variantes]);

  const coloresDisponibles = useMemo(() => {
    if (tallaSel) {
      return Array.from(new Set(producto.variantes.filter(v => v.talla === tallaSel).map(v => v.color)));
    }
    return Array.from(new Set(producto.variantes.map(v => v.color)));
  }, [producto.variantes, tallaSel]);

  const varianteElegida = useMemo(() => {
    return producto.variantes.find(v => v.talla === tallaSel && v.color === colorSel);
  }, [producto.variantes, tallaSel, colorSel]);

  const stockActual = varianteElegida ? varianteElegida.stock : null;

  function contactarWhatsApp() {
    const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO || "51944434054";

    const variantInfo = varianteElegida
      ? `\n*Talla:* ${varianteElegida.talla}\n*Color:* ${varianteElegida.color}`
      : "";

    const texto = `Hola Elara Atelier ✨, estoy interesada en este producto:
    
*${producto.nombre}*${variantInfo}
*Precio:* ${soles(producto.precioFinal)}

Puedes verlo aquí: ${imagenParaMensaje}`;

    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank");
  }

  const soles = (v: number) => `S/ ${v.toFixed(2)}`;

  function getColorStyle(hex: string | null) {
    if (!hex) return { backgroundColor: '#eee' };
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length <= 1) return { backgroundColor: codes[0] || '#eee' };

    const percentage = 100 / codes.length;
    const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
    return { background: `linear-gradient(135deg, ${stops})` };
  }

  return (
    <>
      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* Modal de Guía de Tallas */}
        {isSizeGuideOpen && (
          <div
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsSizeGuideOpen(false)}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-serif text-xl text-slate-900">Guía de Tallas</h3>
                <button onClick={() => setIsSizeGuideOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-widest">
                        <th className="pb-3 font-bold">Talla</th>
                        <th className="pb-3 font-bold">Busto (cm)</th>
                        <th className="pb-3 font-bold">Cintura (cm)</th>
                        <th className="pb-3 font-bold">Cadera (cm)</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 divide-y divide-slate-50">
                      <tr><td className="py-3 font-bold text-slate-900">S</td><td className="py-3">84 - 88</td><td className="py-3">64 - 68</td><td className="py-3">92 - 96</td></tr>
                      <tr><td className="py-3 font-bold text-slate-900">M</td><td className="py-3">89 - 93</td><td className="py-3">69 - 73</td><td className="py-3">97 - 101</td></tr>
                      <tr><td className="py-3 font-bold text-slate-900">L</td><td className="py-3">94 - 98</td><td className="py-3">74 - 78</td><td className="py-3">102 - 106</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-6 text-[11px] text-slate-400 italic font-light">
                  * Medidas referenciales tomadas sobre el cuerpo. Si estás entre dos tallas, te recomendamos elegir la más grande.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Zoom */}
        {isZoomOpen && imgActiva && (
          <div
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsZoomOpen(false)}
          >
            <button className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <img src={imgActiva} alt="Zoom" className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          {/* GALERÍA */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 lg:w-24 shrink-0 py-1">
              {producto.imagenes.map((url, i) => (
                <button key={i} onMouseEnter={() => setImgActiva(url)} onClick={() => setImgActiva(url)} className={`w-16 md:w-full aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all shrink-0 ${imgActiva === url ? 'border-slate-900 ring-1 ring-slate-900' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex-1 aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden relative cursor-zoom-in group shadow-sm" onClick={() => setIsZoomOpen(true)}>
              {imgActiva ? <img src={imgActiva} alt={producto.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300">Sin imagen</div>}
              {producto.tieneDescuento && (
                <div className="absolute top-5 left-5 bg-red-600 text-white text-xs font-black px-4 py-2 rounded shadow-lg border border-red-500 tracking-widest uppercase z-10">
                  {producto.descuentoTag} OFF
                </div>
              )}
            </div>
          </div>

          {/* INFO */}
          <div className="lg:col-span-5 flex flex-col pt-2">
            <div className="mb-8 border-b border-slate-100 pb-8">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-2">{producto.categoria}</span>
              <h1 className="text-3xl md:text-4xl font-serif text-slate-900 mb-4 leading-tight">{producto.nombre}</h1>
              <div className="flex items-center gap-4">
                <span className={`text-3xl font-light ${producto.tieneDescuento ? 'text-red-600 font-medium' : 'text-slate-900'}`}>{soles(producto.precioFinal)}</span>
                {producto.tieneDescuento && <span className="text-lg text-slate-400 line-through font-light decoration-slate-300">{soles(producto.precioOriginal)}</span>}
              </div>
            </div>

            <div className="space-y-8 mb-10">
              {/* Talla Selector + Trigger Guía de Tallas */}
              <div className="space-y-3">
                <div className="flex justify-between items-end text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wide">Talla</span>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-colors"
                    >
                      Guía de tallas
                    </button>
                    {tallaSel && <button onClick={() => setTallaSel(null)} className="text-slate-400 underline">Limpiar</button>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tallasDisponibles.map(t => (
                    <button key={t} onClick={() => { setTallaSel(t); if (colorSel && !producto.variantes.some(v => v.talla === t && v.color === colorSel)) setColorSel(null); }} className={`h-10 min-w-[3rem] px-3 text-sm rounded border transition-all ${tallaSel === t ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-3">
                <div className="flex gap-2 items-center text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wide">Color:</span>
                  <span className="text-slate-500 font-light">{colorSel || "Selecciona uno"}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {coloresDisponibles.map(c => {
                    const vari = producto.variantes.find(v => v.color === c);
                    return (
                      <button key={c} onClick={() => setColorSel(c)} className={`w-9 h-9 rounded-full border-2 p-0.5 transition-all flex items-center justify-center ${colorSel === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`} title={c}>
                        <span className="w-full h-full rounded-full border border-black/5" style={getColorStyle(vari?.hex || null)} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={contactarWhatsApp}
              disabled={stockActual === 0}
              className="w-full py-4 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {stockActual === 0 ? 'NO DISPONIBLE' : 'Comprar por WhatsApp'}
            </button>

            <div className="mt-10 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">Detalles</h3>
              <div className="text-sm text-slate-500 font-light leading-relaxed whitespace-pre-wrap">
                {producto.descripcion || "Prenda exclusiva de Elara Atelier."}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SimilarProductsSection productos={producto.similares} />
    </>
  );
}