import { SignJWT, jwtVerify } from "jose";

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Falta AUTH_SECRET en .env");
  return new TextEncoder().encode(s);
};

export type SesionPayload = {
  usuarioId: string;
  correo: string;
  rol: "ADMIN" | "COLABORADOR";
};

export async function firmarSesion(payload: SesionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verificarSesion(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as SesionPayload;
}
