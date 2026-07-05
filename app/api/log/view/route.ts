import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSessionCookie, verifyToken } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   POST /api/log/view
   Fire-and-forget page-view logging. Public — never gates rendering.
   logView() holds the Prisma logic so it's testable without a live
   Next.js request scope (getUserSessionCookie needs one).
   ═══════════════════════════════════════════════════════════════ */

type LogViewResult = { ok: true } | { ok: false; status: number; error: string };

export async function logView(section: unknown, userId?: string): Promise<LogViewResult> {
  if (typeof section !== "string" || !section) {
    return { ok: false, status: 400, error: "section is required." };
  }

  await prisma.viewLog.create({ data: { section, userId } });
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const { section } = await request.json();

    const token = await getUserSessionCookie();
    const payload = token ? await verifyToken(token) : null;
    const userId = payload?.role === "user" ? payload.sub : undefined;

    const result = await logView(section, userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ViewLog Error:", error);
    return NextResponse.json({ error: "Failed to log view." }, { status: 500 });
  }
}
