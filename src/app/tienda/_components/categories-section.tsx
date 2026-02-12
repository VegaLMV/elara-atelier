"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

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

export default function CategoriesSection({ categorias }: { categorias: Categoria[] }) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <section className="py-20 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#3f2f2f] mb-4">
                        Explora Nuestras Colecciones
                    </h2>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Descubre piezas únicas diseñadas con pasión y dedicación
                    </p>
                </div>

                {/* Grid de Categorías */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categorias.map((categoria) => {
                        const imagenPortada = categoria.imagenes.find(img => img.esPortada) || categoria.imagenes[0];
                        const isHovered = hoveredId === categoria.id;

                        return (
                            <Link
                                key={categoria.id}
                                href={`/tienda/catalogo?categoria=${categoria.slug}`}
                                onMouseEnter={() => setHoveredId(categoria.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Imagen de Fondo */}
                                <div className="relative h-96 overflow-hidden bg-slate-200">
                                    {imagenPortada ? (
                                        <img
                                            src={imagenPortada.url}
                                            alt={categoria.nombre}
                                            className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'
                                                }`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                            <p className="text-slate-400 font-serif text-2xl">Sin Imagen</p>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-90' : 'opacity-80'
                                        }`} />
                                </div>

                                {/* Contenido */}
                                <div className="absolute inset-0 flex flex-col justify-end p-8">
                                    <div className={`transform transition-all duration-500 ${isHovered ? 'translate-y-0' : 'translate-y-2'
                                        }`}>
                                        <h3 className="font-serif text-3xl font-bold text-white mb-2">
                                            {categoria.nombre}
                                        </h3>
                                        <p className="text-[#e6dad1] text-sm mb-4 font-medium">
                                            {categoria._count.productos} {categoria._count.productos === 1 ? 'Producto' : 'Productos'}
                                        </p>

                                        {/* CTA */}
                                        <div className={`flex items-center gap-2 text-white font-bold transition-all duration-500 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                                            }`}>
                                            <span>Ver Colección</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Badge con cantidad de imágenes */}
                                {categoria.imagenes.length > 1 && (
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#3f2f2f] border border-[#864d2d]/20">
                                        {categoria.imagenes.length} Imágenes
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Ver Catálogo Completo */}
                <div className="text-center mt-16">
                    <Link
                        href="/tienda/catalogo"
                        className="inline-flex items-center gap-3 bg-[#3f2f2f] text-[#e6dad1] px-10 py-4 rounded-full font-bold text-lg transition-all hover:bg-[#864d2d] hover:text-white hover:shadow-2xl hover:shadow-[#864d2d]/30 hover:-translate-y-1 active:translate-y-0"
                    >
                        Ver Todo el Catálogo
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
