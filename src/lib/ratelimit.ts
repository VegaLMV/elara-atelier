type Entry = { count: number; resetAt: number };

const memoria = new Map<string, Entry>();

export function ratelimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const e = memoria.get(key);

  if (!e || now > e.resetAt) {
    memoria.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryInMs: 0 };
  }

  if (e.count >= limit) {
    return { ok: false, remaining: 0, retryInMs: e.resetAt - now };
  }

  e.count += 1;
  memoria.set(key, e);
  return { ok: true, remaining: limit - e.count, retryInMs: 0 };
}

export function ipFromReq(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return "local";
}
