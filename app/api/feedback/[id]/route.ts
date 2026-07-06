export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   PATCH /api/feedback/[id]
   Admin-only. Toggles isRead / isFlagged for the inbox.
   ═══════════════════════════════════════════════════════════════ */

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: { isRead?: boolean; isFlagged?: boolean } = {};
    if (typeof body.isRead === "boolean") data.isRead = body.isRead;
    if (typeof body.isFlagged === "boolean") data.isFlagged = body.isFlagged;

    const feedback = await prisma.feedback.update({ where: { id }, data });
    return NextResponse.json(feedback);
  } catch (error) {
    console.error("PATCH Feedback Error:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}
