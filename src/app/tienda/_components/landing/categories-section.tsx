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
            }, 1600); // Cambia de foto cada 2.5 segundos (Muy elegante y lento)
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
            className={`group relative overflow-hidden rounded-[2rem] shadow-lg transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] block
                w-[80vw] sm:w-[350px] md:w-[400px] lg:w-[420px] shrink-0
                ${!isEmpty ? 'hover:shadow-2xl hover:shadow-[#3f2f2f]/20 hover:-translate-y-2 cursor-pointer' : 'cursor-default'}
            `}
        >
            {/* Marco de Galería Interno */}
            <div className="absolute inset-4 border border-[#e6dad1]/40 z-20 pointer-events-none mix-blend-overlay rounded-xl transition-all duration-700 group-hover:inset-3" />

            {/* Contenedor de Imágenes */}
            <div className="relative h-[450px] md:h-[550px] overflow-hidden bg-[#e6dad1]/20">
                {categoria.imagenes.length > 0 ? (
                    // Envoltorio para el "Zoom" ultra lento que afecta a todas las imágenes
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
                                sizes="(max-width: 768px) 85vw, (max-width: 1200px) 400px, 450px"
                                className={`object-cover absolute inset-0 transition-opacity duration-1000 ease-in-out
                                    ${activeIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                                `}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif italic text-[#3f2f2f]/30 bg-[#e6dad1]/30 relative z-10">
                        Curando selección...
                    </div>
                )}

                {/* Overlay Gradient Doble para que los textos blancos sean legibles siempre */}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#3f2f2f] via-[#3f2f2f]/20 to-transparent transition-opacity duration-1000 z-10
                    ${isHovered && !isEmpty ? 'opacity-90' : 'opacity-60'}`} 
                />
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply z-10" />
            </div>

            {/* Contenido (Textos Flotantes) */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 z-30">
                <div className={`transform transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${isHovered && !isEmpty ? 'translate-y-0' : 'translate-y-4'}`}>
                    
                    <h3 className={`font-serif text-4xl md:text-5xl mb-3 transition-colors duration-500 
                        ${isEmpty ? 'text-[#e6dad1]/70' : 'text-[#fcfaf8] group-hover:text-white'}`}>
                        {categoria.nombre}
                    </h3>
                    
                    {isEmpty ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-[1px] bg-[#e6dad1]/50" />
                            <p className="text-[#e6dad1]/70 text-sm font-light italic uppercase tracking-widest">
                                PROXIMAMENTE
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <p className="text-[#e6dad1]/80 text-sm font-light tracking-wider">
                                {categoria._count.productos} {categoria._count.productos === 1 ? 'Pieza exclusiva' : 'Piezas exclusivas'}
                            </p>
                            
                            {/* Botón Circular */}
                            <div className={`w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all duration-500 delay-100
                                ${isHovered ? 'opacity-100 translate-x-0 rotate-0' : 'opacity-0 -translate-x-8 -rotate-45'}`}>
                                <ArrowRight className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Badge Superior */}
            {isEmpty && (
                <div className="absolute top-8 left-8 bg-[#3f2f2f]/90 backdrop-blur-md px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.4em] text-[#e6dad1] border-l-2 border-[#864d2d] z-30 shadow-2xl">
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
    // Creamos 4 repeticiones de las categorías para asegurar un bucle infinito
    const gruposDeRepeticion = [1, 2, 3, 4];

    return (
        <section className="py-24 md:py-32 bg-[#fcfaf8] relative overflow-hidden">
            {/* CSS Inyectado para la animación infinita del Carrusel */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-25%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
                .animate-marquee:hover, .animate-marquee:active {
                    animation-play-state: paused;
                }
                @media (max-width: 768px) {
                    .animate-marquee {
                        animation-duration: 30s;
                    }
                }
            `}} />

            {/* Detalles de fondo */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e6dad1]/30 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* Header Editorial */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-[#864d2d] flex items-center gap-3">
                            <Sparkles className="w-4 h-4" /> Nuestro Catálogo
                        </span>
                        <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-[#3f2f2f] leading-tight tracking-tight">
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

            {/* CONTENEDOR DEL CARRUSEL INFINITO */}
            <div className="relative w-full overflow-hidden pb-12 pt-4">
                <div className="flex w-max animate-marquee">
                    {gruposDeRepeticion.map((grupoId) => (
                        <div key={grupoId} className="flex gap-6 md:gap-8 pr-6 md:pr-8">
                            {categorias.map((categoria) => (
                                // Usamos el nuevo componente inteligente que maneja sus propias animaciones
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