import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/* ═══════════════════════════════════════════════════════════════
   RATE LIMITING via Upstash — 5 login attempts / IP / 15 min,
   20 downloads / user / hour. Fails open when Upstash isn't
   configured yet (placeholders in .env.local).
   ═══════════════════════════════════════════════════════════════ */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

function isUpstashConfigured(): boolean {
  return !!url && !!token && url !== "REPLACE_ME" && token !== "REPLACE_ME";
}

const redis = isUpstashConfigured() ? new Redis({ url: url!, token: token! }) : null;

const loginRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "ratelimit:login" })
  : null;

const downloadRateLimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "ratelimit:download" })
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

/** True if this user is still under the 20/hour download limit. */
export async function checkDownloadRateLimit(userId: string): Promise<boolean> {
  if (!downloadRateLimit) {
    console.warn("Upstash not configured — skipping download rate limit. Set UPSTASH_REDIS_* in .env.local.");
    return true;
  }
  const { success } = await downloadRateLimit.limit(userId);
  return success;
}

/** Best-effort client IP from forwarded headers (Vercel/most proxies set this). */
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
