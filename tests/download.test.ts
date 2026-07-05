import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { prisma } from "../lib/db.ts";
import { resolveSource } from "../app/api/download/[type]/route.ts";
import { watermarkPdf } from "../lib/watermark.ts";
import { summarizeUserAgent, estimateCompany } from "../lib/recruiterIntel.ts";
import { checkDownloadRateLimit } from "../lib/rateLimit.ts";

const projectSlug = "test-download-project";

async function cleanup() {
  await prisma.document.deleteMany({ where: { type: { in: ["resume", "cv"] } } });
  await prisma.project.deleteMany({ where: { slug: projectSlug } });
}

beforeEach(cleanup);
after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("resolveSource returns null when the resume Document has no fileUrl", async () => {
  await prisma.document.create({ data: { type: "resume", fileUrl: null, isPublic: true } });
  assert.equal(await resolveSource("resume"), null);
});

test("resolveSource returns the resume file when uploaded", async () => {
  await prisma.document.create({ data: { type: "resume", fileUrl: "https://r2.example/resume.pdf", isPublic: true } });
  const source = await resolveSource("resume");
  assert.deepEqual(source, {
    fileUrl: "https://r2.example/resume.pdf",
    sectionName: "Resume",
    fileName: "SrinivasRC_resume.pdf",
  });
});

test("resolveSource parses report:<slug> and resolves the project's reportUrl", async () => {
  await prisma.project.create({
    data: {
      slug: projectSlug,
      title: "Test Download Project",
      shortInfo: "Short.",
      longInfo: "Long.",
      githubUrl: "https://github.com/x/test",
      reportUrl: "https://r2.example/report.pdf",
      tags: [],
    },
  });
  const source = await resolveSource(`report:${projectSlug}`);
  assert.deepEqual(source, {
    fileUrl: "https://r2.example/report.pdf",
    sectionName: "Test Download Project Report",
    fileName: `SrinivasRC_${projectSlug}_report.pdf`,
  });
});

test("resolveSource returns null for an unknown type or missing report", async () => {
  assert.equal(await resolveSource("not-a-real-type"), null);
  assert.equal(await resolveSource("report:no-such-project"), null);
});

test("watermarkPdf preserves page count and produces a larger, still-valid PDF", async () => {
  const source = await PDFDocument.create();
  source.addPage([612, 792]);
  source.addPage([612, 792]);
  const sourceBytes = await source.save();

  const watermarked = await watermarkPdf(sourceBytes.buffer.slice(sourceBytes.byteOffset, sourceBytes.byteOffset + sourceBytes.byteLength), {
    sectionName: "Resume",
    name: "Peter Parker",
    email: "peter@example.dev",
  });

  const reloaded = await PDFDocument.load(watermarked);
  assert.equal(reloaded.getPageCount(), 2);
  assert.ok(watermarked.byteLength > sourceBytes.byteLength);
});

test("summarizeUserAgent extracts browser/OS/device from a real UA string", () => {
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const summary = summarizeUserAgent(ua);
  assert.match(summary, /Chrome/);
  assert.match(summary, /Windows/);
});

test("summarizeUserAgent falls back gracefully for an empty UA string", () => {
  assert.equal(summarizeUserAgent(""), "Unknown Browser on Unknown OS (desktop)");
});

test("estimateCompany returns null for unknown/local IPs without a network call", async () => {
  assert.equal(await estimateCompany(""), null);
  assert.equal(await estimateCompany("unknown"), null);
  assert.equal(await estimateCompany("127.0.0.1"), null);
  assert.equal(await estimateCompany("::1"), null);
});

test("checkDownloadRateLimit fails open when Upstash isn't configured", async () => {
  assert.equal(await checkDownloadRateLimit("test-user-id"), true);
});
