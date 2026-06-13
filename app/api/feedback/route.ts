import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const feedbackSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  message: z
    .string()
    .min(10, "Feedback must be at least 10 characters.")
    .max(500, "Feedback must be under 500 characters."),
  guestId: z.string().nullable().optional(),
});

/* ─── Heuristic spam filter ─── */
function isSpam(text: string): boolean {
  // Check for excessive repeating characters (e.g., "aaaaaa")
  if (/(.)\1{5,}/.test(text)) return true;

  // Check for no spaces at all (likely gibberish)
  if (text.length > 20 && !text.includes(" ")) return true;

  // Check for too many special characters
  const specialRatio = (text.replace(/[a-zA-Z0-9\s]/g, "").length) / text.length;
  if (specialRatio > 0.5) return true;

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { email, message, guestId } = parsed.data;

    // Heuristic spam check
    if (isSpam(message)) {
      return NextResponse.json(
        { error: "Please provide valid feedback." },
        { status: 400 }
      );
    }

    // Flag suspicious but not obviously spam content
    let isFlagged = false;

    // OpenAI Moderation API (free, fast) — optional integration
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const modRes = await fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({ input: message }),
        });

        if (modRes.ok) {
          const modData = await modRes.json();
          const result = modData.results?.[0];
          if (result?.flagged) {
            return NextResponse.json(
              { error: "Feedback violates content guidelines." },
              { status: 400 }
            );
          }
        }
      }
    } catch {
      // Fallback: moderation API failed, continue with heuristic only
    }

    // Save to database
    await prisma.feedback.create({
      data: {
        email,
        message,
        guestId: guestId || null,
        isFlagged,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
