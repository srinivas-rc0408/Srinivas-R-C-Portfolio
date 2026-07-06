export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import {
  validateCredentials,
  createToken,
  setSessionCookie,
  getSessionCookie,
  verifyToken,
  authError,
} from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth — Login
   Validates credentials, issues JWT, sets httpOnly cookie.
   ═══════════════════════════════════════════════════════════════ */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return authError("Email and password are required.", 400);
    }

    if (!validateCredentials(email, password)) {
      return authError("Invalid credentials.", 401);
    }

    // Issue JWT
    const token = await createToken(email);

    // Set httpOnly session cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Authenticated successfully.",
    });
  } catch (error) {
    console.error("Auth error:", error);
    return authError("Internal server error.", 500);
  }
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/auth — Verify session
   Returns the current session status.
   ═══════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const token = await getSessionCookie();

    if (!token) {
      return authError("No active session.", 401);
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return authError("Session expired.", 401);
    }

    return NextResponse.json({
      authenticated: true,
      email: payload.email,
      role: payload.role,
    });
  } catch {
    return authError("Session verification failed.", 500);
  }
}
