import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db.ts";
import { createToken } from "../lib/auth.ts";
import { GET, POST } from "../app/api/sections/route.ts";

beforeEach(async () => {
  await prisma.section.deleteMany();
});

after(async () => {
  await prisma.section.deleteMany();
  await prisma.$disconnect();
});

async function adminCookieHeader() {
  const token = await createToken("admin@test.dev");
  return `srinivas_admin_session=${token}`;
}

test("GET returns empty array when no sections exist", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test("POST rejects unauthenticated requests", async () => {
  const res = await POST(new NextRequest("http://x/api/sections", { method: "POST", body: JSON.stringify({ sections: [] }) }));
  assert.equal(res.status, 401);
});

test("POST syncs sections and GET returns them ordered by sortOrder", async () => {
  const cookie = await adminCookieHeader();
  const body = {
    sections: [
      { id: "b", title: "Second", items: [1, 2] },
      { id: "a", title: "First", items: [] },
    ],
  };
  const postRes = await POST(
    new NextRequest("http://x/api/sections", { method: "POST", headers: { cookie }, body: JSON.stringify(body) })
  );
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
  const cookie = await adminCookieHeader();
  const res = await POST(
    new NextRequest("http://x/api/sections", { method: "POST", headers: { cookie }, body: JSON.stringify({ sections: "nope" }) })
  );
  assert.equal(res.status, 400);
});
