import Image from "next/image";

interface BrandValuesProps {
    tagline?: string;
    title?: string;
    body?: string;
    imageUrl?: string;
    quote?: string;
}

export default function BrandValues({ tagline, title, body, imageUrl, quote }: BrandValuesProps) {
    return (
        <section className="bg-slate-900 text-white py-24 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-emerald-500/5 blur-[100px] rounded-full" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        {tagline && <span className="text-indigo-400 font-bold text-xs uppercase tracking-[0.3em]">{tagline}</span>}
                        <h2 className="text-5xl md:text-6xl font-serif leading-tight">
                            {title || "Elegancia que Trasciende el Tiempo"}
                        </h2>
                        <p className="text-slate-400 text-lg font-light leading-relaxed max-w-lg">
                            {body || "En Elara Atelier, creemos que la moda es una extensión de tu identidad."}
                        </p>
                        <div className="pt-4 grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-xl mb-2">100% Sostenible</h4>
                                <p className="text-slate-500 text-sm">Compromiso real con procesos éticos y materiales responsables.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-2">Edición Limitada</h4>
                                <p className="text-slate-500 text-sm">Exclusividad garantizada para que resaltes en cada ocasión.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="aspect-[4/5] rounded-[2rem] overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700 shadow-2xl shadow-black/50">
                            <Image
                                src={imageUrl || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800"}
                                alt="Atelier Essence"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover scale-110"
                            />
                        </div>
                        {quote && (
                            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl hidden md:block">
                                <p className="text-slate-900 font-serif italic text-2xl leading-tight">
                                    "{quote}"
                                </p>
                                <p className="text-slate-400 text-xs mt-4 font-bold uppercase tracking-widest">— Elara Team</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
