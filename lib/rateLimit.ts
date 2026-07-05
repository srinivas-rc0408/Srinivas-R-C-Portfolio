import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/* ═══════════════════════════════════════════════════════════════
   RATE LIMITING — 5 login attempts / IP / 15 min via Upstash.
   Fails open (skips limiting) when Upstash isn't configured yet.
   ═══════════════════════════════════════════════════════════════ */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

function isUpstashConfigured(): boolean {
  return !!url && !!token && url !== "REPLACE_ME" && token !== "REPLACE_ME";
}

const loginRateLimit = isUpstashConfigured()
  ? new Ratelimit({
      redis: new Redis({ url: url!, token: token! }),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "ratelimit:login",
    })
  : null;

/** True if this IP is still under the login attempt limit. */
export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  if (!loginRateLimit) {
    console.warn("Upstash not configured — skipping login rate limit. Set UPSTASH_REDIS_* in .env.local.");
    return true;
  }
  const { success } = await loginRateLimit.limit(ip);
  return success;
}

/** Best-effort client IP from forwarded headers (Vercel/most proxies set this). */
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
