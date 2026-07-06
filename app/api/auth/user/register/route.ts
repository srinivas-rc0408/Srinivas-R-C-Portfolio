export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createUserToken, setUserSessionCookie } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   POST /api/auth/user/register
   Creates a visitor account and signs them in immediately.
   registerUser() holds the Prisma/validation logic so it's testable
   without a live Next.js request scope (setUserSessionCookie needs one).
   ═══════════════════════════════════════════════════════════════ */

const registerSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type RegisterResult =
  | { ok: true; user: { id: string; name: string; email: string }; token: string }
  | { ok: false; status: number; error: string };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.issues[0].message };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, status: 409, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash, role: "user" },
  });

  const token = await createUserToken(user);
  return { ok: true, user, token };
}

export async function POST(request: NextRequest) {
  try {
    const result = await registerUser(await request.json());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await setUserSessionCookie(result.token);
    return NextResponse.json({ success: true, name: result.user.name, email: result.user.email });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Failed to register." }, { status: 500 });
  }
}
