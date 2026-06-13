import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Fetch both document records for admin display
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const documents = await prisma.document.findMany();
    return NextResponse.json(documents);
  } catch {
    return NextResponse.json([]);
  }
}

// PATCH: Toggle isPublic for a document type
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { type, isPublic } = await req.json();

    if (!type || typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Upsert: create if doesn't exist, update if it does
    const doc = await prisma.document.upsert({
      where: { type },
      update: { isPublic },
      create: { type, isPublic },
    });

    await prisma.adminLog.create({
      data: {
        action: `Set ${type} visibility to ${isPublic ? "public" : "private"}`,
        targetUserId: session.user.id,
      },
    });

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
