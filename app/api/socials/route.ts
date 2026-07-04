import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   API: /api/socials
   Handles the Master Socials & Footer Engine backend.
   Persists global footer links to Postgres via Prisma.
   ═══════════════════════════════════════════════════════════════ */

// Default fallback socials
const DEFAULT_SOCIALS = {
  Instagram: "https://instagram.com",
  Email: "hello@example.com",
  LinkedIn: "https://linkedin.com",
  GitHub: "https://github.com",
  Steam: "https://steamcommunity.com",
};

// GET: Fetch the latest social links
export async function GET() {
  try {
    let row = await prisma.portfolioData.findUnique({ where: { sectionKey: "socials" } });

    if (!row) {
      row = await prisma.portfolioData.create({
        data: { sectionKey: "socials", title: "Social Links", metadata: DEFAULT_SOCIALS },
      });
      return NextResponse.json(DEFAULT_SOCIALS);
    }

    return NextResponse.json({ ...DEFAULT_SOCIALS, ...(row.metadata as object) });
  } catch (error) {
    console.error("GET Socials Error:", error);
    return NextResponse.json({ error: "Failed to load socials" }, { status: 500 });
  }
}

// POST: Update the social links
export async function POST(request: Request) {
  try {
    const { socials } = await request.json();
    if (!socials || typeof socials !== "object") {
      return NextResponse.json({ error: "Invalid data format. Expected an object." }, { status: 400 });
    }

    await prisma.portfolioData.upsert({
      where: { sectionKey: "socials" },
      update: { metadata: socials },
      create: { sectionKey: "socials", title: "Social Links", metadata: socials },
    });

    return NextResponse.json({ success: true, message: "Socials updated successfully." });
  } catch (error) {
    console.error("POST Socials Error:", error);
    return NextResponse.json({ error: "Failed to sync socials" }, { status: 500 });
  }
}
