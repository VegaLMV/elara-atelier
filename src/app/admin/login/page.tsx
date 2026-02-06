"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

/**
 * COMPONENTE: LoginAdmin
 * Interfaz de autenticación con validaciones visuales y feedback de carga.
 */
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

    try {
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

      router.replace("/admin");
    } catch (err) {
      setError("Error de conexión con el servidor");
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
      {/* Decoración de fondo dinámica */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Cabecera Premium */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-400 rounded-2xl flex items-center justify-center mb-5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
               <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight italic">ÉLARA ATELIER</h1>
            <p className="text-indigo-300/80 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">
              Sistema de Gestión
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-10">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Acceso Administrativo</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                   <Mail className="w-5 h-5" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-sm font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
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
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Contraseña</label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                   <Lock className="w-5 h-5" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 text-sm font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
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
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-3 animate-shake">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                 {error}
              </div>
            )}

            <button
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold hover:bg-indigo-600 active:scale-[0.97] transition-all disabled:opacity-70 shadow-xl shadow-indigo-200/20 flex justify-center items-center gap-3 group"
              disabled={cargando}
            >
              {cargando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Ingresar al Sistema
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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