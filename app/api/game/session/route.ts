import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserSessionCookie, verifyToken } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   POST /api/game/session
   Logs a completed driving-game trip. userId attached when the
   visitor is signed in, otherwise anonymous.
   createGameSession() holds the Prisma/validation logic so it's
   testable without a live Next.js request scope.
   ═══════════════════════════════════════════════════════════════ */

const sessionSchema = z.object({
  vehicleType: z.enum(["motorcycle", "car", "bus"]),
  distanceTraveled: z.number().min(0),
  stopsVisited: z.array(z.string()),
  durationSeconds: z.number().min(0),
});

type CreateSessionResult = { ok: true } | { ok: false; status: number; error: string };

export async function createGameSession(input: unknown, userId?: string): Promise<CreateSessionResult> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.issues[0].message };
  }

  await prisma.gameSession.create({
    data: {
      vehicleType: parsed.data.vehicleType,
      distanceTraveled: parsed.data.distanceTraveled,
      stopsVisited: parsed.data.stopsVisited,
      durationSeconds: parsed.data.durationSeconds,
      userId,
    },
  });
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const token = await getUserSessionCookie();
    const payload = token ? await verifyToken(token) : null;
    const userId = payload?.role === "user" ? payload.sub : undefined;

    const result = await createGameSession(await request.json(), userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GameSession Error:", error);
    return NextResponse.json({ error: "Failed to save game session." }, { status: 500 });
  }
}
