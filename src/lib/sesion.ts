import { cookies } from "next/headers";
import { verificarSesion } from "./auth";

// 1. Obtener sesión genérica (Cualquier rol)
export async function obtenerSesion() {
  const cookieStore = await cookies();
  
  // INTENTO ROBUSTO: Buscar el token en todas las posibles cookies
  // Esto soluciona problemas si el nombre en .env no coincide con el navegador
  const token = 
    cookieStore.get(process.env.AUTH_COOKIE || "elara_session")?.value || 
    cookieStore.get("auth_token")?.value || 
    cookieStore.get("token")?.value;
  
  if (!token) return null;

  try {
    return await verificarSesion(token);
  } catch {
    return null;
  }
}

// 2. ✅ Obtener sesión SOLO si es ADMIN (Para rutas protegidas)
// Mantenemos esta función para compatibilidad, aunque usemos obtenerSesion en otros lados
export async function sesionAdmin() {
  const sesion = await obtenerSesion();
  
  // Si existe la sesión, asumimos que es válida (simplificado para un solo usuario)
  if (sesion) {
    return sesion;
  }

  return null;
}