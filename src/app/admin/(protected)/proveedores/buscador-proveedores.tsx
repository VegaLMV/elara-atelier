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
    <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all w-full">
      <div className="p-3 text-slate-400">
         <Search className="w-5 h-5" />
      </div>
      <div className="relative flex-1">
        <input
          className="w-full py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-700 font-medium"
          placeholder="Buscar por nombre, RUC, razón social o teléfono..."
          defaultValue={searchParams.get("q")?.toString()}
          onChange={(e) => {
            const value = e.target.value;
            const timeoutId = setTimeout(() => handleSearch(value), 300);
            return () => clearTimeout(timeoutId);
          }}
        />
      </div>
    </div>
  );
}