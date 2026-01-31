"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; nombre: string; hex: string | null; usos?: number };

function esHex(v: string) {
  if (!v) return true; // opcional
  return /^#([0-9a-fA-F]{6})$/.test(v.trim());
}

function normalizarHex(v: string) {
  const x = (v ?? "").trim();
  if (!x) return "";
  const withHash = x.startsWith("#") ? x : `#${x}`;
  return withHash.toUpperCase();
}

function hexSeguroParaPicker(hex: string) {
  return esHex(hex) && hex ? normalizarHex(hex) : "#000000";
}

async function copiarAlPortapapeles(text: string) {
  const t = text ?? "";
  if (!t) return;

  // intento moderno
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(t);
    return;
  }

  // fallback
  const ta = document.createElement("textarea");
  ta.value = t;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export default function ColoresClient({ initialRows }: { initialRows: Row[] }) {
  const router = useRouter();

  // 🔎 búsqueda
  const [buscar, setBuscar] = useState("");

  // create
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hexNorm = useMemo(() => normalizarHex(hex), [hex]);

  const canCreate = useMemo(
    () => nombre.trim().length > 0 && esHex(hexNorm),
    [nombre, hexNorm]
  );

  const rowsFiltradas = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return initialRows;

    return initialRows.filter((r) => {
      const a = (r.nombre ?? "").toLowerCase();
      const b = normalizarHex(r.hex ?? "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [buscar, initialRows]);

  async function crear() {
    setError(null);
    setOk(null);
    if (!canCreate) return;

    setBusy(true);
    const r = await fetch("/api/admin/colores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), hex: hexNorm || null }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error creando color");
      return;
    }

    setNombre("");
    setHex("");
    setOk("Color creado.");
    router.refresh();
  }

  async function actualizar(id: string, patch: { nombre: string; hex: string | null }) {
    setError(null);
    setOk(null);

    const nombreTrim = patch.nombre.trim();
    const hexNorm2 = patch.hex ? normalizarHex(patch.hex) : "";

    if (!nombreTrim) return setError("Nombre inválido");
    if (!esHex(hexNorm2)) return setError("HEX inválido (usa #RRGGBB)");

    setBusy(true);
    const r = await fetch(`/api/admin/colores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreTrim, hex: hexNorm2 || null }),
    });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(d?.error ?? "Error actualizando color");
      return;
    }

    setOk("Color actualizado.");
    router.refresh();
  }

  async function eliminar(row: Row) {
    setError(null);
    setOk(null);

    // ✅ bloqueo por uso si nos llegó usos
    if ((row.usos ?? 0) > 0) {
      setError(`No puedes eliminar "${row.nombre}" porque está usado en ${row.usos} variante(s).`);
      return;
    }

    if (!confirm("¿Eliminar color? Si está usado por variantes, no se podrá.")) return;

    setBusy(true);
    const r = await fetch(`/api/admin/colores/${row.id}`, { method: "DELETE" });
    setBusy(false);

    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      // ✅ por si igual está usado pero no teníamos usos en UI
      setError(d?.error ?? "Error eliminando color");
      return;
    }

    setOk("Color eliminado.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-700">{ok}</p>}

      {/* 🔎 BÚSQUEDA */}
      <div className="border rounded-xl p-4 space-y-2">
        <label className="text-sm">Buscar</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          placeholder="Ej: Negro / #000000"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <p className="text-xs opacity-70">
          Mostrando <b>{rowsFiltradas.length}</b> de <b>{initialRows.length}</b>
        </p>
      </div>

      {/* ✅ CREAR */}
      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">Nuevo color</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm">Nombre</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="Negro"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Paleta</label>
            <input
              type="color"
              className="w-full h-10 border rounded-md px-1"
              value={hexSeguroParaPicker(hexNorm)}
              onChange={(e) => setHex(normalizarHex(e.target.value))}
              title="Selecciona un color"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm">HEX (opcional)</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              placeholder="#000000"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
            {!esHex(hexNorm) ? <p className="text-xs text-red-600">Formato: #RRGGBB</p> : null}
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

        <div className="flex items-center gap-2 text-sm opacity-80">
          <span>Vista:</span>
          <span
            className="inline-block w-5 h-5 rounded border"
            style={{ background: esHex(hexNorm) && hexNorm ? hexNorm : "transparent" }}
            title={hexNorm || "Sin HEX"}
          />
          <span>{hexNorm || "Sin HEX"}</span>
          {hexNorm ? (
            <button
              type="button"
              className="underline ml-2"
              onClick={async () => {
                await copiarAlPortapapeles(hexNorm);
                setOk("HEX copiado.");
              }}
            >
              Copiar HEX
            </button>
          ) : null}
        </div>
      </div>

      {/* ✅ TABLA */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left p-3">Muestra</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">HEX</th>
              <th className="text-left p-3">Usos</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rowsFiltradas.map((r) => (
              <Fila
                key={r.id}
                row={r}
                disabled={busy}
                onSave={(patch) => actualizar(r.id, patch)}
                onDelete={() => eliminar(r)}
                onCopy={async (value) => {
                  await copiarAlPortapapeles(value);
                  setOk("Copiado.");
                }}
              />
            ))}

            {rowsFiltradas.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  No hay resultados.
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
  onCopy,
}: {
  row: Row;
  disabled: boolean;
  onSave: (patch: { nombre: string; hex: string | null }) => void;
  onDelete: () => void;
  onCopy: (value: string) => void;
}) {
  const [nombre, setNombre] = useState(row.nombre);
  const [hex, setHex] = useState(row.hex ?? "");

  const hexNorm = normalizarHex(hex);
  const baseHex = normalizarHex(row.hex ?? "");
  const usos = row.usos ?? 0;

  const changed = nombre.trim() !== row.nombre || (hexNorm || "") !== (baseHex || "");
  const puedeEliminar = usos === 0;

  return (
    <tr className="border-t">
      <td className="p-3">
        <span
          className="inline-block w-6 h-6 rounded border"
          style={{ background: esHex(hexNorm) && hexNorm ? hexNorm : "transparent" }}
          title={esHex(hexNorm) && hexNorm ? hexNorm : "Sin HEX"}
        />
      </td>

      <td className="p-3">
        <input
          className="w-full border rounded-md px-2 py-1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </td>

      <td className="p-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-9 w-12 border rounded-md px-1"
            value={hexSeguroParaPicker(hexNorm)}
            onChange={(e) => setHex(normalizarHex(e.target.value))}
            title="Elegir color"
          />
          <input
            className="w-40 border rounded-md px-2 py-1"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#RRGGBB"
          />
          <button
            type="button"
            className="underline text-xs disabled:opacity-60"
            disabled={!esHex(hexNorm) || !hexNorm}
            onClick={() => onCopy(hexNorm)}
            title="Copiar HEX"
          >
            Copiar
          </button>
        </div>

        {!esHex(hexNorm) ? <p className="text-xs text-red-600 mt-1">Formato: #RRGGBB</p> : null}
      </td>

      <td className="p-3">{usos}</td>

      <td className="p-3">
        <div className="flex gap-3">
          <button
            type="button"
            className="underline disabled:opacity-60"
            disabled={disabled || !changed || !nombre.trim() || !esHex(hexNorm)}
            onClick={() => onSave({ nombre: nombre.trim(), hex: hexNorm ? hexNorm : null })}
          >
            Guardar
          </button>

          <button
            type="button"
            className="underline disabled:opacity-60"
            disabled={disabled || !puedeEliminar}
            onClick={onDelete}
            title={!puedeEliminar ? "No se puede eliminar: está en uso por variantes" : "Eliminar color"}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
