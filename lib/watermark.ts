import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

/* ═══════════════════════════════════════════════════════════════
   WATERMARK — diagonal "Srinivas R C's [Section]" on every page,
   sized to fit the page diagonal, plus a footer attribution line.
   ═══════════════════════════════════════════════════════════════ */

const WATERMARK_ANGLE_DEG = -45;
const WATERMARK_COLOR = rgb(220 / 255, 38 / 255, 38 / 255); // design token red-600
const WATERMARK_OPACITY = 0.2;

interface WatermarkOptions {
  sectionName: string;
  name: string;
  email: string;
}

export async function watermarkPdf(sourceBytes: ArrayBuffer, opts: WatermarkOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const watermarkText = `Srinivas R C's ${opts.sectionName}`;
  const footerText = `Downloaded by ${opts.name} | ${opts.email} | ${new Date().toISOString()}`;
  const angleRad = (WATERMARK_ANGLE_DEG * Math.PI) / 180;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    // Size the watermark so it spans ~60% of the page diagonal, whatever the page dimensions.
    const diagonal = Math.sqrt(width * width + height * height);
    const unitWidth = boldFont.widthOfTextAtSize(watermarkText, 1);
    const fontSize = (diagonal * 0.6) / unitWidth;
    const textWidth = unitWidth * fontSize;

    // Center the rotated baseline's midpoint on the page center.
    const centerX = width / 2;
    const centerY = height / 2;
    const x = centerX - (textWidth / 2) * Math.cos(angleRad);
    const y = centerY - (textWidth / 2) * Math.sin(angleRad);

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      font: boldFont,
      color: WATERMARK_COLOR,
      opacity: WATERMARK_OPACITY,
      rotate: degrees(WATERMARK_ANGLE_DEG),
    });

    page.drawText(footerText, {
      x: 24,
      y: 16,
      size: 7,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return pdfDoc.save();
}
