import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Public endpoint to check document availability for a given type
// Query: ?type=RESUME or ?type=CV
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.toUpperCase();

  if (type !== "RESUME" && type !== "CV") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { type: type as "RESUME" | "CV" },
      select: { fileUrl: true, isPublic: true },
    });

    if (!doc) {
      // No document record exists at all
      return NextResponse.json({ exists: false, isPublic: false, hasFile: false });
    }

    return NextResponse.json({
      exists: true,
      isPublic: doc.isPublic,
      hasFile: !!doc.fileUrl,
    });
  } catch {
    // DB error — default to no access
    return NextResponse.json({ exists: false, isPublic: false, hasFile: false });
  }
}
