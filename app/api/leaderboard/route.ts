export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserSessionCookie, verifyToken } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   /api/leaderboard
   GET  ?game=dash|drive → top 10, one entry per player (their best)
   POST { game, name, score } → store a run. userId attached when a
   registered visitor is signed in; guests submit with their local
   name. submitScore()/topScores() hold the logic so it's testable
   without a live Next.js request scope.
   ═══════════════════════════════════════════════════════════════ */

const GAMES = ["dash", "drive", "rush"] as const;

const submitSchema = z.object({
  game: z.enum(GAMES),
  name: z
    .string()
    .trim()
    .min(1)
    .max(24)
    .transform((n) => n.replace(/\s+/g, " ")),
  score: z.number().int().min(1).max(1_000_000),
});

type SubmitResult = { ok: true } | { ok: false; status: number; error: string };

export async function submitScore(input: unknown, userId?: string): Promise<SubmitResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Invalid score submission." };
  }
  await prisma.gameScore.create({ data: { ...parsed.data, userId } });
  return { ok: true };
}

type TopResult =
  | { ok: true; scores: { name: string; score: number }[] }
  | { ok: false; status: number; error: string };

export async function topScores(game: string): Promise<TopResult> {
  if (!GAMES.includes(game as (typeof GAMES)[number])) {
    return { ok: false, status: 400, error: "Unknown game." };
  }
  const rows = await prisma.gameScore.groupBy({
    by: ["name"],
    where: { game },
    _max: { score: true },
    orderBy: { _max: { score: "desc" } },
    take: 10,
  });
  return { ok: true, scores: rows.map((r) => ({ name: r.name, score: r._max.score ?? 0 })) };
}

export async function GET(request: NextRequest) {
  try {
    const result = await topScores(request.nextUrl.searchParams.get("game") ?? "");
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ scores: result.scores });
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getUserSessionCookie();
    const payload = token ? await verifyToken(token) : null;
    const result = await submitScore(await request.json(), payload?.sub);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leaderboard POST error:", error);
    return NextResponse.json({ error: "Failed to submit score." }, { status: 500 });
  }
}
