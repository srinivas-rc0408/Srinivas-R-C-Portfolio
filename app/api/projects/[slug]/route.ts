export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   API: /api/projects/[slug]
   Full project detail (incl. longInfo). 404 if missing or hidden.
   ═══════════════════════════════════════════════════════════════ */

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const project = await prisma.project.findUnique({ where: { slug } });
    if (!project || !project.isVisible) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("GET Project Error:", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}
