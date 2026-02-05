"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginAdmin() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    // Simulamos un pequeño delay para que la transición no sea brusca
    // (Opcional, solo por estética si la API responde muy rápido)
    await new Promise(resolve => setTimeout(resolve, 500));

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, clave }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data?.error ?? "Credenciales incorrectas");
      setCargando(false);
      return;
    }

    // Éxito: Redirigir
    router.replace("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        
        {/* Cabecera de Marca */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          {/* Decoración de fondo sutil */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner border border-white/10">
               <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Elara Atelier</h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mt-2">
              Panel Administrativo
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-8 pt-10">
          <form onSubmit={onSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                   <Mail className="w-5 h-5" />
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium text-slate-700 bg-slate-50/30 focus:bg-white"
                  placeholder="admin@elara.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  type="email"
                  required
                  disabled={cargando}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                   <Lock className="w-5 h-5" />
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 text-sm font-medium text-slate-700 bg-slate-50/30 focus:bg-white"
                  placeholder="••••••••"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  type="password"
                  required
                  disabled={cargando}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
                 <span className="font-bold">Error:</span> {error}
              </div>
            )}

            <button
              className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-bold hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400">
             &copy; {new Date().getFullYear()} Elara Atelier. Todos los derechos reservados.
           </p>
        </div>

      </div>
    </div>
  );
}