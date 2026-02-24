"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function LiveSearchInput({ initialQuery }: { initialQuery: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [term, setTerm] = useState(initialQuery);
    
    // Usamos un Ref para saber si es la primera vez que carga la página
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Evitamos que se dispare solo por cargar la página
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            
            if (term) {
                params.set("q", term);
            } else {
                params.delete("q");
            }
            
            params.delete("page"); 
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [term]); 

    return (
        <div className="w-full md:w-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f2f2f]/40 group-focus-within:text-[#864d2d] transition-colors" />
            <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar en el atelier..."
                className="w-full md:w-80 bg-transparent border-b border-[#e6dad1] px-12 py-3 text-sm text-[#3f2f2f] placeholder:text-[#3f2f2f]/30 focus:border-[#864d2d] transition-all outline-none rounded-none"
            />
        </div>
    );
}