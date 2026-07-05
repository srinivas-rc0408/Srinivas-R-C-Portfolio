import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProjectsMd, slugify } from "../lib/parseProjectsMd.ts";

test("slugify lowercases and dashes non-alnum runs", () => {
  assert.equal(slugify("NeuroForge Engine!!"), "neuroforge-engine");
});

test("parseProjectsMd splits blocks and extracts metadata + body", () => {
  const raw = `# Alpha Project
short: A short line.
github: https://github.com/x/alpha
tags: TS, AI

Long body for alpha.
Second line.

# Beta Project
short: Another short line.
github: https://github.com/x/beta

Long body for beta.`;

  const projects = parseProjectsMd(raw);
  assert.equal(projects.length, 2);
  assert.deepEqual(projects[0], {
    title: "Alpha Project",
    shortInfo: "A short line.",
    githubUrl: "https://github.com/x/alpha",
    reportUrl: null,
    tags: ["TS", "AI"],
    longInfo: "Long body for alpha.\nSecond line.",
  });
  assert.equal(projects[1].title, "Beta Project");
  assert.deepEqual(projects[1].tags, []);
  assert.equal(projects[1].longInfo, "Long body for beta.");
});
