import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { getLastUpdated } from "../app/api/last-updated/route.ts";

after(async () => {
  await prisma.$disconnect();
});

test("getLastUpdated returns a Date no older than the most recently touched row", async () => {
  const before = new Date();
  await prisma.portfolioData.upsert({
    where: { sectionKey: "test-last-updated" },
    update: { title: "bump" },
    create: { sectionKey: "test-last-updated", title: "bump" },
  });

  const result = await getLastUpdated();
  assert.ok(result instanceof Date);
  assert.ok(result.getTime() >= before.getTime() - 1000);

  await prisma.portfolioData.deleteMany({ where: { sectionKey: "test-last-updated" } });
});

test("getLastUpdated never throws when tables are queried in parallel", async () => {
  await assert.doesNotReject(getLastUpdated());
});
