import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* ═══════════════════════════════════════════════════════════════
   R2 STORAGE
   Cloudflare R2 (S3-compatible) client for resumes, CVs, project
   reports, and certificate images.
   ═══════════════════════════════════════════════════════════════ */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPES = {
  resume: ["application/pdf"],
  cv: ["application/pdf"],
  report: ["application/pdf"],
  certificate: ["image/png", "image/jpeg", "image/webp"],
} as const;

export type UploadKind = keyof typeof ALLOWED_CONTENT_TYPES;

export function isValidUploadKind(kind: string): kind is UploadKind {
  return kind in ALLOWED_CONTENT_TYPES;
}

export function isAllowedContentType(kind: UploadKind, contentType: string): boolean {
  return (ALLOWED_CONTENT_TYPES[kind] as readonly string[]).includes(contentType);
}

function env() {
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
}

/** True once every R2_* var is set to something other than the placeholder. */
export function isR2Configured(): boolean {
  return Object.values(env()).every((v) => !!v && v !== "REPLACE_ME");
}

function getClient() {
  const { accountId, accessKeyId, secretAccessKey } = env();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured. Set R2_* vars in .env.local.");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function buildKey(kind: UploadKind, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${kind}/${Date.now()}-${safeName}`;
}

function publicUrlForKey(key: string): string {
  const { publicUrl } = env();
  if (!publicUrl) {
    throw new Error("R2 storage is not configured. Set R2_PUBLIC_URL in .env.local.");
  }
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

/** For the browser upload flow: client PUTs the file directly to R2. */
export async function createPresignedUpload(kind: UploadKind, fileName: string, contentType: string) {
  const { bucket } = env();
  if (!bucket) throw new Error("R2 storage is not configured. Set R2_BUCKET_NAME in .env.local.");

  const key = buildKey(kind, fileName);
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 });

  return { uploadUrl, publicUrl: publicUrlForKey(key), key };
}

/** For server-side seeding: upload a buffer directly, no presign round-trip. */
export async function uploadBuffer(kind: UploadKind, fileName: string, body: Buffer, contentType: string) {
  const { bucket } = env();
  if (!bucket) throw new Error("R2 storage is not configured. Set R2_BUCKET_NAME in .env.local.");

  const key = buildKey(kind, fileName);
  await getClient().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));

  return publicUrlForKey(key);
}
