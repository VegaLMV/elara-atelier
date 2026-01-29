"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, clave }),
    });

    setCargando(false);

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data?.error ?? "Error al iniciar sesión");
      return;
    }

    router.replace("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6">
        <h1 className="text-xl font-semibold">Elara Atelier — Admin</h1>

        <div className="space-y-2">
          <label className="text-sm">Correo</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            type="email"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Clave</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            type="password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60"
          disabled={cargando}
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
