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
            
            {/* Animación CSS Inyectada (Bucle Infinito Fluido) */}
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
                        animation-duration: 35s; 
                    }
                }
            `}} />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* Cabecera Editorial (Sin botones, 100% limpia) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-[1px] bg-[#864d2d]/50" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#864d2d]/80">
                                Curaduría Adicional
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#3f2f2f] leading-tight tracking-tight">
                            Completando tu <span className="italic text-[#864d2d]">colección</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* CONTENEDOR DEL CARRUSEL INFINITO */}
            {/* Se sale del max-w para que las tarjetas fluyan de borde a borde de la pantalla */}
            <div className="relative w-full overflow-hidden pb-12 pt-4">
                
                {/* Gradientes laterales para enmarcar el desfile */}
                <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-[#fcfaf8] to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-[#fcfaf8] to-transparent z-20 pointer-events-none" />

                {/* La Pista (Track) que se mueve */}
                <div className="flex w-max animate-marquee hover:cursor-grab active:cursor-grabbing">
                    
                    {/* Renderizamos los 4 grupos idénticos */}
                    {gruposDeRepeticion.map((grupoId) => (
                        <div key={grupoId} className="flex gap-6 md:gap-8 pr-6 md:pr-8">
                            {productos.map((p) => (
                                <div
                                    key={`${grupoId}-${p.id}`}
                                    className="w-[75vw] sm:w-[280px] lg:w-[320px] shrink-0"
                                >
                                    {/* Pasamos el producto a nuestra tarjeta rediseñada */}
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