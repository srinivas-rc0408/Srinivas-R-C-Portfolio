import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   POST /api/case-open
   Fire-and-forget log of a completed case opening (item won, rarity).
   logCaseOpen() holds the Prisma logic so it's testable without a
   live Next.js request scope.
   ═══════════════════════════════════════════════════════════════ */

type LogCaseOpenResult = { ok: true } | { ok: false; status: number; error: string };

export async function logCaseOpen(input: { itemId: unknown; rarity: unknown }): Promise<LogCaseOpenResult> {
  const { itemId, rarity } = input;
  if (typeof itemId !== "string" || !itemId || typeof rarity !== "string" || !rarity) {
    return { ok: false, status: 400, error: "itemId and rarity are required." };
  }

  await prisma.systemLog.create({ data: { action: `Case Opened: ${itemId} (${rarity})` } });
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const result = await logCaseOpen(await request.json());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CaseOpen Log Error:", error);
    return NextResponse.json({ error: "Failed to log case opening." }, { status: 500 });
  }
}
