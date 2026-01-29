export function baseUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (env) return env.startsWith("http") ? env : `https://${env}`;

  const vercel = process.env.VERCEL_URL; // en prod Vercel
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function absolutizeUrl(u: string) {
  if (!u) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return new URL(u, baseUrl()).toString();
}
