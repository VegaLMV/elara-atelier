import { obtenerSesion } from "@/lib/sesion";

export default async function AdminHome() {
  const sesion = await obtenerSesion();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Panel Administrativo</h1>
      <p className="mt-2">Bienvenida/o: {sesion?.correo}</p>

      <div className="mt-6 space-y-2">
        <a className="underline" href="/admin/productos">Gestionar productos</a>
      </div>
    </div>
  );
}
