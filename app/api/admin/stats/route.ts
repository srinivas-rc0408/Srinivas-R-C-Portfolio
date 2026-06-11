import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = Redis.fromEnv();
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cacheKey = "admin_dashboard_stats";

  if (redis) {
    try {
      const cachedStats = await redis.get(cacheKey);
      if (cachedStats) {
        return NextResponse.json(cachedStats);
      }
    } catch (e) {
      // Fail open if Redis is down
      console.error("Redis get failed:", e);
    }
  }

  if (!process.env.DATABASE_URL) {
    const fallbackStats = {
      totalDownloads: 0,
      totalViews: 0,
      activeSessions: 0,
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(fallbackStats);
  }

  try {
    const [totalDownloads, totalViews, activeSessions] = await Promise.all([
      prisma.downloadLog.count(),
      prisma.viewLog.count(),
      prisma.gameSession.count(), // We'll count all sessions as "active" for now
    ]);

    const stats = {
      totalDownloads,
      totalViews,
      activeSessions,
      timestamp: new Date().toISOString()
    };

    if (redis) {
      try {
        await redis.setex(cacheKey, 60, JSON.stringify(stats));
      } catch (e) {
        console.error("Redis setex failed:", e);
      }
    }

    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
