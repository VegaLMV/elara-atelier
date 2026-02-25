"use client";

import ProductoCard from "../../_components/shared/producto-card";

type Producto = {
    id: string;
    nombre: string;
    slug: string;
    categoria?: string;
    imagenes: string[];
    precioOriginal: number;
    precioFinal: number;
    tieneDescuento: boolean;
    porcentaje: number | null;
    esNuevo: boolean;
    stock: number;
    destacado: boolean;
};

type Props = {
    productos: Producto[];
};

export default function SimilarProductsSection({ productos }: Props) {
    if (productos.length === 0) return null;

    const gruposDeRepeticion = [1, 2, 3, 4];

    return (
        <section className="py-20 md:py-24 border-t border-[#e6dad1]/30 bg-[#fcfaf8] relative overflow-hidden">
            
            {/* Animación CSS Inyectada (Nativa en móvil, infinita en PC) */}
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

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* Cabecera Editorial (Sin botones, 100% limpia) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-6 md:w-8 h-[1px] bg-[#864d2d]/50" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#864d2d]/80">
                                Curaduría Adicional
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#3f2f2f] leading-tight tracking-tight">
                            Completando tu <span className="italic text-[#864d2d]">colección</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR DEL CARRUSEL (Nativo deslizable en Móvil, Animado en PC) */}
            <div className="relative w-full overflow-x-auto md:overflow-hidden pb-12 pt-4 hide-scroll snap-x snap-mandatory pl-6 md:pl-0">
                
                {/* Gradientes laterales para enmarcar el desfile (Ocultos en móvil para mejor scroll) */}
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#fcfaf8] to-transparent z-20 pointer-events-none" />
                <div className="hidden md:block absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#fcfaf8] to-transparent z-20 pointer-events-none" />

                {/* La Pista (Track) que se mueve */}
                <div className="flex w-max md-animate-marquee hover:cursor-grab active:cursor-grabbing">
                    
                    {/* Renderizamos los grupos idénticos */}
                    {gruposDeRepeticion.map((grupoId) => (
                        <div key={grupoId} className="flex gap-4 md:gap-8 pr-4 md:pr-8">
                            {productos.map((p) => (
                                <div
                                    key={`${grupoId}-${p.id}`}
                                    // Tarjetas reducidas en móvil (w-[60vw]) y con snap-center
                                    className="w-[60vw] sm:w-[280px] lg:w-[320px] shrink-0 snap-center md:snap-align-none"
                                >
                                    <ProductoCard producto={p} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}