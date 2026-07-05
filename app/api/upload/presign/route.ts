import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { createPresignedUpload, isValidUploadKind, isAllowedContentType, MAX_UPLOAD_BYTES } from "@/lib/r2";

/* ═══════════════════════════════════════════════════════════════
   POST /api/upload/presign
   Admin-only. Returns a presigned R2 PUT URL so the browser can
   upload directly (Vercel's 4.5MB request body limit rules out
   proxying the file through this API route).
   ═══════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, contentType, kind, size } = await request.json();

    if (!fileName || !contentType || !kind) {
      return NextResponse.json({ error: "fileName, contentType, and kind are required." }, { status: 400 });
    }
    if (!isValidUploadKind(kind)) {
      return NextResponse.json({ error: "Invalid kind." }, { status: 400 });
    }
    if (!isAllowedContentType(kind, contentType)) {
      return NextResponse.json({ error: "Unsupported file type for this upload kind." }, { status: 400 });
    }
    if (typeof size === "number" && size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File exceeds 15MB limit." }, { status: 400 });
    }

    const { uploadUrl, publicUrl } = await createPresignedUpload(kind, fileName, contentType);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("Presign Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
