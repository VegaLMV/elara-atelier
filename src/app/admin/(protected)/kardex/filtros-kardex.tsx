"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TipoKardex = "TODOS" | "COMPRA" | "AJUSTE" | "DEVOLUCION";

export default function FiltrosKardex({
  initial,
}: {
  initial: {
    q: string;
    tipo: TipoKardex;
    from: string;
    to: string;
  };
}) {
  const router = useRouter();

  const [q, setQ] = useState(initial.q || "");
  const [tipo, setTipo] = useState<TipoKardex>(initial.tipo || "TODOS");
  const [from, setFrom] = useState(initial.from || "");
  const [to, setTo] = useState(initial.to || "");

  function aplicar() {
    const sp = new URLSearchParams();

    if (q.trim()) sp.set("q", q.trim());
    if (tipo && tipo !== "TODOS") sp.set("tipo", tipo);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);

    // ✅ reset paginación al filtrar
    sp.set("page", "1");

    const qs = sp.toString();
    router.push(qs ? `/admin/kardex?${qs}` : "/admin/kardex");
  }

  function limpiar() {
    router.push("/admin/kardex");
  }

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h2 className="text-lg font-semibold">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm">Buscar</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Producto / Talla / Color / SKU / Nota"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Tipo</label>
          <select className="w-full border rounded-md px-3 py-2" value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
            <option value="TODOS">TODOS</option>
            <option value="COMPRA">COMPRA</option>
            <option value="AJUSTE">AJUSTE</option>
            <option value="DEVOLUCION">DEVOLUCIÓN</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Desde</label>
          <input className="w-full border rounded-md px-3 py-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Hasta</label>
          <input className="w-full border rounded-md px-3 py-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" className="bg-black text-white rounded-md px-4 py-2" onClick={aplicar}>
          Aplicar
        </button>
        <button type="button" className="border rounded-md px-4 py-2" onClick={limpiar}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
