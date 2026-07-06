import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/* ═══════════════════════════════════════════════════════════════
   PROXY — Route Protection
   Protects /admin/dashboard/* routes.
   Redirects unauthenticated users to /admin (login).
   ═══════════════════════════════════════════════════════════════ */

const COOKIE_NAME = "srinivas_admin_session";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith("/admin/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    // Token invalid or expired — redirect to login
    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
