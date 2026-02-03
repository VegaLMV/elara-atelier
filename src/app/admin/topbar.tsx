"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function AdminTopbar() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function logout() {
    setCargando(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCargando(false);
    router.replace("/admin/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-8">
            <Link href="/admin" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">EA</span>
              <span className="hidden sm:inline">Élara Atelier</span>
            </Link>

            {/* MENÚ DESKTOP */}
            <div className="hidden md:flex items-center gap-6">
                
                {/* --- NUEVO GRUPO: COMERCIAL (Ventas y Devoluciones) --- */}
                <DropdownMenu title="Comercial">
                    <DropdownItem href="/admin/ventas/nueva">➕ Nueva Venta (POS)</DropdownItem>
                    <DropdownItem href="/admin/ventas">📋 Historial Ventas</DropdownItem>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <DropdownItem href="/admin/devoluciones">↩️ Devoluciones</DropdownItem>
                </DropdownMenu>

                {/* GRUPO 1: CATÁLOGO */}
                <DropdownMenu title="Catálogo">
                    <DropdownItem href="/admin/productos">📦 Productos</DropdownItem>
                    <DropdownItem href="/admin/categorias">🏷️ Categorías</DropdownItem>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <DropdownItem href="/admin/descuentos">⚡ Campañas</DropdownItem>
                </DropdownMenu>

                {/* GRUPO 2: LOGÍSTICA */}
                <DropdownMenu title="Logística">
                    <DropdownItem href="/admin/compras">🛒 Mis Compras</DropdownItem>
                    <DropdownItem href="/admin/proveedores">🚚 Proveedores</DropdownItem>
                    <DropdownItem href="/admin/clientes">👥 Clientes</DropdownItem>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <DropdownItem href="/admin/kardex">📋 Kardex / Inventario</DropdownItem>
                </DropdownMenu>

                {/* GRUPO 3: CONFIGURACIÓN */}
                <DropdownMenu title="Ajustes">
                    <DropdownItem href="/admin/tallas">📏 Tallas</DropdownItem>
                    <DropdownItem href="/admin/colores">🎨 Colores</DropdownItem>
                    <DropdownItem href="/admin/empaques">🛍️ Empaques</DropdownItem>
                </DropdownMenu>
            </div>
        </div>

        {/* PERFIL / LOGOUT / HAMBURGUESA */}
        <div className="flex items-center gap-4">
           <button 
             onClick={logout} 
             disabled={cargando}
             className="hidden md:block text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
           >
             {cargando ? "..." : "Cerrar sesión"}
           </button>

           {/* Botón Móvil */}
           <button 
             className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
        </div>
      </div>
      
      {/* MENÚ MÓVIL */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-4 shadow-xl absolute w-full left-0 z-50 max-h-[90vh] overflow-y-auto">
            
            <MobileGroup title="Comercial">
                <Link href="/admin/ventas/nueva" className="block py-2 pl-4 text-sm font-medium text-blue-600">Nueva Venta (POS)</Link>
                <Link href="/admin/ventas" className="block py-2 pl-4 text-sm text-gray-600">Historial Ventas</Link>
                <Link href="/admin/devoluciones" className="block py-2 pl-4 text-sm text-gray-600">Devoluciones</Link>
            </MobileGroup>

            <MobileGroup title="Catálogo">
                <Link href="/admin/productos" className="block py-2 pl-4 text-sm text-gray-600">Productos</Link>
                <Link href="/admin/categorias" className="block py-2 pl-4 text-sm text-gray-600">Categorías</Link>
                <Link href="/admin/descuentos" className="block py-2 pl-4 text-sm text-gray-600">Campañas</Link>
            </MobileGroup>
            
            <MobileGroup title="Logística">
                <Link href="/admin/compras" className="block py-2 pl-4 text-sm text-gray-600">Compras</Link>
                <Link href="/admin/proveedores" className="block py-2 pl-4 text-sm text-gray-600">Proveedores</Link>
                <Link href="/admin/kardex" className="block py-2 pl-4 text-sm text-gray-600">Kardex</Link>
            </MobileGroup>

            <MobileGroup title="Ajustes">
                <Link href="/admin/tallas" className="block py-2 pl-4 text-sm text-gray-600">Tallas</Link>
                <Link href="/admin/colores" className="block py-2 pl-4 text-sm text-gray-600">Colores</Link>
                <Link href="/admin/empaques" className="block py-2 pl-4 text-sm text-gray-600">Empaques</Link>
            </MobileGroup>

            <button onClick={logout} className="w-full text-left py-3 text-sm font-bold text-red-600 border-t border-gray-100 mt-2">
                Cerrar Sesión
            </button>
        </div>
      )}
    </nav>
  );
}

// --- SUBCOMPONENTES ---

function DropdownMenu({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    
    // Cerrar al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${isOpen ? 'bg-slate-50 text-slate-900' : 'text-gray-600 hover:text-slate-900 hover:bg-white'}`}
            >
                {title}
                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {children}
                </div>
            )}
        </div>
    )
}

function DropdownItem({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} className="block px-3 py-2 text-sm text-gray-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
            {children}
        </Link>
    )
}

function MobileGroup({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
            <div className="space-y-1 border-l-2 border-gray-100 ml-1">
                {children}
            </div>
        </div>
    )
}