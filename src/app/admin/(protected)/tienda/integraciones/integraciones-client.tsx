"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Phone, Mail } from "lucide-react";

type Settings = {
  id: string;
  whatsapp?: string | null;
  contactEmail?: string | null;
};

export default function IntegracionesClient({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [s, setS] = useState<Settings>(initial);

  async function guardar() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/tienda/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          whatsapp: s.whatsapp,
          // phone también es actualizado para que el footer y otros usos del nro. queden sincronizados
          phone: s.whatsapp,
          contactEmail: s.contactEmail,
        }),
      });
      const t = await r.text();
      if (!r.ok) throw new Error(t || "Error guardando integraciones");
      setMsg({ type: "ok", text: "Integraciones guardadas ✅" });
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Integraciones</h1>
            <p className="text-sm text-gray-500">WhatsApp y correo de contacto.</p>
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
          }`}>{msg.text}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <span className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600">
              <Phone className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp</p>
              <h2 className="font-bold text-slate-900">Número</h2>
            </div>
          </div>
          <div className="p-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp (solo dígitos)</label>
            <input
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
              placeholder="51999999999"
              value={s.whatsapp ?? ""}
              onChange={(e) => setS(p => ({ ...p, whatsapp: e.target.value }))}
            />
            <p className="text-xs text-slate-400">
              Esto se usa para links tipo wa.me en la tienda pública.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <span className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600">
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
              <h2 className="font-bold text-slate-900">Contacto</h2>
            </div>
          </div>
          <div className="p-6 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Correo</label>
            <input
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
              placeholder="contacto@elara..."
              value={s.contactEmail ?? ""}
              onChange={(e) => setS(p => ({ ...p, contactEmail: e.target.value }))}
            />
            <p className="text-xs text-slate-400">
              Útil para el footer y formularios simples.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
