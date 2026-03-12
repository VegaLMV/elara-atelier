"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

type ImagenCategoria = {
    id: string;
    url: string;
    esPortada: boolean;
    orden: number;
};

type Categoria = {
    id: string;
    nombre: string;
    slug: string;
    imagenes: ImagenCategoria[];
    _count: { productos: number };
};

// ============================================================
// COMPONENTE TARJETA (Maneja su propio Slideshow al hacer hover)
// ============================================================
function CategoryCard({ categoria }: { categoria: Categoria }) {
    const [isHovered, setIsHovered] = useState(false);
    const isEmpty = categoria._count.productos === 0;

    // Buscamos cuál es la imagen de portada por defecto
    const defaultIndex = useMemo(() => {
        const idx = categoria.imagenes.findIndex(img => img.esPortada);
        return idx >= 0 ? idx : 0;
    }, [categoria.imagenes]);

    const [activeIndex, setActiveIndex] = useState(defaultIndex);

    // Efecto para el Slideshow Lento
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        // Si está hovered, tiene más de 1 imagen y no está vacía la categoría...
        if (isHovered && categoria.imagenes.length > 1 && !isEmpty) {
            interval = setInterval(() => {
                setActiveIndex((current) => (current + 1) % categoria.imagenes.length);
            }, 1600); // Cambia de foto cada 1.6 segundos
        } else {
            // Si el mouse sale, vuelve suavemente a la imagen de portada
            setActiveIndex(defaultIndex);
        }

        return () => clearInterval(interval);
    }, [isHovered, categoria.imagenes.length, isEmpty, defaultIndex]);

    const Wrapper = isEmpty ? "div" : Link;

    return (
        <Wrapper
            href={!isEmpty ? `/tienda/catalogo?categoria=${categoria.slug}` : "#"}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            // TAMAÑO REDUCIDO: Se ajustaron los anchos (w-[280px], w-[320px], w-[360px]) 
            // y se mantuvo el snap para móviles.
            className={`group relative overflow-hidden rounded-2xl md:rounded-[1.5rem] shadow-xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] block snap-center
                w-[65vw] sm:w-[280px] md:w-[320px] lg:w-[360px] shrink-0
                ${!isEmpty ? 'hover:shadow-2xl hover:shadow-[#3f2f2f]/30 hover:-translate-y-2 cursor-pointer' : 'cursor-default'}
            `}
        >
            {/* Marco de Galería Interno (Más fino y elegante) */}
            <div className="absolute inset-2 md:inset-3 border border-white/30 z-20 pointer-events-none mix-blend-overlay rounded-xl transition-all duration-700 group-hover:inset-2" />

            {/* Contenedor de Imágenes - Alturas reducidas en proporción */}
            <div className="relative h-[320px] sm:h-[380px] md:h-[480px] overflow-hidden bg-[#e6dad1]/20">
                {categoria.imagenes.length > 0 ? (
                    // Envoltorio para el "Zoom" ultra lento
                    <div className={`absolute inset-0 w-full h-full transition-transform duration-[15s] ease-out 
                        ${isHovered && !isEmpty ? 'scale-110' : 'scale-100'} 
                        ${isEmpty ? 'grayscale-[0.8] opacity-70' : ''}`}
                    >
                        {/* Iteramos y montamos TODAS las imágenes de la categoría */}
                        {categoria.imagenes.map((img, idx) => (
                            <Image
                                key={img.id}
                                src={img.url}
                                alt={categoria.nombre}
                                fill
                                sizes="(max-width: 768px) 65vw, (max-width: 1200px) 320px, 360px"
                                className={`object-cover absolute inset-0 transition-opacity duration-1000 ease-in-out
                                    ${activeIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                                `}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif italic text-[#3f2f2f]/30 bg-[#e6dad1]/30 relative z-10 text-sm md:text-base">
                        Curando selección...
                    </div>
                )}

                {/* Overlay Gradient Doble para legibilidad */}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#1a1311] via-[#1a1311]/40 md:via-[#1a1311]/20 to-transparent transition-opacity duration-1000 z-10
                    ${isHovered && !isEmpty ? 'opacity-90' : 'opacity-80 md:opacity-70'}`} 
                />
            </div>

            {/* Contenido (Textos Flotantes) */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8 z-30">
                <div className={`transform transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHovered && !isEmpty ? 'translate-y-0' : 'translate-y-2 md:translate-y-4'}`}>
                    
                    <h3 className={`font-serif text-2xl sm:text-3xl md:text-4xl mb-2 transition-colors duration-500 leading-tight
                        ${isEmpty ? 'text-[#e6dad1]/70' : 'text-[#fcfaf8] group-hover:text-white'}`}>
                        {categoria.nombre}
                    </h3>
                    
                    {isEmpty ? (
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 md:w-8 h-[1px] bg-[#e6dad1]/50" />
                            <p className="text-[#e6dad1]/70 text-[9px] md:text-xs font-light italic uppercase tracking-widest">
                                PRÓXIMAMENTE
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-[#e6dad1]/90 md:text-[#e6dad1]/80 text-[10px] md:text-xs font-light tracking-wider uppercase">
                                {categoria._count.productos} {categoria._count.productos === 1 ? 'Pieza exclusiva' : 'Piezas'}
                            </p>
                            
                            {/* Botón Circular Reducido */}
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-all duration-500 delay-100
                                ${isHovered ? 'opacity-100 translate-x-0 rotate-0 bg-white text-[#3f2f2f]' : 'opacity-100 md:opacity-0 translate-x-0 md:-translate-x-6 -rotate-45 text-white'}`}>
                                <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={isHovered ? 2.5 : 2} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Badge Superior */}
            {isEmpty && (
                <div className="absolute top-4 left-4 bg-[#3f2f2f]/90 backdrop-blur-md px-3 py-1.5 rounded-sm text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#e6dad1] border-l border-[#864d2d] z-30 shadow-xl">
                    Próximamente
                </div>
            )}
        </Wrapper>
    );
}
// ============================================================
// COMPONENTE PRINCIPAL (Sección)
// ============================================================
export default function CategoriesSection({ categorias }: { categorias: Categoria[] }) {
    const gruposDeRepeticion = [1, 2, 3, 4, 5]; 

    return (
        <section className="py-20 md:py-32 bg-[#fdfbf9] relative overflow-hidden">
            {/* CSS Inyectado */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-20%); } 
                }
                
                @media (min-width: 768px) {
                    .md-animate-marquee {
                        animation: marquee 50s linear infinite; 
                    }
                    .md-animate-marquee:hover, .md-animate-marquee:active {
                        animation-play-state: paused;
                    }
                }

                .hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                .hide-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />

            {/* TEXTO FANTASMA "ATELIER" - Movido arriba a la izquierda */}
            <div className="absolute top-10 md:top-20 left-[-2%] md:left-[-3%] pointer-events-none select-none z-0">
                <h2 className="text-[28vw] md:text-[18vw] font-serif uppercase tracking-widest text-[#3f2f2f] opacity-[0.03] whitespace-nowrap leading-none">
                    Atelier
                </h2>
            </div>

            {/* Detalles de fondo (Luces suaves) */}
            <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-[#e6dad1]/40 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-[#864d2d]/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none z-0" />
            
            <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full">
                {/* Header Editorial */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-8 md:gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#864d2d] flex items-center gap-3">
                            <Sparkles className="w-3.5 h-3.5" /> Nuestro Catálogo
                        </span>
                        <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-[#3f2f2f] leading-[1.1] tracking-tight">
                            Colecciones <br />
                            <span className="italic text-[#864d2d] font-light">Destacadas</span>
                        </h2>
                    </div>
                    
                    {/* Párrafo descriptivo - Ahora es visible en versión Móvil (se eliminó hidden) */}
                    <div className="flex flex-col pb-2 md:pb-4 mt-2 md:mt-0">
                        <div className="w-16 md:w-24 h-[1px] bg-[#864d2d]/30 mb-4 md:mb-5" />
                        <p className="text-[#3f2f2f]/60 font-light text-sm md:text-sm max-w-xs leading-relaxed">
                            Nuestras piezas fluyen con tu estilo. Selecciona la colección que defina tu próxima declaración de moda.
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR DEL CARRUSEL */}
            <div className="relative w-full overflow-x-auto md:overflow-hidden pb-12 md:pb-16 pt-4 hide-scroll snap-x snap-mandatory pl-6 md:pl-0 z-20">
                <div className="flex w-max md-animate-marquee items-center">
                    {gruposDeRepeticion.map((grupoId) => (
                        <div key={grupoId} className="flex gap-4 md:gap-6 lg:gap-8 pr-4 md:pr-6 lg:pr-8">
                            {categorias.map((categoria) => (
                                <CategoryCard 
                                    key={`${grupoId}-${categoria.id}`} 
                                    categoria={categoria} 
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}