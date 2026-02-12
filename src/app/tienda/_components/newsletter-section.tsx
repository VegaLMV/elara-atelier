import { Send } from "lucide-react";

interface NewsletterSectionProps {
    badge?: string;
    title?: string;
    subtitle?: string;
}

export default function NewsletterSection({ badge, title, subtitle }: NewsletterSectionProps) {
    return (
        <section className="bg-white py-32">
            <div className="max-w-5xl mx-auto px-6">
                <div className="bg-slate-50 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden border border-slate-100">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mb-12" />

                    <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                            {badge || "Acceso Exclusivo VIP"}
                        </div>

                        <h2 className="text-4xl md:text-5xl font-serif text-slate-900">
                            {title || "Únete a la Experiencia Elara Atelier"}
                        </h2>

                        <p className="text-slate-500 text-lg font-light leading-relaxed">
                            {subtitle || "Recibe notificaciones sobre nuevos lanzamientos y eventos privados."}
                        </p>

                        <form className="flex flex-col sm:flex-row gap-3 pt-4">
                            <input
                                type="email"
                                placeholder="Tu correo electrónico..."
                                className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
                            />
                            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                                Suscribirme <Send className="w-4 h-4" />
                            </button>
                        </form>

                        <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                            Respetamos tu privacidad. Cancela en cualquier momento.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
