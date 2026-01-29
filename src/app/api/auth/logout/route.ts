export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  const nombreCookie = process.env.AUTH_COOKIE ?? "elara_session";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(nombreCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
