export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { checkFeedbackRateLimit, getClientIp } from "@/lib/rateLimit";

/* ═══════════════════════════════════════════════════════════════
   API: /api/feedback
   POST: public, rate-limited 3/IP/hour, creates a Feedback row.
   GET: admin-only, newest-first inbox.
   submitFeedback() holds the Prisma/validation logic so it's
   testable without a live Next.js request scope.
   ═══════════════════════════════════════════════════════════════ */

const feedbackSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long."),
  // Optional — an empty string or omitted is fine; if present it must be valid.
  email: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email address.")])
    .optional()
    .transform((v) => (v ? v : null)),
  message: z
    .string()
    .trim()
    .min(5, "Please share a bit more detail (at least 5 characters).")
    .max(2000, "Message must be 2000 characters or fewer."),
});

type SubmitFeedbackResult = { ok: true } | { ok: false; status: number; error: string };

export async function submitFeedback(input: unknown): Promise<SubmitFeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.issues[0].message };
  }

  await prisma.feedback.create({ data: parsed.data });
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const allowed = await checkFeedbackRateLimit(getClientIp(request));
  if (!allowed) {
    return NextResponse.json({ error: "Too many submissions. Try again in an hour." }, { status: 429 });
  }

  try {
    const result = await submitFeedback(await request.json());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback Error:", error);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(feedback);
}
