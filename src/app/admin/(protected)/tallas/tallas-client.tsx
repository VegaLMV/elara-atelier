"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; nombre: string; orden: number };

export default function TallasClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);

  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canCreate = useMemo(() => nombre.trim().length > 0, [nombre]);

  async function crear() {
    setError(null);
    if (!canCreate) return;

    const ord = Number.parseInt(orden || "0", 10);
    const ordenInt = Number.isFinite(ord) ? ord : 0;

    setBusy(true);
    const r = await fetch("/api/admin/tallas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), orden: ordenInt }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error creando talla");
      return;
    }

    setNombre("");
    setOrden("0");

    // refresca lista desde server (y sincroniza)
    router.refresh();
  }

  async function actualizar(id: string, patch: { nombre: string; orden: number }) {
    setError(null);
    setBusy(true);
    const r = await fetch(`/api/admin/tallas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error actualizando talla");
      return;
    }

    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    if (!confirm("¿Eliminar talla? Si está usada por variantes, no se podrá.")) return;

    setBusy(true);
    const r = await fetch(`/api/admin/tallas/${id}`, { method: "DELETE" });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error eliminando talla");
      return;
    }

    router.refresh();
  }

  // si el server refresca, no tenemos hook acá: hacemos sync simple por reload visual
  // (router.refresh() recarga server component y reinicia initialRows)
  // Turbopack suele re-renderizar; igual dejamos rows local solo para editar.
  // Puedes quitar rows/setRows si prefieres full refresh.

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Nueva talla</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-sm">Nombre</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="XS"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Orden</label>
            <input
              type="number"
              step={1}
              className="w-full border rounded-md px-3 py-2"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-60"
            onClick={crear}
            disabled={busy || !canCreate}
          >
            {busy ? "Guardando..." : "Crear"}
          </button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Orden</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {initialRows.map((r) => (
              <Fila
                key={r.id}
                row={r}
                disabled={busy}
                onSave={(patch) => actualizar(r.id, patch)}
                onDelete={() => eliminar(r.id)}
              />
            ))}

            {initialRows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={3}>
                  No hay tallas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Fila({
  row,
  disabled,
  onSave,
  onDelete,
}: {
  row: { id: string; nombre: string; orden: number };
  disabled: boolean;
  onSave: (patch: { nombre: string; orden: number }) => void;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [orden, setOrden] = useState(String(row.orden));

  const changed = nombre.trim() !== row.nombre || Number(orden || 0) !== row.orden;

  return (
    <tr className="border-t">
      <td className="p-3">
        <input
          className="w-full border rounded-md px-2 py-1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </td>
      <td className="p-3">
        <input
          type="number"
          step={1}
          className="w-24 border rounded-md px-2 py-1"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
        />
      </td>
      <td className="p-3">
        <div className="flex gap-3">
          <button
            type="button"
            className="underline disabled:opacity-60"
            disabled={disabled || !changed || !nombre.trim()}
            onClick={() => onSave({ nombre: nombre.trim(), orden: Number.parseInt(orden || "0", 10) || 0 })}
          >
            Guardar
          </button>
          <button type="button" className="underline disabled:opacity-60" disabled={disabled} onClick={onDelete}>
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
