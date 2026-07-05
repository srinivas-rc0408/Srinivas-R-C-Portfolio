import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db.ts";
import { createToken } from "../lib/auth.ts";
import { submitFeedback, GET } from "../app/api/feedback/route.ts";
import { PATCH } from "../app/api/feedback/[id]/route.ts";

const email = "test-feedback@example.dev";

async function cleanup() {
  await prisma.feedback.deleteMany({ where: { email } });
}

beforeEach(cleanup);
after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function adminCookieHeader() {
  const token = await createToken("admin@test.dev");
  return `srinivas_admin_session=${token}`;
}

test("submitFeedback rejects an invalid email", async () => {
  const result = await submitFeedback({ email: "not-an-email", message: "hi" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 400);
});

test("submitFeedback rejects a message over 2000 characters", async () => {
  const result = await submitFeedback({ email, message: "x".repeat(2001) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 400);
});

test("submitFeedback creates a Feedback row", async () => {
  const result = await submitFeedback({ email, message: "Great portfolio!" });
  assert.equal(result.ok, true);

  const rows = await prisma.feedback.findMany({ where: { email } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].message, "Great portfolio!");
  assert.equal(rows[0].isRead, false);
  assert.equal(rows[0].isFlagged, false);
});

test("GET /api/feedback rejects unauthenticated requests", async () => {
  const res = await GET(new NextRequest("http://x/api/feedback"));
  assert.equal(res.status, 401);
});

test("GET /api/feedback returns rows newest-first for admin", async () => {
  await submitFeedback({ email, message: "First" });
  await submitFeedback({ email, message: "Second" });

  const cookie = await adminCookieHeader();
  const res = await GET(new NextRequest("http://x/api/feedback", { headers: { cookie } }));
  const body = await res.json();
  const ours = body.filter((f: { email: string }) => f.email === email);
  assert.equal(ours.length, 2);
  assert.equal(ours[0].message, "Second");
});

test("PATCH /api/feedback/[id] rejects unauthenticated requests", async () => {
  await submitFeedback({ email, message: "hi" });
  const row = await prisma.feedback.findFirstOrThrow({ where: { email } });

  const res = await PATCH(new NextRequest("http://x/api/feedback/" + row.id, { method: "PATCH", body: JSON.stringify({ isRead: true }) }), {
    params: Promise.resolve({ id: row.id }),
  });
  assert.equal(res.status, 401);
});

test("PATCH /api/feedback/[id] toggles isRead and isFlagged for admin", async () => {
  await submitFeedback({ email, message: "hi" });
  const row = await prisma.feedback.findFirstOrThrow({ where: { email } });
  const cookie = await adminCookieHeader();

  const res = await PATCH(
    new NextRequest("http://x/api/feedback/" + row.id, {
      method: "PATCH",
      headers: { cookie },
      body: JSON.stringify({ isRead: true, isFlagged: true }),
    }),
    { params: Promise.resolve({ id: row.id }) }
  );
  assert.equal(res.status, 200);

  const updated = await prisma.feedback.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(updated.isRead, true);
  assert.equal(updated.isFlagged, true);
});
