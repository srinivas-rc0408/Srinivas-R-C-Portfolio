import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db.ts";
import { createToken } from "../lib/auth.ts";
import { GET, POST } from "../app/api/socials/route.ts";

const DEFAULT_SOCIALS = {
  Instagram: "https://instagram.com",
  Email: "hello@example.com",
  LinkedIn: "https://linkedin.com",
  GitHub: "https://github.com",
  Steam: "https://steamcommunity.com",
};

beforeEach(async () => {
  await prisma.portfolioData.deleteMany({ where: { sectionKey: "socials" } });
});

after(async () => {
  await prisma.portfolioData.deleteMany({ where: { sectionKey: "socials" } });
  await prisma.$disconnect();
});

async function adminCookieHeader() {
  const token = await createToken("admin@test.dev");
  return `srinivas_admin_session=${token}`;
}

test("GET seeds and returns defaults when missing", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), DEFAULT_SOCIALS);

  const row = await prisma.portfolioData.findUnique({ where: { sectionKey: "socials" } });
  assert.ok(row);
});

test("POST rejects unauthenticated requests", async () => {
  const res = await POST(new NextRequest("http://x/api/socials", { method: "POST", body: JSON.stringify({ socials: {} }) }));
  assert.equal(res.status, 401);
});

test("POST upserts and GET returns merged overrides", async () => {
  const cookie = await adminCookieHeader();
  const postRes = await POST(
    new NextRequest("http://x/api/socials", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify({ socials: { GitHub: "https://github.com/srinivasrc" } }),
    })
  );
  assert.equal(postRes.status, 200);
  assert.equal((await postRes.json()).success, true);

  const getRes = await GET();
  assert.deepEqual(await getRes.json(), { ...DEFAULT_SOCIALS, GitHub: "https://github.com/srinivasrc" });
});

test("POST rejects non-object payload", async () => {
  const cookie = await adminCookieHeader();
  const res = await POST(
    new NextRequest("http://x/api/socials", { method: "POST", headers: { cookie }, body: JSON.stringify({ socials: "nope" }) })
  );
  assert.equal(res.status, 400);
});
