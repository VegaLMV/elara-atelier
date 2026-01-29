"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Data = {
  variantes: Array<{
    id: string;
    productoNombre: string;
    talla: string;
    tallaOrden: number;
    color: string;
    sku: string;
    stockActual: number;
    activa: boolean;
  }>;
};

type Item = {
  varianteId: string;
  titulo: string;
  stockActual: number;
  cantidad: number;
};

export default function DevolucionForm({ initialData }: { initialData: Data }) {
  const router = useRouter();

  const [qVar, setQVar] = useState("");
  const [varSel, setVarSel] = useState("");
  const [nota, setNota] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const variantesFiltradas = useMemo(() => {
    const q = qVar.trim().toLowerCase();
    const base = initialData.variantes;

    if (!q) return base.slice(0, 50);

    return base
      .filter((v) => {
        const txt = `${v.productoNombre} ${v.talla} ${v.color} ${v.sku}`.toLowerCase();
        return txt.includes(q);
      })
      .slice(0, 50);
  }, [qVar, initialData.variantes]);

  const varianteElegida = useMemo(() => {
    return initialData.variantes.find((v) => v.id === varSel) ?? null;
  }, [varSel, initialData.variantes]);

  function agregarItem() {
    setError(null);

    if (!varianteElegida) return setError("Selecciona una variante.");
    if (varianteElegida.stockActual <= 0) return setError("Esta variante no tiene stock para devolver.");

    const titulo = `${varianteElegida.productoNombre} · ${varianteElegida.talla} · ${varianteElegida.color}`;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.varianteId === varianteElegida.id);
      if (idx >= 0) {
        const copy = [...prev];
        const max = copy[idx].stockActual;
        copy[idx] = { ...copy[idx], cantidad: Math.min(max, copy[idx].cantidad + 1) }; // ✅ recorte
        return copy;
      }
      return [
        ...prev,
        {
          varianteId: varianteElegida.id,
          titulo,
          stockActual: varianteElegida.stockActual,
          cantidad: 1,
        },
      ];
    });
  }

  function quitarItem(varianteId: string) {
    setItems((prev) => prev.filter((x) => x.varianteId !== varianteId));
  }

  function setCantidad(varianteId: string, value: string) {
    const n = Math.max(0, Number.parseInt(value || "0", 10) || 0);
    setItems((prev) =>
      prev.map((x) => {
        if (x.varianteId !== varianteId) return x;
        // ✅ no exceder stockActual
        return { ...x, cantidad: Math.min(n, x.stockActual) };
      })
    );
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) return setError("Agrega al menos 1 ítem.");

    for (const it of items) {
      if (!Number.isInteger(it.cantidad) || it.cantidad <= 0) return setError("Hay una cantidad inválida.");
      if (it.cantidad > it.stockActual) return setError(`No puedes devolver más que el stock en: ${it.titulo}`);
    }

    setGuardando(true);

    const r = await fetch("/api/admin/devoluciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nota: nota.trim() ? nota.trim() : null,
        items: items.map((it) => ({ varianteId: it.varianteId, cantidad: it.cantidad })),
      }),
    });

    setGuardando(false);

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.error ?? "Error registrando devolución");
      return;
    }

    router.push("/admin/devoluciones");
    router.refresh();
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Nueva devolución</h1>
          <p className="text-sm opacity-80">Resta stock y crea movimiento DEVOLUCIÓN.</p>
        </div>

        <button className="border rounded-md px-3 py-2" type="button" onClick={() => router.push("/admin/devoluciones")}>
          ← Volver
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={guardar} className="space-y-4">
        <div className="border rounded-xl p-4 space-y-3">
          <h2 className="text-lg font-semibold">Agregar ítems</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1 md:col-span-1">
              <label className="text-sm">Buscar</label>
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Producto / talla / color / SKU"
                value={qVar}
                onChange={(e) => setQVar(e.target.value)}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm">Variante</label>
              <select className="w-full border rounded-md px-3 py-2" value={varSel} onChange={(e) => setVarSel(e.target.value)}>
                <option value="">Selecciona…</option>
                {variantesFiltradas.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.productoNombre} · {v.talla} · {v.color} (stock: {v.stockActual})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className="bg-black text-white rounded-md px-4 py-2" onClick={agregarItem}>
            + Agregar ítem
          </button>
        </div>

        <div className="border rounded-xl p-4 space-y-2">
          <label className="text-sm">Nota (opcional)</label>
          <textarea
            className="w-full border rounded-md px-3 py-2"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: devolución a proveedor por defecto de fábrica, etc."
          />
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Detalle</h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left p-3">Variante</th>
                <th className="text-right p-3">Stock actual</th>
                <th className="text-right p-3">Devolver</th>
                <th className="text-left p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.varianteId} className="border-t">
                  <td className="p-3">{it.titulo}</td>
                  <td className="p-3 text-right">{it.stockActual}</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="w-24 border rounded-md px-2 py-1 text-right"
                      value={it.cantidad}
                      onChange={(e) => setCantidad(it.varianteId, e.target.value)}
                    />
                    {it.cantidad > it.stockActual && (
                      <div className="text-xs text-red-500 mt-1">Máximo: {it.stockActual}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <button type="button" className="underline" onClick={() => quitarItem(it.varianteId)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={4}>
                    Aún no hay ítems.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button disabled={guardando} className="bg-black text-white rounded-md px-4 py-2">
          {guardando ? "Registrando..." : "Registrar devolución"}
        </button>
      </form>
    </div>
  );
}
