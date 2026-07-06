import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { logCaseOpen } from "../app/api/case-open/route.ts";

after(async () => {
  await prisma.$disconnect();
});

test("logCaseOpen writes item and rarity to SystemLog", async () => {
  const marker = `test-item-${Date.now()}`;
  const result = await logCaseOpen({ itemId: marker, rarity: "gold" });
  assert.equal(result.ok, true);

  const row = await prisma.systemLog.findFirst({ where: { action: { contains: marker } } });
  assert.ok(row);
  assert.match(row!.action, /gold/);

  await prisma.systemLog.deleteMany({ where: { id: row!.id } });
});

test("logCaseOpen rejects a missing itemId or rarity", async () => {
  const result = await logCaseOpen({ itemId: "", rarity: "gold" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 400);
});
