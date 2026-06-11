import { prisma } from "@/lib/db";

export type SiteConfigKeys = "gameEnabled" | "gambleEnabled" | "maintenanceMode";

export async function getSiteConfig(): Promise<Record<SiteConfigKeys, boolean>> {
  if (!process.env.DATABASE_URL) {
    return {
      gameEnabled: true,
      gambleEnabled: true,
      maintenanceMode: false,
    };
  }

  try {
    const flag = await prisma.systemFlag.findFirst();
    if (flag) {
      return {
        gameEnabled: flag.gameEnabled,
        gambleEnabled: flag.gambleEnabled,
        maintenanceMode: flag.maintenanceMode,
      };
    }
    return {
      gameEnabled: true,
      gambleEnabled: true,
      maintenanceMode: false,
    };
  } catch {
    // If DB isn't connected yet, return safe defaults
    return {
      gameEnabled: true,
      gambleEnabled: true,
      maintenanceMode: false,
    };
  }
}

export async function setSiteConfig(key: SiteConfigKeys, value: string) {
  if (!process.env.DATABASE_URL) return;

  const booleanValue = value === "true";
  const existing = await prisma.systemFlag.findFirst();
  
  if (existing) {
    return prisma.systemFlag.update({
      where: { id: existing.id },
      data: { [key]: booleanValue },
    });
  } else {
    return prisma.systemFlag.create({
      data: { [key]: booleanValue },
    });
  }
}
