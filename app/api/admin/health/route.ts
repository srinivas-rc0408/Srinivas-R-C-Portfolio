import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const memUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    // Recent logins (last 24h)
    let recentLogins = 0;
    let totalUsers = 0;
    let totalViews = 0;
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      recentLogins = await prisma.user.count({
        where: { createdAt: { gte: oneDayAgo } },
      });
      totalUsers = await prisma.user.count();
      totalViews = await prisma.viewLog.count();
    } catch {
      // DB may not be connected
    }

    return NextResponse.json({
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      uptime: {
        seconds: Math.round(uptimeSeconds),
        formatted: formatUptime(uptimeSeconds),
      },
      recentLogins,
      totalUsers,
      totalViews,
    });
  } catch {
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
