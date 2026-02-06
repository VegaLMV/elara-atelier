import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string;
    icon: ReactNode;
    color: string;
    trend?: { value: number; label: string };
}

export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                {trend && (
                    <p className={`text-xs font-bold mt-1 ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                    </p>
                )}
            </div>
        </div>
    );
}
