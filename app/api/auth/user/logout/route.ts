import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearUserSessionCookie, getUserSessionCookie } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/user/logout
   Clears the visitor cookie and its Session row (if one exists —
   register-issued tokens have no Session row, which is fine here).
   Admin auth (/api/auth, /api/auth/logout) is untouched.
   ═══════════════════════════════════════════════════════════════ */

export async function POST() {
  const token = await getUserSessionCookie();
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  await clearUserSessionCookie();
  return NextResponse.json({ success: true });
}
