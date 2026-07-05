import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { prisma } from "../lib/db.ts";
import { createToken } from "../lib/auth.ts";
import { GET, PUT } from "../app/api/projects/route.ts";
import { GET as GET_SLUG } from "../app/api/projects/[slug]/route.ts";

const sample = {
  slug: "test-project",
  title: "Test Project",
  shortInfo: "Short.",
  longInfo: "Long form body.",
  githubUrl: "https://github.com/x/test",
  reportUrl: null,
  tags: ["TS"],
  sortOrder: 0,
  isVisible: true,
};

beforeEach(async () => {
  await prisma.project.deleteMany({ where: { slug: sample.slug } });
});

after(async () => {
  await prisma.project.deleteMany({ where: { slug: sample.slug } });
  await prisma.$disconnect();
});

async function adminCookieHeader() {
  const token = await createToken("admin@test.dev");
  return `srinivas_admin_session=${token}`;
}

test("GET returns only visible projects with card shape for anonymous requests", async () => {
  await prisma.project.create({ data: { ...sample, isVisible: false } });
  const res = await GET(new NextRequest("http://x/api/projects"));
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(!body.some((p: { slug: string }) => p.slug === sample.slug));
});

test("GET includes hidden projects and full shape for admin requests", async () => {
  await prisma.project.create({ data: { ...sample, isVisible: false } });
  const cookie = await adminCookieHeader();
  const res = await GET(new NextRequest("http://x/api/projects", { headers: { cookie } }));
  const body = await res.json();
  const found = body.find((p: { slug: string }) => p.slug === sample.slug);
  assert.ok(found);
  assert.equal(found.longInfo, sample.longInfo);
});

test("PUT rejects unauthenticated requests", async () => {
  const res = await PUT(new NextRequest("http://x/api/projects", { method: "PUT", body: JSON.stringify([sample]) }));
  assert.equal(res.status, 401);
});

test("PUT rejects malformed payloads", async () => {
  const cookie = await adminCookieHeader();
  const res = await PUT(
    new NextRequest("http://x/api/projects", {
      method: "PUT",
      headers: { cookie },
      body: JSON.stringify([{ slug: "bad" }]),
    })
  );
  assert.equal(res.status, 400);
});

test("PUT upserts valid projects and GET /api/projects/[slug] returns them", async () => {
  const cookie = await adminCookieHeader();
  const putRes = await PUT(
    new NextRequest("http://x/api/projects", {
      method: "PUT",
      headers: { cookie },
      body: JSON.stringify([sample]),
    })
  );
  assert.equal(putRes.status, 200);

  const slugRes = await GET_SLUG(new Request("http://x/api/projects/test-project"), {
    params: Promise.resolve({ slug: sample.slug }),
  });
  assert.equal(slugRes.status, 200);
  const body = await slugRes.json();
  assert.equal(body.longInfo, sample.longInfo);
});

test("GET /api/projects/[slug] 404s for hidden projects", async () => {
  await prisma.project.create({ data: { ...sample, isVisible: false } });
  const res = await GET_SLUG(new Request("http://x/api/projects/test-project"), {
    params: Promise.resolve({ slug: sample.slug }),
  });
  assert.equal(res.status, 404);
});
