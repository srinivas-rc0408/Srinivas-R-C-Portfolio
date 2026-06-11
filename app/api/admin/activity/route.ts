import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json([]);
  }

  try {
    // Fetch from AdminLog directly (which we now use to log all major activities)
    const logs = await prisma.adminLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
