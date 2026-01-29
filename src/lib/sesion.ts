import { cookies } from "next/headers";
import { verificarSesion } from "./auth";

export async function obtenerSesion() {
  const nombre = process.env.AUTH_COOKIE ?? "elara_session";
  const token = (await cookies()).get(nombre)?.value;
  if (!token) return null;

  try {
    return await verificarSesion(token);
  } catch {
    return null;
  }
}
