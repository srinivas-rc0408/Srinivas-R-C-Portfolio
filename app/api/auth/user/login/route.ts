export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createUserToken, setUserSessionCookie } from "@/lib/auth";
import { checkLoginRateLimit, getClientIp } from "@/lib/rateLimit";

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/user/login
   Visitor login: rate-limited 5 attempts / IP / 15 min, creates a
   Session row (unlike register, which signs in without one).
   loginUser() holds the Prisma logic so it's testable without a
   live Next.js request scope (setUserSessionCookie needs one).
   ═══════════════════════════════════════════════════════════════ */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginResult =
  | { ok: true; user: { id: string; name: string; email: string }; token: string }
  | { ok: false; status: number; error: string };

export async function loginUser(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Invalid email or password." };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return { ok: false, status: 401, error: "Invalid email or password." };
  }

  const token = await createUserToken(user);
  await prisma.session.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  return { ok: true, user, token };
}

export async function POST(request: NextRequest) {
  const allowed = await checkLoginRateLimit(getClientIp(request));
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again in 15 minutes." }, { status: 429 });
  }

  try {
    const result = await loginUser(await request.json());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await setUserSessionCookie(result.token);
    return NextResponse.json({ success: true, name: result.user.name, email: result.user.email });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
