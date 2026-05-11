import { NextResponse } from "next/server";
import * as jose from "jose";

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  /* =======================
     ALWAYS PUBLIC
  ======================= */
  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/signup") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  /* =======================
     LOGIN PAGE — redirect to /chat if already authenticated
  ======================= */
  if (pathname === "/") {
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jose.jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/chat", req.url));
      } catch {
        // Invalid/expired token — let them see the login page
      }
    }
    return NextResponse.next();
  }


  if (
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/gemini") ||
    pathname.startsWith("/api/profile")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jose.jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}