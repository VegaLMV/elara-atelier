"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
    basePath: string;
}

export function DateRangePicker({ basePath }: DateRangePickerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const preset = searchParams.get("preset") || "mes";

    const setPreset = (newPreset: string) => {
        const today = new Date();
        let newFrom: Date;
        let newTo: Date = today;

        switch (newPreset) {
            case "hoy":
                newFrom = today;
                break;
            case "semana":
                newFrom = new Date(today);
                newFrom.setDate(today.getDate() - 7);
                break;
            case "mes":
                newFrom = new Date(today);
                newFrom.setMonth(today.getMonth() - 1);
                break;
            case "trimestre":
                newFrom = new Date(today);
                newFrom.setMonth(today.getMonth() - 3);
                break;
            case "anio":
                newFrom = new Date(today);
                newFrom.setFullYear(today.getFullYear() - 1);
                break;
            default:
                return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set("from", newFrom.toISOString().split("T")[0]);
        params.set("to", newTo.toISOString().split("T")[0]);
        params.set("preset", newPreset);
        router.push(`${basePath}?${params.toString()}`);
    };

    const setCustomRange = (newFrom: string, newTo: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newFrom) params.set("from", newFrom);
        if (newTo) params.set("to", newTo);
        params.set("preset", "custom");
        router.push(`${basePath}?${params.toString()}`);
    };

    const presets = [
        { key: "hoy", label: "Hoy" },
        { key: "semana", label: "7 días" },
        { key: "mes", label: "30 días" },
        { key: "trimestre", label: "3 meses" },
        { key: "anio", label: "1 año" },
    ];

    return (
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Período:</span>
            </div>

            {/* Presets */}
            <div className="flex gap-1">
                {presets.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => setPreset(p.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${preset === p.key
                                ? "bg-slate-900 text-white shadow-lg"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Separador */}
            <div className="h-6 w-px bg-gray-200 mx-2" />

            {/* Custom Range */}
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={from}
                    onChange={(e) => setCustomRange(e.target.value, to)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
                <span className="text-gray-400 text-xs">—</span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => setCustomRange(from, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                />
            </div>
        </div>
    );
}
