import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/db.ts";
import { createGameSession } from "../app/api/game/session/route.ts";

after(async () => {
  await prisma.gameSession.deleteMany({ where: { vehicleType: "test-vehicle-cleanup-marker" } });
  await prisma.$disconnect();
});

test("createGameSession rejects an invalid vehicleType", async () => {
  const result = await createGameSession({
    vehicleType: "spaceship",
    distanceTraveled: 100,
    stopsVisited: [],
    durationSeconds: 30,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 400);
});

test("createGameSession rejects negative distance or duration", async () => {
  const result = await createGameSession({
    vehicleType: "car",
    distanceTraveled: -5,
    stopsVisited: [],
    durationSeconds: 30,
  });
  assert.equal(result.ok, false);
});

test("createGameSession creates an anonymous row when no userId is given", async () => {
  const result = await createGameSession({
    vehicleType: "motorcycle",
    distanceTraveled: 1234.5,
    stopsVisited: ["projects", "education"],
    durationSeconds: 90,
  });
  assert.equal(result.ok, true);

  const row = await prisma.gameSession.findFirst({
    where: { vehicleType: "motorcycle", distanceTraveled: 1234.5 },
    orderBy: { playedAt: "desc" },
  });
  assert.ok(row);
  assert.equal(row?.userId, null);
  assert.deepEqual(row?.stopsVisited, ["projects", "education"]);

  await prisma.gameSession.deleteMany({ where: { id: row!.id } });
});

test("createGameSession attaches userId when signed in", async () => {
  const email = "test-gamesession-user@example.dev";
  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({ data: { name: "Test Driver", email, role: "user" } });

  const result = await createGameSession(
    { vehicleType: "bus", distanceTraveled: 500, stopsVisited: [], durationSeconds: 60 },
    user.id
  );
  assert.equal(result.ok, true);

  const row = await prisma.gameSession.findFirst({ where: { userId: user.id } });
  assert.ok(row);

  await prisma.gameSession.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { email } });
});
