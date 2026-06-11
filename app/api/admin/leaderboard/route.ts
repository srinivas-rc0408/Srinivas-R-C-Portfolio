import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, count: 0 });
  }

  try {
    const deleted = await prisma.gameSession.deleteMany({});
    
    // Log the action
    await prisma.adminLog.create({
      data: {
        action: `Reset Game Leaderboard (${deleted.count} records)`,
        targetUserId: session.user.id,
      }
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset leaderboard" }, { status: 500 });
  }
}
