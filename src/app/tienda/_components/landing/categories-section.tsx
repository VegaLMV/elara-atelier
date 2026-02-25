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
            // Ajustamos anchos y agregamos snap-center para celulares
            className={`group relative overflow-hidden rounded-2xl md:rounded-[2rem] shadow-lg transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] block snap-center
                w-[70vw] sm:w-[320px] md:w-[400px] lg:w-[420px] shrink-0
                ${!isEmpty ? 'hover:shadow-2xl hover:shadow-[#3f2f2f]/20 hover:-translate-y-2 cursor-pointer' : 'cursor-default'}
            `}
        >
            {/* Marco de Galería Interno */}
            <div className="absolute inset-3 md:inset-4 border border-[#e6dad1]/40 z-20 pointer-events-none mix-blend-overlay rounded-xl transition-all duration-700 group-hover:inset-3" />

            {/* Contenedor de Imágenes - Alturas reducidas en móvil */}
            <div className="relative h-[340px] sm:h-[400px] md:h-[550px] overflow-hidden bg-[#e6dad1]/20">
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
                                sizes="(max-width: 768px) 70vw, (max-width: 1200px) 400px, 420px"
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

                {/* Overlay Gradient Doble para que los textos blancos sean legibles siempre */}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#3f2f2f] via-[#3f2f2f]/30 md:via-[#3f2f2f]/20 to-transparent transition-opacity duration-1000 z-10
                    ${isHovered && !isEmpty ? 'opacity-90' : 'opacity-70 md:opacity-60'}`} 
                />
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply z-10" />
            </div>

            {/* Contenido (Textos Flotantes) */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 z-30">
                <div className={`transform transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHovered && !isEmpty ? 'translate-y-0' : 'translate-y-2 md:translate-y-4'}`}>
                    
                    <h3 className={`font-serif text-3xl sm:text-4xl md:text-5xl mb-2 md:mb-3 transition-colors duration-500 leading-tight
                        ${isEmpty ? 'text-[#e6dad1]/70' : 'text-[#fcfaf8] group-hover:text-white'}`}>
                        {categoria.nombre}
                    </h3>
                    
                    {isEmpty ? (
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 md:w-8 h-[1px] bg-[#e6dad1]/50" />
                            <p className="text-[#e6dad1]/70 text-[10px] md:text-sm font-light italic uppercase tracking-widest">
                                PROXIMAMENTE
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-[#e6dad1]/90 md:text-[#e6dad1]/80 text-xs md:text-sm font-light tracking-wider">
                                {categoria._count.productos} {categoria._count.productos === 1 ? 'Pieza exclusiva' : 'Piezas exclusivas'}
                            </p>
                            
                            {/* Botón Circular */}
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 md:bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 md:border-white/20 transition-all duration-500 delay-100
                                ${isHovered ? 'opacity-100 translate-x-0 rotate-0' : 'opacity-100 md:opacity-0 translate-x-0 md:-translate-x-8 -rotate-45'}`}>
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Badge Superior */}
            {isEmpty && (
                <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-[#3f2f2f]/90 backdrop-blur-md px-3 py-1.5 md:px-5 md:py-2.5 rounded-sm text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#e6dad1] border-l-2 border-[#864d2d] z-30 shadow-2xl">
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
    // Creamos repeticiones de las categorías para el bucle infinito (solo aplica a PC)
    const gruposDeRepeticion = [1, 2, 3, 4];

    return (
        <section className="py-16 md:py-32 bg-[#fcfaf8] relative overflow-hidden">
            {/* CSS Inyectado */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-25%); }
                }
                
                /* La animación solo ocurre en pantallas de PC (md para arriba) */
                @media (min-width: 768px) {
                    .md-animate-marquee {
                        animation: marquee 60s linear infinite;
                    }
                    .md-animate-marquee:hover, .md-animate-marquee:active {
                        animation-play-state: paused;
                    }
                }

                /* Ocultar barra de scroll en móviles */
                .hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                .hide-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />

            {/* Detalles de fondo */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#e6dad1]/30 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
            
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* Header Editorial */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-4 md:gap-8">
                    <div className="space-y-3 md:space-y-4 max-w-2xl">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#864d2d] flex items-center gap-2 md:gap-3">
                            <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> Nuestro Catálogo
                        </span>
                        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-[#3f2f2f] leading-tight tracking-tight">
                            Colecciones <br />
                            <span className="italic text-[#864d2d] font-light">Destacadas</span>
                        </h2>
                    </div>
                    <div className="hidden md:block pb-4">
                        <div className="w-24 h-[1px] bg-[#864d2d]/30 mb-4" />
                        <p className="text-[#3f2f2f]/60 font-light text-sm max-w-xs">
                            Nuestras piezas fluyen con tu estilo. Selecciona la colección que defina tu próximo look.
                        </p>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR DEL CARRUSEL (Nativo deslizable en Móvil, Animado en PC) */}
            <div className="relative w-full overflow-x-auto md:overflow-hidden pb-8 md:pb-12 pt-4 hide-scroll snap-x snap-mandatory pl-6 md:pl-0">
                <div className="flex w-max md-animate-marquee">
                    {gruposDeRepeticion.map((grupoId) => (
                        <div key={grupoId} className="flex gap-4 md:gap-8 pr-4 md:pr-8">
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