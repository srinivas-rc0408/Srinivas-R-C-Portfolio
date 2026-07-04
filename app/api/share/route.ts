import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════
   POST /api/share — Automated Email Delivery
   Uses Resend to deliver requested documents and logs the action
   to the Admin Dashboard system_logs.
   ═══════════════════════════════════════════════════════════════ */

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { recipientEmail, documentType } = await request.json();

    if (!recipientEmail || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* 1. Log the request to the internal Admin Dashboard */
    const actionLog = `Document Requested: ${documentType} sent to ${recipientEmail}`;
    await prisma.systemLog.create({ data: { action: actionLog } });

    /* 2. Format the email content professionally */
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000; border-bottom: 1px solid #eaeaea; padding-bottom: 12px;">Srinivas R. C. — Portfolio</h2>
        <p>Dear Recruiter,</p>
        <p>Thank you for exploring my portfolio. Here is the <strong>${documentType}</strong> you requested.</p>
        <p>You can find the document attached to this email.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>Srinivas R. C.</strong><br/>
        <span style="color: #666; font-size: 14px;">AI/ML Engineer & Full-Stack Developer</span></p>
      </div>
    `;

    /* 3. Determine attachment (Mocking a local PDF for the example) */
    // In production, this would point to a real file path or S3 URL.
    // For this demo, we'll create a dummy text file if a real PDF doesn't exist.
    const dummyContent = Buffer.from(`This is the requested ${documentType} for Srinivas R. C.`);

    /* 4. Send the email via Resend */
    const { data, error } = await resend.emails.send({
      from: "Srinivas Portfolio <onboarding@resend.dev>", // resend.dev for testing, use custom domain in prod
      to: recipientEmail,
      subject: `Requested Document: ${documentType} | Srinivas R. C.`,
      html: htmlContent,
      attachments: [
        {
          filename: `${documentType.replace(/\s+/g, "_")}_SrinivasRC.pdf`,
          content: dummyContent,
        },
      ],
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
