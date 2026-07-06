export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   API: /api/sections
   Handles the Universal Section Manager backend.
   Persists dynamic sections to Postgres via Prisma.
   ═══════════════════════════════════════════════════════════════ */

// GET all sections
export async function GET() {
  try {
    const rows = await prisma.section.findMany({ orderBy: { sortOrder: "asc" } });
    const sections = rows.map((row) => ({
      id: row.id,
      title: row.title,
      items: row.items,
    }));
    return NextResponse.json(sections);
  } catch (error) {
    console.error("GET Sections Error:", error);
    return NextResponse.json({ error: "Failed to load sections" }, { status: 500 });
  }
}

// POST: Sync the entire sections array (overwrites existing, adds new, deletes removed) — admin only
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sections } = await request.json();
    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: "Invalid data format. Expected array of sections." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.section.deleteMany(),
      prisma.section.createMany({
        data: sections.map((sec, i) => ({
          id: sec.id,
          title: sec.title,
          items: sec.items || [],
          sortOrder: i,
        })),
      }),
    ]);

    return NextResponse.json({ success: true, message: "Sections synced successfully." });
  } catch (error) {
    console.error("POST Sections Error:", error);
    return NextResponse.json({ error: "Failed to sync sections" }, { status: 500 });
  }
}
