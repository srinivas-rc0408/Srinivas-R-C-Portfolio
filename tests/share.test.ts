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
  // Scoped by a unique marker (not a global count/"latest" read) so this
  // doesn't race other test files writing to the same shared SystemLog table.
  const marker = `Resume-${Date.now()}`;

  await POST(
    new Request("http://x/api/share", {
      method: "POST",
      body: JSON.stringify({ recipientEmail: "delivered@resend.dev", documentType: marker }),
    })
  );

  const row = await prisma.systemLog.findFirst({ where: { action: { contains: marker } } });
  assert.ok(row);

  await prisma.systemLog.deleteMany({ where: { id: row!.id } });
});

test("POST rejects missing fields", async () => {
  const res = await POST(new Request("http://x/api/share", { method: "POST", body: JSON.stringify({}) }));
  assert.equal(res.status, 400);
});
