import { prisma } from "@/lib/prisma";

/**
 * Rate limiter persistente usando PostgreSQL vía Prisma.
 * Funciona correctamente en Vercel Serverless (no depende de memoria RAM local).
 *
 * Usa un INSERT ... ON CONFLICT con SQL raw para garantizar atomicidad total:
 * - Si no existe el registro → lo crea con count=1.
 * - Si existe y la ventana YA EXPIRÓ → reinicia count=1 y resetAt.
 * - Si existe y la ventana SIGUE ACTIVA → incrementa count.
 * Todo esto en un único round-trip a la BD, sin race conditions.
 *
 * @param key      Identificador único: puede ser una IP, "login:127.0.0.1", etc.
 * @param limit    Número máximo de peticiones permitidas en la ventana.
 * @param windowMs Duración de la ventana en milisegundos (ej. 60_000 = 1 min).
 */
export async function ratelimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const newResetAt = new Date(Date.now() + windowMs);

  // SQL atómico: un solo round-trip.
  // ON CONFLICT (id):
  //   - Si resetAt ya pasó → reinicia (SET count=1, resetAt=newResetAt)
  //   - Si resetAt sigue activo → incrementa count
  // Siempre retorna la fila resultante.
  const result = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
    INSERT INTO "RateLimit" (id, count, "resetAt")
    VALUES (${key}, 1, ${newResetAt})
    ON CONFLICT (id) DO UPDATE
      SET
        count     = CASE
                      WHEN "RateLimit"."resetAt" < NOW() THEN 1
                      ELSE "RateLimit".count + 1
                    END,
        "resetAt" = CASE
                      WHEN "RateLimit"."resetAt" < NOW() THEN ${newResetAt}
                      ELSE "RateLimit"."resetAt"
                    END
    RETURNING count, "resetAt" AS reset_at
  `;

  const entry = result[0];
  const remaining = Math.max(0, limit - entry.count);

  // Limpieza periódica (~1% de las llamadas) para no saturar la tabla.
  // fire-and-forget: no bloquea la respuesta.
  if (Math.random() < 0.01) {
    prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: now } } })
      .catch(() => { });
  }

  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryInMs: entry.reset_at.getTime() - now.getTime(),
      resetAt: entry.reset_at,
    };
  }

  return { ok: true, remaining, retryInMs: 0, resetAt: entry.reset_at };
}

/**
 * Extrae la IP real del cliente desde los headers de Vercel.
 * x-real-ip es inyectado y validado por el Edge de Vercel (no falsificable).
 * x-forwarded-for se toma solo el primer valor para evitar IP spoofing en cadena.
 */
export function ipFromReq(req: Request) {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for");
  return ip ? ip.split(",")[0].trim() : "127.0.0.1";
}
