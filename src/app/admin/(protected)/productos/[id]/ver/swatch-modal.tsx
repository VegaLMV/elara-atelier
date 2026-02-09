"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";

type Props = {
  hex: string | null;
  nombre: string;
};

export function SwatchModal({ hex, nombre }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const background = useMemo(() => {
    if (!hex) return "linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)";
    const codes = hex.split(",").map(c => c.trim()).filter(Boolean);
    if (codes.length <= 1) return codes[0] || "#fff";

    const percentage = 100 / codes.length;
    const stops = codes.map((c, i) => `${c} ${i * percentage}% ${(i + 1) * percentage}%`).join(", ");
    return `linear-gradient(135deg, ${stops})`;
  }, [hex]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-full border border-gray-200 shadow-sm hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-slate-400 transition-all"
        style={{ background }}
        title={`Ver color: ${nombre}`}
      />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs relative flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg ring-1 ring-gray-100" style={{ background }} />

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{nombre}</h3>
              <p className="text-sm font-mono text-gray-500 mt-1 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                {hex || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}