"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function getFooterLinks() {
  try {
    return await prisma.footerLink.findMany({
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch footer links:", error);
    return [];
  }
}

export async function getActiveFooterLinks() {
  try {
    return await prisma.footerLink.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch active footer links:", error);
    return [];
  }
}

export async function createFooterLink(data: { platform: string; url: string; iconName: string }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");

  const count = await prisma.footerLink.count();

  try {
    const link = await prisma.footerLink.create({
      data: {
        ...data,
        order: count,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, link };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFooterLink(id: string, data: Partial<{ platform: string; url: string; iconName: string; isActive: boolean; order: number }>) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");

  try {
    const link = await prisma.footerLink.update({
      where: { id },
      data,
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, link };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFooterLink(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new Error("Unauthorized");

  try {
    await prisma.footerLink.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
