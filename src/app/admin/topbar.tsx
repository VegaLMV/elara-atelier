"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminTopbar() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function logout() {
    setCargando(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCargando(false);
    router.replace("/admin/login");
  }

  return (
    <div className="border-b">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link className="font-semibold" href="/admin/productos">
          Admin · Elara Atelier
        </Link>

        <div className="flex gap-4 items-center text-sm">
          <Link className="underline" href="/admin/productos">Productos</Link>
          <Link className="underline" href="/admin/compras">Compras</Link>
          <Link className="underline" href="/admin/kardex">Kardex</Link>
          <Link className="underline" href="/admin/proveedores">Proveedores</Link>
          <Link className="underline" href="/admin/devoluciones">Devoluciones</Link>
          <Link className="underline" href="/admin/reportes/stock">Reportes</Link>
          
          <button className="underline" onClick={logout} disabled={cargando}>
            {cargando ? "Saliendo..." : "Salir"}
          </button>
        </div>
      </div>
    </div>
  );
}
