import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionCategory {
    title: string;
    slug: string;
    image: string;
}

interface FeaturedCategoriesProps {
    title?: string;
    subtitle?: string;
    categories?: SectionCategory[];
}

export default function FeaturedCategories({ title, subtitle, categories }: FeaturedCategoriesProps) {
    if (!categories || categories.length === 0) return null;

    return (
        <section className="max-w-[1600px] mx-auto px-6 py-24">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-serif font-medium text-slate-900 leading-tight">
                        {title || "Explora Nuestras Colecciones"}
                    </h2>
                    {subtitle && (
                        <p className="text-slate-500 font-light max-w-md">
                            {subtitle}
                        </p>
                    )}
                </div>
                <Link
                    href="/tienda/catalogo"
                    className="text-slate-900 font-bold text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-1 hover:text-indigo-600 hover:border-indigo-600 transition-all flex items-center gap-2"
                >
                    Ver Todo el Catálogo <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat, i) => (
                    <Link
                        key={i}
                        href={`/tienda/catalogo?categoria=${cat.slug}#catalogo-grid`}
                        className={`group relative overflow-hidden rounded-3xl aspect-[4/3] md:aspect-square ${i % 3 === 0 ? "lg:col-span-2" : "lg:col-span-1"}`}
                    >
                        <img
                            src={cat.image}
                            alt={cat.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

                        <div className="absolute bottom-8 left-8 right-8 text-white space-y-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                            <h3 className="text-3xl font-serif font-medium">{cat.title}</h3>
                            <p className="text-white/70 text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                Descubre la selección completa y exclusiva
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
