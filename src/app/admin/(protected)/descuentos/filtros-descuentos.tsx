"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FiltrosDescuentos({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  // Debounce para evitar recargas excesivas al escribir
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== initialQ) {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        router.replace(`/admin/descuentos?${params.toString()}`);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [q, initialQ, router]);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Buscar en campañas</label>
      <div className="relative">
        <input
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
          placeholder="Nombre del producto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
    </div>
  );
}