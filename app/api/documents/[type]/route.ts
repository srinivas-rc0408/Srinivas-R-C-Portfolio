export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   API: /api/documents/[type]
   type is "resume" | "cv". Public: only if isPublic. Admin: always.
   PATCH: admin-only, upserts fileUrl and/or isPublic.
   ═══════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;

  try {
    const doc = await prisma.document.findUnique({ where: { type } });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!doc.isPublic && !(await isAdminRequest(request))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("GET Document Error:", error);
    return NextResponse.json({ error: "Failed to load document" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;

  try {
    const body = await request.json();
    const data: { fileUrl?: string; isPublic?: boolean } = {};
    if (typeof body.fileUrl === "string") data.fileUrl = body.fileUrl;
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;

    const doc = await prisma.document.upsert({
      where: { type },
      update: data,
      create: { type, fileUrl: data.fileUrl ?? null, isPublic: data.isPublic ?? false },
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error("PATCH Document Error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
