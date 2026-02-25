"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Image as ImageIcon } from "lucide-react";
import { UploaderImage } from "@/components/ui/uploader-image"; // ✅ Importación del componente

type Settings = {
  id: string;
  storeName: string;
  tagline: string | null;
  description: string | null;
  ogImageUrl: string | null;
};

export default function SeoClient({ initial }: { initial: Settings }) {
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
          storeName: s.storeName,
          tagline: s.tagline,
          description: s.description,
          ogImageUrl: s.ogImageUrl,
        }),
      });
      const t = await r.text();
      if (!r.ok) throw new Error(t || "Error guardando SEO");
      setMsg({ type: "ok", text: "SEO guardado ✅" });
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SEO</h1>
            <p className="text-sm text-gray-500">Título, descripción y OpenGraph.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meta</p>
            <h2 className="font-bold text-slate-900">Información base</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título de la Tienda</label>
              <input
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                value={s.storeName}
                onChange={(e) => setS(p => ({ ...p, storeName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tagline</label>
              <input
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                placeholder="Ej: Alta costura contemporánea"
                value={s.tagline ?? ""}
                onChange={(e) => setS(p => ({ ...p, tagline: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción (Meta Description)</label>
              <textarea
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium min-h-[140px] focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                placeholder="Escribe una descripción optimizada para buscadores..."
                value={s.description ?? ""}
                onChange={(e) => setS(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
            <span className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600">
              <ImageIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">OpenGraph</p>
              <h2 className="font-bold text-slate-900">Imagen de compartir</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <UploaderImage
              modulo="seo"
              label="Banner de Redes Sociales (OG Image)"
              url={s.ogImageUrl ?? null}
              onUpload={(url) => setS(p => ({ ...p, ogImageUrl: url }))}
            />

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                💡 <strong>Recomendación:</strong> Usa una imagen de <strong>1200x630px</strong> para que se vea perfecta al compartir el enlace en WhatsApp, Facebook o Instagram.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}