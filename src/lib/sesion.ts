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

// 2. ✅ Obtener sesión SOLO si es ADMIN (Validación unificada)
export async function sesionAdmin() {
  const sesion = await obtenerSesion();

  if (sesion && sesion.rol === "ADMIN") {
    return sesion;
  }

  return null;
}