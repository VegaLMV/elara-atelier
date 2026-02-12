"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

type FooterLink = {
  id: string;
  label: string;
  href: string;
  order: number;
  enabled: boolean;
};

type Social = {
  id: string;
  platform: string;
  url: string;
  order: number;
  enabled: boolean;
};

function normalizeLinks(items: FooterLink[]) {
  return items.slice().sort((a,b)=>a.order-b.order).map((x,i)=>({ ...x, order: i }));
}
function normalizeSocial(items: Social[]) {
  return items.slice().sort((a,b)=>a.order-b.order).map((x,i)=>({ ...x, order: i }));
}

export default function FooterClient({
  initialLinks,
  initialSocial,
}: {
  initialLinks: FooterLink[];
  initialSocial: Social[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{type:"ok"|"err"; text:string} | null>(null);

  const [links, setLinks] = useState<FooterLink[]>(normalizeLinks(initialLinks));
  const [social, setSocial] = useState<Social[]>(normalizeSocial(initialSocial));

  function updateLink(id: string, patch: Partial<FooterLink>) {
    setLinks(prev => prev.map(x=> x.id===id ? { ...x, ...patch } : x));
  }
  function updateSocial(id: string, patch: Partial<Social>) {
    setSocial(prev => prev.map(x=> x.id===id ? { ...x, ...patch } : x));
  }

  function addLink() {
    setLinks(prev => normalizeLinks([...prev, { id:`temp_${Date.now()}`, label:"Nuevo", href:"/", enabled:true, order: prev.length }]));
  }
  function delLink(id: string) {
    setLinks(prev => prev.filter(x=>x.id!==id));
  }

  function addSocial() {
    setSocial(prev => normalizeSocial([...prev, { id:`temp_${Date.now()}`, platform:"Instagram", url:"https://", enabled:true, order: prev.length }]));
  }
  function delSocial(id: string) {
    setSocial(prev => prev.filter(x=>x.id!==id));
  }

  async function guardar() {
    setBusy(true);
    setMsg(null);
    try {
      // Guardar footer links (NavigationItem location=FOOTER) por endpoint de navegacion
      const navPayload = {
        items: links.map(l => ({
          id: l.id.startsWith("temp_") ? undefined : l.id,
          location: "FOOTER",
          label: l.label,
          href: l.href,
          order: l.order,
          enabled: l.enabled,
        })),
      };

      const r1 = await fetch("/api/admin/tienda/navegacion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(navPayload),
      });
      const t1 = await r1.text();
      if (!r1.ok) throw new Error(t1 || "Error guardando footer links");

      // Guardar social por endpoint social
      const socPayload = {
        links: social.map(s => ({
          id: s.id.startsWith("temp_") ? undefined : s.id,
          platform: s.platform,
          url: s.url,
          order: s.order,
          enabled: s.enabled,
        })),
      };

      const r2 = await fetch("/api/admin/tienda/social", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(socPayload),
      });
      const t2 = await r2.text();
      if (!r2.ok) throw new Error(t2 || "Error guardando redes");

      setMsg({type:"ok", text:"Footer guardado ✅"});
      router.refresh();
    } catch (e:any) {
      setMsg({type:"err", text: e?.message ?? "Error"});
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Footer</h1>
            <p className="text-sm text-gray-500">Links y redes sociales.</p>
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
        <div className={`border rounded-2xl px-5 py-4 text-sm font-medium ${
          msg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Footer links */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Links</p>
              <p className="text-sm text-slate-500">Elementos del footer</p>
            </div>
            <button onClick={addLink} className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800">
              <Plus className="w-4 h-4" /> Añadir
            </button>
          </div>

          <div className="p-6 space-y-3">
            {links.map(l => (
              <div key={l.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    l.enabled ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                  }`}>{l.enabled ? "ON" : "OFF"}</span>

                  <div className="flex items-center gap-2">
                    <button onClick={() => updateLink(l.id, { enabled: !l.enabled })} className="text-xs font-bold text-slate-600 hover:text-slate-900">
                      Toggle
                    </button>
                    <button onClick={() => delLink(l.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Label</label>
                    <input className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                      value={l.label} onChange={(e)=>updateLink(l.id,{label:e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Href</label>
                    <input className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                      value={l.href} onChange={(e)=>updateLink(l.id,{href:e.target.value})} />
                  </div>
                </div>
              </div>
            ))}
            {links.length===0 && <div className="text-sm text-slate-400 py-10 text-center border border-dashed rounded-2xl">Sin links.</div>}
          </div>
        </div>

        {/* Social */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Redes</p>
              <p className="text-sm text-slate-500">Social links del footer</p>
            </div>
            <button onClick={addSocial} className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800">
              <Plus className="w-4 h-4" /> Añadir
            </button>
          </div>

          <div className="p-6 space-y-3">
            {social.map(s => (
              <div key={s.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                    s.enabled ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                  }`}>{s.enabled ? "ON" : "OFF"}</span>

                  <div className="flex items-center gap-2">
                    <button onClick={() => updateSocial(s.id, { enabled: !s.enabled })} className="text-xs font-bold text-slate-600 hover:text-slate-900">
                      Toggle
                    </button>
                    <button onClick={() => delSocial(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Platform</label>
                    <input className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                      value={s.platform} onChange={(e)=>updateSocial(s.id,{platform:e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">URL</label>
                    <input className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium"
                      value={s.url} onChange={(e)=>updateSocial(s.id,{url:e.target.value})} />
                  </div>
                </div>
              </div>
            ))}
            {social.length===0 && <div className="text-sm text-slate-400 py-10 text-center border border-dashed rounded-2xl">Sin redes.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
