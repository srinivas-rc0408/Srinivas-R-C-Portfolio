import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { submitScore, topScores } from "../app/api/leaderboard/route.ts";

// short: submitted names must fit the route's 24-char cap
const MARKER = "tlb-mk";

after(async () => {
  await prisma.gameScore.deleteMany({ where: { name: { startsWith: MARKER } } });
  await prisma.$disconnect();
});

test("submitScore rejects an unknown game", async () => {
  const result = await submitScore({ game: "chess", name: `${MARKER}-a`, score: 10 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 400);
});

test("submitScore rejects an over-long or empty name and non-positive scores", async () => {
  assert.equal((await submitScore({ game: "dash", name: "x".repeat(40), score: 10 })).ok, false);
  assert.equal((await submitScore({ game: "dash", name: "   ", score: 10 })).ok, false);
  assert.equal((await submitScore({ game: "dash", name: `${MARKER}-b`, score: 0 })).ok, false);
});

test("submitScore stores a valid row", async () => {
  const result = await submitScore({ game: "dash", name: `${MARKER}-c`, score: 123 });
  assert.equal(result.ok, true);
  const row = await prisma.gameScore.findFirst({ where: { name: `${MARKER}-c` } });
  assert.ok(row);
  assert.equal(row?.score, 123);
  assert.equal(row?.game, "dash");
});

test("topScores returns each player's best score, ordered descending", async () => {
  await submitScore({ game: "drive", name: `${MARKER}-p1`, score: 50 });
  await submitScore({ game: "drive", name: `${MARKER}-p1`, score: 200 });
  await submitScore({ game: "drive", name: `${MARKER}-p2`, score: 120 });

  const result = await topScores("drive");
  assert.equal(result.ok, true);
  if (result.ok) {
    const mine = result.scores.filter((s) => s.name.startsWith(MARKER));
    assert.deepEqual(mine, [
      { name: `${MARKER}-p1`, score: 200 },
      { name: `${MARKER}-p2`, score: 120 },
    ]);
  }
});

test("topScores rejects an unknown game", async () => {
  const result = await topScores("chess");
  assert.equal(result.ok, false);
});
