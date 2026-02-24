import { Truck, ShieldCheck, HeartHandshake, Clock } from "lucide-react";
import ScrollReveal from "@/components/ui/scroll-reveal";

export default function BenefitsGrid() {
    const benefits = [
        {
            icon: Truck,
            title: "Envíos Seguros",
            description: "Cobertura a todo el país con seguimiento en tiempo real."
        },
        {
            icon: ShieldCheck,
            title: "Pagos Protegidos",
            description: "Tu información está segura con nosotros."
        },
        {
            icon: HeartHandshake,
            title: "Atención Personalizada",
            description: "Asesoría experta para ayudarte a elegir lo mejor."
        },
        {
            icon: Clock,
            title: "Despacho Rápido",
            description: "Procesamos tus pedidos en menos de 24 horas hábiles."
        }
    ];

    return (
        <section className="py-24 bg-white border-t border-slate-50">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((b, i) => (
                        <ScrollReveal key={i} delay={i * 0.15} direction="up">
                            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors duration-300 group">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <b.icon className="w-7 h-7 text-slate-700 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 font-serif">{b.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{b.description}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
