"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; nombre: string; costoUnitario: string; activo: boolean };

export default function EmpaquesClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canCreate = useMemo(() => {
    if (!nombre.trim()) return false;
    if (costo === "" || isNaN(Number(costo)) || Number(costo) < 0) return false;
    return true;
  }, [nombre, costo]);

  async function crear() {
    setError(null);
    if (!canCreate) return;

    setBusy(true);
    const r = await fetch("/api/admin/empaques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), costoUnitario: costo }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error creando empaque");
      return;
    }

    setNombre("");
    setCosto("");
    router.refresh();
  }

  async function actualizar(id: string, patch: { nombre: string; costoUnitario: string }) {
    setError(null);
    if (!patch.nombre.trim()) return setError("Nombre inválido");
    if (patch.costoUnitario === "" || isNaN(Number(patch.costoUnitario)) || Number(patch.costoUnitario) < 0) {
      return setError("Costo inválido");
    }

    setBusy(true);
    const r = await fetch(`/api/admin/empaques/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: patch.nombre.trim(), costoUnitario: patch.costoUnitario }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error actualizando empaque");
      return;
    }

    router.refresh();
  }

  async function toggleActivo(id: string, activo: boolean) {
    setError(null);
    setBusy(true);
    const r = await fetch(`/api/admin/empaques/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error cambiando estado");
      return;
    }

    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    if (!confirm("¿Eliminar empaque? Si está usado en ventas, no se podrá.")) return;

    setBusy(true);
    const r = await fetch(`/api/admin/empaques/${id}`, { method: "DELETE" });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error eliminando empaque");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Nuevo empaque</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm">Nombre</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="Bolsa chica"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Costo unitario</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="0.00"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
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
              <th className="text-left p-3">Costo unit.</th>
              <th className="text-left p-3">Estado</th>
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
                onToggle={(val) => toggleActivo(r.id, val)}
                onDelete={() => eliminar(r.id)}
              />
            ))}

            {initialRows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
                  No hay empaques registrados.
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
  onToggle,
  onDelete,
}: {
  row: { id: string; nombre: string; costoUnitario: string; activo: boolean };
  disabled: boolean;
  onSave: (patch: { nombre: string; costoUnitario: string }) => void;
  onToggle: (activo: boolean) => void;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [costo, setCosto] = useState(row.costoUnitario);

  const changed = nombre.trim() !== row.nombre || costo !== row.costoUnitario;

  return (
    <tr className="border-t">
      <td className="p-3">
        <input className="w-full border rounded-md px-2 py-1" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </td>
      <td className="p-3">
        <input className="w-28 border rounded-md px-2 py-1" value={costo} onChange={(e) => setCosto(e.target.value)} />
      </td>
      <td className="p-3">
        <button
          type="button"
          className="underline disabled:opacity-60"
          disabled={disabled}
          onClick={() => onToggle(!row.activo)}
        >
          {row.activo ? "Activo" : "Inactivo"}
        </button>
      </td>
      <td className="p-3">
        <div className="flex gap-3">
          <button
            type="button"
            className="underline disabled:opacity-60"
            disabled={disabled || !changed || !nombre.trim() || costo === "" || isNaN(Number(costo)) || Number(costo) < 0}
            onClick={() => onSave({ nombre: nombre.trim(), costoUnitario: costo })}
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
