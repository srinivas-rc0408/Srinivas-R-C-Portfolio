import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { POST } from "../app/api/share/route.ts";

after(async () => {
  await prisma.$disconnect();
});

test("POST logs the request to SystemLog before attempting delivery", async () => {
  // ponytail: asserts the Prisma write, not the Resend HTTP outcome — the
  // route logs unconditionally before calling Resend, so this holds even
  // when RESEND_API_KEY is misconfigured in the environment.
  const before = await prisma.systemLog.count();

  await POST(
    new Request("http://x/api/share", {
      method: "POST",
      body: JSON.stringify({ recipientEmail: "delivered@resend.dev", documentType: "Resume" }),
    })
  );

  const after_ = await prisma.systemLog.count();
  assert.equal(after_, before + 1);

  const latest = await prisma.systemLog.findFirst({ orderBy: { createdAt: "desc" } });
  assert.match(latest!.action, /Resume/);
});

test("POST rejects missing fields", async () => {
  const res = await POST(new Request("http://x/api/share", { method: "POST", body: JSON.stringify({}) }));
  assert.equal(res.status, 400);
});
