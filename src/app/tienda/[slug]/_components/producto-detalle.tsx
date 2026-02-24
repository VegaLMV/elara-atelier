"use client";

import { useState, useMemo, useEffect } from "react";
import SimilarProductsSection from "./similar-products-section";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { X, ZoomIn, ArrowLeft } from "lucide-react";

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
    const router = useRouter();
    const { addItem, openCart } = useCartStore();
    const [imgActiva, setImgActiva] = useState<string | null>(producto.imagenes[0] || null);
    const [tallaSel, setTallaSel] = useState<string | null>(null);
    const [colorSel, setColorSel] = useState<string | null>(null);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const [aceptaTerminos, setAceptaTerminos] = useState(false);

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

    const handleAddToCart = () => {
        if (!varianteElegida) return;

        addItem({
            productoId: producto.nombre, 
            varianteId: varianteElegida.id,
            nombre: producto.nombre,
            precio: producto.precioFinal,
            cantidad: 1,
            talla: tallaSel,
            color: colorSel,
            imagen: imagenParaMensaje || producto.imagenes[0]
        });

        openCart();
    };

    const soles = (v: number) => `S/ ${v.toFixed(2)}`;

    function getColorStyle(hex: string | null) {
        if (!hex) return { backgroundColor: '#f0ebe6' };
        const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
        if (codes.length <= 1) return { backgroundColor: codes[0] || '#f0ebe6' };

        const percentage = 100 / codes.length;
        const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
        return { background: `linear-gradient(135deg, ${stops})` };
    }

    return (
        <div className="bg-[#fcfaf8] min-h-screen">
            <section className="max-w-[1400px] mx-auto px-6 py-6 md:py-10">

                {/* 👇 BOTÓN ATRÁS (NUEVO) 👇 */}
                <div className="mb-8">
                    <button 
                        onClick={() => router.back()} 
                        className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#3f2f2f]/60 hover:text-[#864d2d] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" /> 
                        Volver
                    </button>
                </div>

                {/* MODAL: GUÍA DE TALLAS */}
                {isSizeGuideOpen && (
                    <div
                        className="fixed inset-0 z-[60] bg-[#3f2f2f]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                        onClick={() => setIsSizeGuideOpen(false)}
                    >
                        <div
                            className="bg-[#fcfaf8] w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-[#e6dad1]/50 flex justify-between items-center bg-white">
                                <h3 className="font-serif text-2xl text-[#3f2f2f] italic">Guía de Tallas</h3>
                                <button onClick={() => setIsSizeGuideOpen(false)} className="text-[#3f2f2f]/50 hover:text-[#864d2d] transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-[#e6dad1] text-[#864d2d] uppercase text-[9px] tracking-[0.2em]">
                                                <th className="pb-3 font-bold">Talla</th>
                                                <th className="pb-3 font-bold">Busto (cm)</th>
                                                <th className="pb-3 font-bold">Cintura (cm)</th>
                                                <th className="pb-3 font-bold">Cadera (cm)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[#3f2f2f]/80 divide-y divide-[#e6dad1]/30">
                                            <tr><td className="py-3 font-bold text-[#3f2f2f]">S</td><td className="py-3">84 - 88</td><td className="py-3">64 - 68</td><td className="py-3">92 - 96</td></tr>
                                            <tr><td className="py-3 font-bold text-[#3f2f2f]">M</td><td className="py-3">89 - 93</td><td className="py-3">69 - 73</td><td className="py-3">97 - 101</td></tr>
                                            <tr><td className="py-3 font-bold text-[#3f2f2f]">L</td><td className="py-3">94 - 98</td><td className="py-3">74 - 78</td><td className="py-3">102 - 106</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-6 text-[10px] text-[#3f2f2f]/50 italic font-serif">
                                    * Medidas referenciales tomadas sobre el cuerpo. Si estás entre dos tallas, te sugerimos la más grande para un fit más holgado.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: ZOOM IMAGEN */}
                {isZoomOpen && imgActiva && (
                    <div
                        className="fixed inset-0 z-[70] bg-[#fcfaf8]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                        onClick={() => setIsZoomOpen(false)}
                    >
                        <button className="absolute top-6 right-6 p-3 bg-white border border-[#e6dad1] text-[#3f2f2f] hover:text-[#864d2d] rounded-full transition-colors z-10 shadow-sm">
                            <X className="w-5 h-5" />
                        </button>
                        <Image
                            src={imgActiva}
                            alt="Zoom Élara Atelier"
                            width={1600}
                            height={2000}
                            className="max-h-full max-w-full object-contain animate-in zoom-in-95 duration-500 rounded-sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    
                    {/* --- 1. SECCIÓN VISUAL (GALERÍA) --- */}
                    <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 md:gap-6">
                        
                        {/* Miniaturas (Vertical en PC, Horizontal en Móvil) */}
                        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-24 shrink-0">
                            {producto.imagenes.filter(url => url && url.trim() !== "").map((url, i) => (
                                <button 
                                    key={i} 
                                    onMouseEnter={() => setImgActiva(url)} 
                                    onClick={() => setImgActiva(url)} 
                                    className={`w-20 md:w-full aspect-[3/4] rounded-sm overflow-hidden border transition-all shrink-0 
                                        ${imgActiva === url ? 'border-[#864d2d] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <Image
                                        src={url}
                                        alt={`Vista ${i + 1}`}
                                        width={100}
                                        height={133}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Imagen Principal */}
                        <div 
                            className="flex-1 aspect-[3/4] bg-[#f0ebe6] rounded-sm overflow-hidden relative cursor-zoom-in group" 
                            onClick={() => setIsZoomOpen(true)}
                        >
                            {imgActiva && imgActiva.trim() !== "" ? (
                                <>
                                    <Image
                                        src={imgActiva}
                                        alt={producto.nombre}
                                        fill
                                        priority
                                        className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                                        sizes="(max-width: 1024px) 100vw, 60vw"
                                    />
                                    {/* Icono de Lupa flotante al pasar el mouse */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                        <ZoomIn className="w-6 h-6 stroke-[1.5]" />
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#3f2f2f]/30 space-y-3">
                                    <span className="font-serif italic text-sm">Imagen en curaduría</span>
                                </div>
                            )}

                            {/* Badge Promocional Elegante */}
                            {producto.tieneDescuento && (
                                <div className="absolute top-5 left-5 bg-[#864d2d] text-white text-[10px] font-black px-4 py-2 rounded-sm tracking-[0.2em] uppercase z-10 shadow-sm">
                                    {producto.descuentoTag} OFF
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- 2. SECCIÓN DE INFORMACIÓN Y COMPRA --- */}
                    <div className="lg:col-span-5 flex flex-col md:pt-4">
                        
                        {/* Cabecera del Producto */}
                        <div className="mb-8 border-b border-[#e6dad1]/50 pb-8">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#864d2d]/70 block mb-3">
                                {producto.categoria || "Colección Exclusiva"}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-serif text-[#3f2f2f] mb-6 leading-[1.1] tracking-tight">
                                {producto.nombre}
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className={`text-2xl font-medium ${producto.tieneDescuento ? 'text-[#864d2d]' : 'text-[#3f2f2f]'}`}>
                                    {soles(producto.precioFinal)}
                                </span>
                                {producto.tieneDescuento && (
                                    <span className="text-lg text-[#3f2f2f]/40 line-through font-light">
                                        {soles(producto.precioOriginal)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Selectores */}
                        <div className="space-y-8 mb-10">

                            {/* Selector de Talla */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end text-xs">
                                    <span className="font-bold text-[#3f2f2f] uppercase tracking-[0.2em]">Talla</span>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIsSizeGuideOpen(true)}
                                            className="text-[#3f2f2f]/60 hover:text-[#864d2d] transition-colors flex items-center gap-1 font-serif italic text-sm"
                                        >
                                            Ver guía de tallas
                                        </button>
                                        {tallaSel && (
                                            <button onClick={() => setTallaSel(null)} className="text-[#864d2d]/60 hover:text-[#864d2d] underline text-xs">Limpiar</button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {tallasDisponibles.map(t => (
                                        <button 
                                            key={t} 
                                            onClick={() => { 
                                                setTallaSel(t); 
                                                if (colorSel && !producto.variantes.some(v => v.talla === t && v.color === colorSel)) setColorSel(null); 
                                            }} 
                                            className={`h-12 min-w-[3.5rem] px-4 text-sm font-medium rounded-sm border transition-all duration-300 
                                                ${tallaSel === t 
                                                    ? 'bg-[#3f2f2f] border-[#3f2f2f] text-[#fcfaf8]' 
                                                    : 'bg-white border-[#e6dad1] text-[#3f2f2f] hover:border-[#864d2d]'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                                            {/* Selector de Color */}
                            <div className="space-y-3">
                                <div className="flex gap-2 items-center text-xs">
                                    <span className="font-bold text-[#3f2f2f] uppercase tracking-[0.2em]">Color:</span>
                                    <span className="text-[#3f2f2f]/60 font-serif italic text-sm">{colorSel || "Selecciona un tono"}</span>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {coloresDisponibles.map(c => {
                                        const vari = producto.variantes.find(v => v.color === c);
                                        return (
                                            <button 
                                                key={c} 
                                                onClick={() => setColorSel(c)} 
                                                className={`w-10 h-10 rounded-full border p-[3px] transition-all flex items-center justify-center 
                                                    ${colorSel === c ? 'border-[#864d2d] scale-110' : 'border-transparent hover:scale-105 hover:border-[#e6dad1]'}`} 
                                                title={c}
                                            >
                                                <span className="w-full h-full rounded-full shadow-sm" style={getColorStyle(vari?.hex || null)} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            </div>
                        </div>

                        {/* Botón de Compra y Términos */}
                        <div className="mt-auto space-y-6">
                            
                            {/* Checkbox de Términos (Estilo Boutique) */}
                            <div className="flex items-start gap-3 bg-white p-4 border border-[#e6dad1]/50 rounded-sm">
                                <div className="flex items-center h-5 mt-0.5">
                                    <input
                                        id="terminos"
                                        type="checkbox"
                                        checked={aceptaTerminos}
                                        onChange={(e) => setAceptaTerminos(e.target.checked)}
                                        className="w-4 h-4 text-[#3f2f2f] border-[#e6dad1] rounded-sm focus:ring-[#3f2f2f] focus:ring-offset-[#fcfaf8] cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="terminos" className="text-xs md:text-sm text-[#3f2f2f]/70 leading-relaxed cursor-pointer select-none">
                                    He leído y acepto los{" "}
                                    <Link
                                        href="/terminos-condiciones"
                                        target="_blank"
                                        className="text-[#3f2f2f] font-bold border-b border-[#3f2f2f]/30 hover:border-[#864d2d] hover:text-[#864d2d] transition-all pb-0.5"
                                    >
                                        Términos y Condiciones
                                    </Link>
                                    {" "} de la boutique.
                                </label>
                            </div>

                            {/* Botón de Acción Principal */}
                            <button
                                onClick={handleAddToCart}
                                disabled={stockActual === 0 || !tallaSel || !colorSel || !aceptaTerminos}
                                className={`w-full py-5 text-[11px] md:text-xs font-black uppercase tracking-[0.2em] rounded-sm transition-all duration-500 flex items-center justify-center gap-3
                                    ${aceptaTerminos && tallaSel && colorSel && stockActual !== 0
                                        ? 'bg-[#3f2f2f] text-white hover:bg-[#1a1515] hover:shadow-xl active:scale-[0.99]'
                                        : 'bg-[#e6dad1]/30 text-[#3f2f2f]/30 border border-[#e6dad1] cursor-not-allowed'
                                    }`}
                            >
                                {stockActual === 0 
                                    ? 'Agotado Temporalmente' 
                                    : (tallaSel && colorSel 
                                        ? (aceptaTerminos ? 'Añadir a mi colección' : 'Acepta los términos para continuar')
                                        : 'Selecciona Talla y Color'
                                    )
                                }
                            </button>
                        </div>

                        {/* Descripción / Detalles (Acordeón Visual Abierto) */}
                        <div className="mt-12 pt-8 border-t border-[#e6dad1]/50">
                            <h3 className="text-xs font-black text-[#3f2f2f] uppercase tracking-[0.2em] mb-4">
                                El Arte Detrás de la Pieza
                            </h3>
                            <div className="text-sm text-[#3f2f2f]/70 font-light leading-loose whitespace-pre-wrap">
                                {producto.descripcion || "Una silueta atemporal confeccionada con atención meticulosa a cada detalle, diseñada para elevar tu fondo de armario."}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* CSS ocultar barra de scroll para las miniaturas */}
            <style dangerouslySetInnerHTML={{ __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            {/* Sección de Productos Similares */}
            <SimilarProductsSection productos={producto.similares} />
        </div>
    );
}