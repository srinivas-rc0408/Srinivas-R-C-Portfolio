import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { logView } from "../app/api/log/view/route.ts";

const section = "projects:test-view-log-project";
const testEmail = "test-viewlog-user@example.dev";

after(async () => {
  await prisma.viewLog.deleteMany({ where: { section } });
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

test("logView rejects a missing or non-string section", async () => {
  const missing = await logView(undefined);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.status, 400);

  const wrongType = await logView(42);
  assert.equal(wrongType.ok, false);
});

test("logView creates a ViewLog row, userId optional", async () => {
  const result = await logView(section);
  assert.equal(result.ok, true);

  const rows = await prisma.viewLog.findMany({ where: { section } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].userId, null);
});

test("logView attaches userId when provided", async () => {
  const user = await prisma.user.create({ data: { name: "Test Viewer", email: testEmail, role: "user" } });

  const result = await logView(section, user.id);
  assert.equal(result.ok, true);

  const rows = await prisma.viewLog.findMany({ where: { section, userId: user.id } });
  assert.equal(rows.length, 1);
});
