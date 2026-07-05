import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   API: /api/certificates
   Public: isPublic certs only, most recent first.
   Admin: all certs.
   POST: admin-only, create a certificate row.
   PATCH: admin-only, bulk isPublic toggle for the "Make Private" flow.
   ═══════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdminRequest(request);

    const certificates = await prisma.certificate.findMany({
      where: admin ? undefined : { isPublic: true },
      orderBy: [{ completedYear: "desc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("GET Certificates Error:", error);
    return NextResponse.json({ error: "Failed to load certificates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, imageUrl, completedYear, sortOrder } = body;

    if (typeof name !== "string" || typeof imageUrl !== "string" || typeof completedYear !== "number") {
      return NextResponse.json(
        { error: "name, imageUrl, and completedYear are required." },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.create({
      data: { name, imageUrl, completedYear, sortOrder: typeof sortOrder === "number" ? sortOrder : 0 },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("POST Certificate Error:", error);
    return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, isPublic } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0 || typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "ids (non-empty array) and isPublic are required." }, { status: 400 });
    }

    await prisma.certificate.updateMany({ where: { id: { in: ids } }, data: { isPublic } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Certificates Error:", error);
    return NextResponse.json({ error: "Failed to update certificates" }, { status: 500 });
  }
}
