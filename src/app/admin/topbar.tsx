"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [cargando, setCargando] = useState(false);

  async function logout() {
    setCargando(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCargando(false);
    router.replace("/admin/login");
  }

  // Helper para detectar link activo
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO / HOME */}
        <div className="flex items-center gap-8">
            <Link href="/admin" className="text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors">
              Elara Atelier <span className="text-slate-400 font-medium text-sm ml-1">Admin</span>
            </Link>

            {/* MENÚ DESKTOP */}
            <div className="hidden md:flex items-center gap-1">
                <NavLink href="/admin/productos" active={isActive("/admin/productos")}>Productos</NavLink>
                <NavLink href="/admin/compras" active={isActive("/admin/compras")}>Compras</NavLink>
                <NavLink href="/admin/kardex" active={isActive("/admin/kardex")}>Kardex</NavLink>
                
                {/* Menú "Más" o dropdown simple para secundarios */}
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                
                <NavLink href="/admin/proveedores" active={isActive("/admin/proveedores")}>Proveedores</NavLink>
                <NavLink href="/admin/descuentos" active={isActive("/admin/descuentos")}>Descuentos</NavLink>
            </div>
        </div>

        {/* PERFIL / LOGOUT */}
        <div className="flex items-center gap-4">
           {/* Puedes poner aquí el nombre del usuario si lo tienes en contexto/prop */}
           {/* <span className="text-sm text-gray-500 hidden sm:block">admin@elara.com</span> */}
           
           <button 
             onClick={logout} 
             disabled={cargando}
             className="text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
           >
             {cargando ? "Saliendo..." : "Cerrar sesión"}
           </button>
        </div>
      </div>
      
      {/* MENÚ MÓVIL (Simple scroll horizontal si hay muchos items) */}
      <div className="md:hidden overflow-x-auto pb-2 px-6 flex gap-4 text-sm font-medium text-gray-600 border-t pt-2 no-scrollbar">
          <Link href="/admin/productos" className={isActive("/admin/productos") ? "text-black" : ""}>Productos</Link>
          <Link href="/admin/compras" className={isActive("/admin/compras") ? "text-black" : ""}>Compras</Link>
          <Link href="/admin/kardex" className={isActive("/admin/kardex") ? "text-black" : ""}>Kardex</Link>
          <Link href="/admin/proveedores" className={isActive("/admin/proveedores") ? "text-black" : ""}>Proveedores</Link>
          <Link href="/admin/descuentos" className={isActive("/admin/descuentos") ? "text-black" : ""}>Campañas</Link>
      </div>
    </nav>
  );
}

// Componente auxiliar para links del menú
function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
    return (
        <Link 
            href={href} 
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
        >
            {children}
        </Link>
    )
}