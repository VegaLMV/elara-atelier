"use client";

import { useState } from "react";
import { Settings2, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface Column {
    id: string;
    label: string;
    enabled: boolean;
}

interface ReportCustomizerProps {
    columns: Column[];
    onColumnsChange: (columns: Column[]) => void;
    onNoteChange: (note: string) => void;
    currentNote: string;
}

export function ReportCustomizer({
    columns,
    onColumnsChange,
    onNoteChange,
    currentNote,
}: ReportCustomizerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleColumn = (id: string) => {
        const newColumns = columns.map((col) =>
            col.id === id ? { ...col, enabled: !col.enabled } : col
        );
        onColumnsChange(newColumns);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-gray-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm"
            >
                <Settings2 className="w-4 h-4" />
                Personalizar Exportación
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ajustes del Reporte</h4>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Columnas */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Columnas Visibles</p>
                            <div className="grid grid-cols-1 gap-1">
                                {columns.map((col) => (
                                    <button
                                        key={col.id}
                                        onClick={() => toggleColumn(col.id)}
                                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${col.enabled
                                                ? "bg-slate-900 text-white"
                                                : "bg-gray-50 text-gray-500 border border-gray-100"
                                            }`}
                                    >
                                        {col.label}
                                        {col.enabled && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notas */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Nota en Pie de Página</p>
                            <textarea
                                value={currentNote}
                                onChange={(e) => onNoteChange(e.target.value)}
                                placeholder="Escribe una observación..."
                                className="w-full h-20 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none resize-none transition-all bg-gray-50/50"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
