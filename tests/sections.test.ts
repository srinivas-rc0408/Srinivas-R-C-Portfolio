import { test, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { GET, POST } from "../app/api/sections/route.ts";

beforeEach(async () => {
  await prisma.section.deleteMany();
});

after(async () => {
  await prisma.section.deleteMany();
  await prisma.$disconnect();
});

test("GET returns empty array when no sections exist", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test("POST syncs sections and GET returns them ordered by sortOrder", async () => {
  const body = {
    sections: [
      { id: "b", title: "Second", items: [1, 2] },
      { id: "a", title: "First", items: [] },
    ],
  };
  const postRes = await POST(new Request("http://x/api/sections", { method: "POST", body: JSON.stringify(body) }));
  assert.equal(postRes.status, 200);
  assert.equal((await postRes.json()).success, true);

  const getRes = await GET();
  const sections = await getRes.json();
  assert.deepEqual(sections, [
    { id: "b", title: "Second", items: [1, 2] },
    { id: "a", title: "First", items: [] },
  ]);
});

test("POST rejects non-array payload", async () => {
  const res = await POST(new Request("http://x/api/sections", { method: "POST", body: JSON.stringify({ sections: "nope" }) }));
  assert.equal(res.status, 400);
});
