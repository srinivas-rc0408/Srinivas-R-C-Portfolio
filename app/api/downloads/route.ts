import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   GET /api/downloads
   Admin-only. Feeds the RecruiterTracker table — newest first.
   ═══════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.downloadLog.findMany({
    orderBy: { downloadedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
    take: 200,
  });

  return NextResponse.json(logs);
}
