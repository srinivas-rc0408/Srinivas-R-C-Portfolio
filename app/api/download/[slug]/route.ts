import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { UAParser } from "ua-parser-js";
import nodemailer from "nodemailer";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    
    // We create a new PDF Document here for demonstration.
    // In production with R2, you would fetch the base PDF buffer from Cloudflare R2:
    // const basePdfBytes = await fetch("https://your-r2-bucket.com/" + slug + ".pdf").then(res => res.arrayBuffer());
    // const pdfDoc = await PDFDocument.load(basePdfBytes);
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 48;
    const watermarkText = `Confidential copy for ${session.user.name}`;
    
    // Draw some placeholder text for the section content since we don't have R2 integrated yet.
    page.drawText(`Srinivas RC - ${slug.toUpperCase()} Section`, {
      x: 50,
      y: height - 100,
      size: 24,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Add the diagonal watermark
    page.drawText(watermarkText, {
      x: width / 2 - 200,
      y: height / 2,
      size: 32,
      font,
      color: rgb(0.42, 0.39, 1), // #6C63FF
      opacity: 0.15,
      rotate: degrees(-45),
    });

    // Add footer
    const footerText = `Downloaded by: ${session.user.name} | ${session.user.email} | ${new Date().toISOString()}`;
    page.drawText(footerText, {
      x: 50,
      y: 30,
      size: 8,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    // Log the download event
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
            userId: session.user.id,
            section: slug,
            fileName: `SrinivasRC_${slug}.pdf`,
            ipAddress: ip,
            userAgent: uaReadable,
            estimatedCompany: estimatedCompany,
          }
        });
        
        // Add global activity feed entry
        await prisma.adminLog.create({
          data: {
            action: `Downloaded ${slug.toUpperCase()} PDF`,
            targetUserId: session.user.id,
          }
        });
      } catch {
        // DB might not be connected
      }
    }

    // Trigger Email Alert for Top-Tier Tech Companies
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
          subject: `🚀 High-Value Download Alert: ${session.user.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Recruiter Intelligence Alert</h2>
              <p>A download of your <b>${slug.toUpperCase()}</b> section just occurred.</p>
              <ul>
                <li><b>Name:</b> ${session.user.name}</li>
                <li><b>Email:</b> ${session.user.email}</li>
                <li><b>Estimated Company/ISP:</b> ${estimatedCompany}</li>
                <li><b>IP Address:</b> ${ip}</li>
                <li><b>Device:</b> ${uaReadable}</li>
              </ul>
              <p>Check your <a href="https://yourportfolio.com/admin?tab=recruiter">Admin Dashboard</a> for more details.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Failed to send download alert email", err);
      }
    }

    // Return the file as a stream/buffer
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SrinivasRC_${slug}.pdf"`,
      },
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
