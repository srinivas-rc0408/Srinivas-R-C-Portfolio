import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
  });
}

export default auth(async (req) => {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";

  // 1. Rate Limiting
  if (ratelimit) {
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      if (!success) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }
    } catch (e) {
      // Fail open if Redis is down
    }
  }

  const response = NextResponse.next();

  // 2. Admin Route Protection
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute) {
    if (!req.auth || (req.auth.user as any)?.role !== "admin") {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  // 3. Guest Session Logic
  if (!req.auth && !req.cookies.has("visitorId")) {
    const visitorId = crypto.randomUUID();
    response.cookies.set("visitorId", visitorId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return response;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
