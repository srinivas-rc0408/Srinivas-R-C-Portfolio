export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getUserSessionCookie, verifyToken } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   GET /api/auth/user/me
   Resolves the visitor cookie to a status. Guest state (name in
   localStorage) never touches this endpoint — it only ever reports
   "guest" (not signed in) or "user" (registered + signed in).
   resolveMeStatus() takes the token directly so it's testable
   without a live Next.js request scope (getUserSessionCookie needs one).
   ═══════════════════════════════════════════════════════════════ */

export async function resolveMeStatus(token: string | undefined) {
  if (!token) return { status: "guest" as const };

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "user") {
    return { status: "guest" as const };
  }

  return { status: "user" as const, name: payload.name, email: payload.email };
}

export async function GET() {
  const token = await getUserSessionCookie();
  return NextResponse.json(await resolveMeStatus(token));
}
