import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/* ═══════════════════════════════════════════════════════════════
   RATE LIMITING via Upstash — 5 login attempts / IP / 15 min,
   20 downloads / user / hour, 3 feedback submissions / IP / hour.
   Fails open when Upstash isn't configured yet (placeholders in
   .env.local).
   ═══════════════════════════════════════════════════════════════ */

function isUpstashConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // `new Redis()` throws if url isn't https — so gate on the prefix, not just presence.
  return !!url && !!token && url.startsWith("https") && token !== "REPLACE_ME";
}

type Limiters = { login: Ratelimit; download: Ratelimit; feedback: Ratelimit };

// undefined = not yet built; null = built but Upstash unconfigured (fail-open).
let limiters: Limiters | null | undefined;

/** Lazily build the limiters on first use. `new Redis()` never runs at import time. */
function getLimiters(): Limiters | null {
  if (limiters === undefined) {
    if (isUpstashConfigured()) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      limiters = {
        login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "ratelimit:login" }),
        download: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "ratelimit:download" }),
        feedback: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), prefix: "ratelimit:feedback" }),
      };
    } else {
      limiters = null;
    }
  }
  return limiters;
}

/** True if this IP is still under the login attempt limit. */
export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  const l = getLimiters();
  if (!l) {
    console.warn("Upstash not configured — skipping login rate limit. Set UPSTASH_REDIS_* in .env.local.");
    return true;
  }
  const { success } = await l.login.limit(ip);
  return success;
}

/** True if this user is still under the 20/hour download limit. */
export async function checkDownloadRateLimit(userId: string): Promise<boolean> {
  const l = getLimiters();
  if (!l) {
    console.warn("Upstash not configured — skipping download rate limit. Set UPSTASH_REDIS_* in .env.local.");
    return true;
  }
  const { success } = await l.download.limit(userId);
  return success;
}

/** True if this IP is still under the 3/hour feedback submission limit. */
export async function checkFeedbackRateLimit(ip: string): Promise<boolean> {
  const l = getLimiters();
  if (!l) {
    console.warn("Upstash not configured — skipping feedback rate limit. Set UPSTASH_REDIS_* in .env.local.");
    return true;
  }
  const { success } = await l.feedback.limit(ip);
  return success;
}

/** Best-effort client IP from forwarded headers (Vercel/most proxies set this). */
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
