import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// next-auth v5 session cookie names
const SESSION_COOKIE = "authjs.session-token";
const SESSION_COOKIE_SECURE = "__Secure-authjs.session-token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  const hasSession =
    req.cookies.has(SESSION_COOKIE) || req.cookies.has(SESSION_COOKIE_SECURE);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};
