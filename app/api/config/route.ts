import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/config";

export async function GET() {
  const config = await getSiteConfig();
  
  // Expose only non-sensitive public config
  return NextResponse.json({
    gameEnabled: config.gameEnabled,
    gambleEnabled: config.gambleEnabled,
  });
}
