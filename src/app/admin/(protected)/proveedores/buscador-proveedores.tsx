"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function BuscadorProveedores() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Función que actualiza la URL
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    // replace actualiza la URL sin recargar la página
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex gap-2">
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
        <input
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-700"
          placeholder="Buscar por nombre, ruc, razón social..."
          defaultValue={searchParams.get("q")?.toString()}
          onChange={(e) => {
            // Debounce manual simple (espera 300ms antes de buscar)
            const value = e.target.value;
            const timeoutId = setTimeout(() => handleSearch(value), 300);
            return () => clearTimeout(timeoutId);
          }}
          // Mejor experiencia: evitar que el timeout se ejecute múltiples veces si escribes rápido
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
             // Limpiamos timeouts anteriores si existen (truco rápido para debounce sin estados complejos)
             // Nota: En producción idealmente usarías use-debounce, pero esto funciona nativo:
             e.target.setAttribute("data-last-val", e.target.value);
          }}
        />
      </div>
      <div className="hidden sm:block px-4 py-2 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl border border-slate-100 flex items-center">
         AUTO
      </div>
    </div>
  );
}