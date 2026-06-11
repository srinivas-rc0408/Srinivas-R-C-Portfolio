import { NextResponse } from "next/server";
import { z } from "zod";
import { UAParser } from "ua-parser-js";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import { auth } from "@/lib/auth";

const downloadLogSchema = z.object({
  section: z.string().min(1),
  fileName: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = downloadLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload", details: result.error.flatten() }, { status: 400 });
    }

    const { section, fileName } = result.data;
    
    // Auth context (optional, handles guest tracking)
    const session = await auth();
    const userId = session?.user?.id;

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgentStr = req.headers.get("user-agent") || "";
    
    // Parse UA
    const parser = new UAParser(userAgentStr);
    const uaResult = parser.getResult();
    const uaReadable = `${uaResult.browser.name || 'Unknown Browser'} on ${uaResult.os.name || 'Unknown OS'} (${uaResult.device.type || 'desktop'})`;

    // Estimate Company/ISP using ip-api.com
    let estimatedCompany = "Unknown ISP";
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const ipRes = await fetch(`http://ip-api.com/json/${ip}?fields=isp,org`);
        const ipData = await ipRes.json();
        if (ipData.isp) {
          estimatedCompany = ipData.org ? `${ipData.org} (${ipData.isp})` : ipData.isp;
        }
      } catch (e) {
        // Silently fail if ip-api is down or rate-limited
      }
    }

    if (process.env.DATABASE_URL) {
      try {
        await prisma.downloadLog.create({
          data: {
            userId,
            section,
            fileName,
            ipAddress: ip,
            userAgent: uaReadable,
            estimatedCompany,
          }
        });
        
        // Add global activity feed entry
        await prisma.adminLog.create({
          data: {
            action: `Downloaded ${section.toUpperCase()} via API`,
            targetUserId: userId,
          }
        });
      } catch {
        // DB might not be connected
      }
    }

    // Trigger Alert for Top-Tier Tech Companies
    const targetCompanies = ["google", "amazon", "microsoft", "meta", "apple", "tata", "netflix", "stripe"];
    const isHighValue = targetCompanies.some(company => estimatedCompany.toLowerCase().includes(company));

    if (isHighValue && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ADMIN_EMAIL) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_PORT === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `🚀 High-Value Log Alert: ${session?.user?.name || 'Guest'}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Recruiter Intelligence Alert</h2>
              <p>A download log trigger for <b>${section.toUpperCase()}</b> just occurred.</p>
              <ul>
                <li><b>Name:</b> ${session?.user?.name || 'Guest'}</li>
                <li><b>Estimated Company/ISP:</b> ${estimatedCompany}</li>
                <li><b>IP Address:</b> ${ip}</li>
                <li><b>Device:</b> ${uaReadable}</li>
              </ul>
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send alert", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
