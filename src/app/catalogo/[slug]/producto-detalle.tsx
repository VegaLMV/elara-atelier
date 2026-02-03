"use client";

import { useState, useMemo } from "react";

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
    variantes: Variante[];
  };
};

export default function ProductoDetalle({ producto }: Props) {
  // 1. Estados de Selección
  const [imgActiva, setImgActiva] = useState(producto.imagenes[0] || "");
  const [tallaSel, setTallaSel] = useState<string | null>(null);
  const [colorSel, setColorSel] = useState<string | null>(null);

  // 2. Lógica de Disponibilidad
  const tallasDisponibles = useMemo(() => {
    return Array.from(new Set(producto.variantes.map(v => v.talla)));
  }, [producto.variantes]);

  const coloresDisponibles = useMemo(() => {
    if (!tallaSel) return Array.from(new Set(producto.variantes.map(v => v.color)));
    return Array.from(new Set(producto.variantes.filter(v => v.talla === tallaSel).map(v => v.color)));
  }, [producto.variantes, tallaSel]);

  const varianteElegida = useMemo(() => {
    return producto.variantes.find(v => v.talla === tallaSel && v.color === colorSel);
  }, [producto.variantes, tallaSel, colorSel]);

  const stockActual = varianteElegida ? varianteElegida.stock : null;

  // 3. Generación de Enlace de WhatsApp
  function contactarWhatsApp() {
    const numero = "51944434054"; 
    const variantInfo = varianteElegida 
      ? ` en talla ${varianteElegida.talla} y color ${varianteElegida.color}` 
      : "";
    
    const texto = `¡Hola Elara Atelier! ✨ Me interesa la pieza "${producto.nombre}"${variantInfo}. ¿Me podrían brindar más información?`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank");
  }

  // Formateador
  const soles = (v: number) => `S/ ${v.toFixed(2)}`;

  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
        
        {/* GALERÍA DE IMÁGENES (7/12) */}
        <div className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4">
          <div className="flex-1 aspect-[3/4] bg-slate-50 rounded-3xl overflow-hidden relative border border-slate-100 shadow-inner">
            {imgActiva ? (
              <img 
                src={imgActiva} 
                alt={producto.nombre} 
                className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">Sin imagen</div>
            )}
            
            {producto.tieneDescuento && (
               <div className="absolute top-6 left-6 bg-rose-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-xl tracking-widest uppercase">
                  {producto.descuentoTag}
               </div>
            )}
          </div>

          {/* Miniaturas */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-24">
            {producto.imagenes.map((url, i) => (
              <button
                key={i}
                onClick={() => setImgActiva(url)}
                className={`w-16 md:w-full aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0 ${imgActiva === url ? 'border-slate-900 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={url} alt={`Vista ${i}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* INFO Y SELECCIÓN (5/12) */}
        <div className="lg:col-span-5 flex flex-col pt-4">
          <div className="space-y-2 mb-8">
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400">{producto.categoria}</span>
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 leading-[1.1]">{producto.nombre}</h1>
          </div>

          <div className="flex items-baseline gap-4 mb-10">
            <span className="text-3xl font-light text-slate-900">{soles(producto.precioFinal)}</span>
            {producto.tieneDescuento && (
              <span className="text-lg text-slate-300 line-through font-light decoration-slate-300/40">
                {soles(producto.precioOriginal)}
              </span>
            )}
          </div>

          {/* Selector de Tallas */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Talla</label>
              <button className="text-[10px] text-slate-300 uppercase underline underline-offset-4 hover:text-slate-900 transition-colors">Guía de tallas</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tallasDisponibles.map(t => (
                <button
                  key={t}
                  onClick={() => { setTallaSel(t); setColorSel(null); }}
                  className={`min-w-[50px] px-4 py-2 text-xs font-bold rounded-lg border transition-all ${tallaSel === t ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Colores */}
          <div className="space-y-4 mb-10">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Color: <span className="text-slate-900">{colorSel || "—"}</span></label>
            <div className="flex flex-wrap gap-3">
              {coloresDisponibles.map(c => {
                const vari = producto.variantes.find(v => v.color === c);
                return (
                  <button
                    key={c}
                    onClick={() => setColorSel(c)}
                    className={`w-9 h-9 rounded-full border-2 p-0.5 transition-all flex items-center justify-center ${colorSel === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    title={c}
                  >
                    <span 
                      className="w-full h-full rounded-full border border-black/5" 
                      style={{ backgroundColor: vari?.hex || '#ccc' }} 
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disponibilidad Stock */}
          {stockActual !== null && (
            <div className="mb-6 animate-in fade-in duration-300">
               <p className={`text-xs font-medium ${stockActual === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                 {stockActual === 0 
                   ? 'Agotado para esta variante.' 
                   : `✓ Disponibilidad inmediata (${stockActual} unidades)`}
               </p>
            </div>
          )}

          {/* Botón Principal (WhatsApp) */}
          <button
            onClick={contactarWhatsApp}
            disabled={stockActual === 0}
            className="w-full py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {stockActual === 0 ? 'No Disponible' : 'Solicitar por WhatsApp'}
          </button>

          {/* Descripción de Producto */}
          <div className="mt-12 pt-8 border-t border-slate-100 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Descripción y Detalles</h3>
             <div className="text-sm text-slate-500 font-light leading-relaxed whitespace-pre-wrap">
                {producto.descripcion || "Esta pieza de Elara Atelier destaca por su corte impecable y la calidad de sus tejidos, diseñada para durar y acompañarte en tus mejores momentos."}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}