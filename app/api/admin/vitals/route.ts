import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Group vitals by name and calculate average value
    const metrics = await prisma.performanceMetric.groupBy({
      by: ["name"],
      _avg: { value: true },
    });

    const formattedData = metrics.map(m => ({
      name: m.name,
      value: Math.round(m._avg.value || 0),
    }));

    return NextResponse.json(formattedData);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch vitals" }, { status: 500 });
  }
}
