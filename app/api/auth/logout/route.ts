import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/logout — Destroy session
   ═══════════════════════════════════════════════════════════════ */

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out." });
}
