import * as Icons from "lucide-react";

interface BenefitItem {
    icon: string;
    title: string;
    desc: string;
}

export default function TrustBar({ items }: { items?: BenefitItem[] }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="bg-slate-50 border-y border-slate-100">
            <div className="max-w-[1600px] mx-auto px-6 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {items.map((item, i) => {
                        const IconComponent = (Icons as any)[item.icon] || Icons.HelpCircle;
                        return (
                            <div key={i} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 bg-white border border-slate-100 text-slate-900 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm">
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm tracking-tight">{item.title}</h4>
                                    <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
