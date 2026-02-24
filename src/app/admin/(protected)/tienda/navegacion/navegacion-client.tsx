"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

type Location = "HEADER" | "FOOTER";

type NavItem = {
  id: string;
  location: Location;
  label: string;
  href: string;
  order: number;
  enabled: boolean;
};

function normalize(items: NavItem[]) {
  const header = items.filter(i => i.location === "HEADER").sort((a, b) => a.order - b.order);
  const footer = items.filter(i => i.location === "FOOTER").sort((a, b) => a.order - b.order);
  return [
    ...header.map((x, idx) => ({ ...x, order: idx })),
    ...footer.map((x, idx) => ({ ...x, order: idx })),
  ];
}

// ============================================================
// NavRow - componente de fila definido FUERA del componente
// principal para evitar re-renders al escribir (anti-lag fix)
// ============================================================
function NavRow({
  it,
  onUpdate,
  onMove,
  onDelete,
}: {
  it: NavItem;
  onUpdate: (id: string, patch: Partial<NavItem>) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            onClick={() => onUpdate(it.id, { enabled: !it.enabled })}
            title={it.enabled ? "Activo" : "Inactivo"}
          >
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${it.enabled ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
              }`}>
              {it.enabled ? "ON" : "OFF"}
            </span>
          </button>

          <span className="text-xs text-slate-400 font-bold uppercase">Orden {it.order + 1}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => onMove(it.id, "up")} title="Subir">
            <ChevronUp className="w-4 h-4 text-slate-500" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={() => onMove(it.id, "down")} title="Bajar">
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
          <button className="p-2 rounded-lg hover:bg-red-50 text-red-500" onClick={() => onDelete(it.id)} title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Label</label>
          <input
            value={it.label}
            onChange={(e) => onUpdate(it.id, { label: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Href</label>
          <input
            value={it.href}
            onChange={(e) => onUpdate(it.id, { href: e.target.value })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NavSection - también fuera del componente principal
// ============================================================
function NavSection({
  title,
  location,
  list,
  onAdd,
  onUpdate,
  onMove,
  onDelete,
}: {
  title: string;
  location: Location;
  list: NavItem[];
  onAdd: (loc: Location) => void;
  onUpdate: (id: string, patch: Partial<NavItem>) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-sm text-slate-500">Links {location.toLowerCase()}</p>
        </div>
        <button
          onClick={() => onAdd(location)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" /> Añadir
        </button>
      </div>

      <div className="p-6 space-y-3">
        {list.length === 0 && (
          <div className="text-sm text-slate-400 py-10 text-center border border-dashed rounded-2xl">
            Sin links. Añade uno.
          </div>
        )}

        {list.map((it) => (
          <NavRow
            key={it.id}
            it={it}
            onUpdate={onUpdate}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Componente principal
// ============================================================
export default function NavegacionClient({ initial }: { initial: NavItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<NavItem[]>(normalize(initial));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const header = useMemo(() => items.filter(i => i.location === "HEADER").sort((a, b) => a.order - b.order), [items]);
  const footer = useMemo(() => items.filter(i => i.location === "FOOTER").sort((a, b) => a.order - b.order), [items]);

  const add = useCallback((location: Location) => {
    const id = `temp_${Date.now()}_${location}`;
    const next: NavItem = {
      id,
      location,
      label: "Nuevo",
      href: "/",
      enabled: true,
      order: location === "HEADER" ? header.length : footer.length,
    };
    setItems(prev => normalize([...prev, next]));
  }, [header.length, footer.length]);

  const del = useCallback((id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
  }, []);

  const move = useCallback((id: string, dir: "up" | "down") => {
    setItems(prev => {
      const arr = normalize(prev);
      const item = arr.find(x => x.id === id);
      if (!item) return prev;

      const group = item.location;
      const groupItems = arr.filter(x => x.location === group).sort((a, b) => a.order - b.order);
      const idx = groupItems.findIndex(x => x.id === id);
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= groupItems.length) return prev;

      const copy = [...groupItems];
      [copy[idx], copy[swap]] = [copy[swap], copy[idx]];

      const other = arr.filter(x => x.location !== group);
      const merged = [
        ...copy.map((x, i) => ({ ...x, order: i })),
        ...other,
      ];
      return normalize(merged);
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<NavItem>) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  async function guardar() {
    setBusy(true);
    setMsg(null);
    try {
      const payload = {
        items: normalize(items).map(i => ({
          id: i.id.startsWith("temp_") ? undefined : i.id,
          location: i.location,
          label: i.label,
          href: i.href,
          order: i.order,
          enabled: i.enabled,
        })),
      };

      const r = await fetch("/api/admin/tienda/navegacion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await r.text();
      if (!r.ok) throw new Error(text || "Error guardando navegación");

      const data = JSON.parse(text);
      setItems(normalize(data));
      setMsg({ type: "ok", text: "Navegación guardada ✅" });
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        <div className="flex items-start gap-4">
          <Link href="/admin/tienda" className="p-2 hover:bg-gray-100 rounded-full" title="Volver">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Navegación</h1>
            <p className="text-sm text-gray-500">Header y Footer links.</p>
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={busy}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          {busy ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {msg && (
        <div className={`border rounded-2xl px-5 py-4 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
          }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NavSection title="Header" location="HEADER" list={header} onAdd={add} onUpdate={update} onMove={move} onDelete={del} />
        <NavSection title="Footer" location="FOOTER" list={footer} onAdd={add} onUpdate={update} onMove={move} onDelete={del} />
      </div>
    </div>
  );
}
