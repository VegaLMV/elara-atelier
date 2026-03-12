import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const cookieName = process.env.AUTH_COOKIE ?? "elara_session";
const secretStr = process.env.AUTH_SECRET ?? "";
const secret = new TextEncoder().encode(secretStr);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const esAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const esApiAdmin = pathname.startsWith("/api/admin/");
  if (!esAdmin && !esApiAdmin) return NextResponse.next();

  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    if (esApiAdmin) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (!secretStr) {
    if (esApiAdmin) {
      return NextResponse.json({ error: "AUTH_SECRET no configurado" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, secret);
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch {
    const res = esApiAdmin
      ? NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", req.url));

    res.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
