import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isRead } = await req.json();

    if (!id || typeof isRead !== "boolean") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await prisma.feedback.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback update error:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}
