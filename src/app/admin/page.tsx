import { obtenerSesion } from "@/lib/sesion";

export default async function AdminHome() {
  // Usamos obtenerSesion para ver quién eres, aunque no seas ADMIN todavía
  const sesion = await obtenerSesion();

  if (!sesion) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">No hay sesión activa</h1>
        <p>Por favor inicia sesión nuevamente.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Panel Administrativo</h1>
      
      <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
        <p className="text-gray-500 text-sm uppercase tracking-wide font-bold">Estado de tu cuenta</p>
        <p className="mt-1">Usuario: <b>{sesion.correo}</b></p>
        <p className="mt-1">
          Rol actual: 
          <span className={`ml-2 px-2 py-0.5 rounded text-sm font-bold ${sesion.rol === 'ADMIN' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {sesion.rol}
          </span>
        </p>
        
        {sesion.rol !== 'ADMIN' && (
          <div className="mt-3 text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
            ⚠️ <b>Atención:</b> Tu usuario no tiene permisos de Administrador. <br/>
            Si intentas "Gestionar productos", el sistema te redirigirá al login por seguridad.
            <br className="mb-2"/>
            <span className="opacity-80 italic">Solución: Cambia tu rol a 'ADMIN' en la base de datos (Tabla Usuario).</span>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {sesion.rol === 'ADMIN' ? (
          <a className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800" href="/admin/productos">
            Gestionar productos
          </a>
        ) : (
          <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
            Gestionar productos (Requiere Admin)
          </button>
        )}
      </div>
    </div>
  );
}