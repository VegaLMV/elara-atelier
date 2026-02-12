export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { sesionAdmin } from "@/lib/sesion";
import { ArrowLeft, Settings2, LayoutPanelTop, Palette, Link2, Sparkles, Footprints, Search, PlugZap, } from "lucide-react";

const Card = ({ href, title, desc, Icon }: { href: string; title: string; desc: string; Icon: any }) => (
  <Link
    href={href}
    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-lg font-bold text-slate-900 mt-1">{desc}</h3>
        <p className="text-sm text-slate-500 mt-2">
          Configura esto desde el panel y se reflejará en tu tienda pública.
        </p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Link>
);

export default async function Page() {
  const admin = await sesionAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-gray-200 pb-6">
        <Link
          href="/admin"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors group mt-1"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-black" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/20">
              <Settings2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ajuste de Tienda</h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl ml-1">
            Configura identidad, estilos y secciones
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          href="/admin/tienda/identidad"
          title="Identidad"
          desc="Logo, colores, tipografías y contacto"
          Icon={Palette}
        />
        <Card
          href="/admin/tienda/home-secciones"
          title="Home Secciones"
          desc="Ordenar y editar secciones"
          Icon={LayoutPanelTop}
        />
        <Card
          href="/admin/tienda/navegacion"
          title="Navegación"
          desc="Links del header y footer"
          Icon={Link2}
        />
        <Card
          href="/admin/tienda/seo"
          title="SEO"
          desc="Configurar SEO del catálogo"
          Icon={Search}
        />
        <Card
          href="/admin/tienda/integraciones"
          title="Integraciones"
          desc="Configurar integraciones del catálogo"
          Icon={PlugZap}
        />
        <Card
          href="/admin/tienda/footer"
          title="Footer"
          desc="Links y redes sociales del pie de página"
          Icon={Footprints}
        />
      </div>
    </div>
  );
}
