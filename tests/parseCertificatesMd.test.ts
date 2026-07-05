import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCertificatesMd } from "../lib/parseCertificatesMd.ts";

test("parseCertificatesMd splits blocks and extracts year + image metadata", () => {
  const raw = `# AWS Certified Solutions Architect
year: 2024
image: aws-saa.png

# Meta Front-End Developer
year: 2023
image: meta-frontend.jpg`;

  const certs = parseCertificatesMd(raw);
  assert.equal(certs.length, 2);
  assert.deepEqual(certs[0], { name: "AWS Certified Solutions Architect", year: 2024, imageFile: "aws-saa.png" });
  assert.deepEqual(certs[1], { name: "Meta Front-End Developer", year: 2023, imageFile: "meta-frontend.jpg" });
});

test("parseCertificatesMd falls back to current year when year metadata is missing", () => {
  const certs = parseCertificatesMd("# No Year Cert\nimage: cert.png");
  assert.equal(certs[0].year, new Date().getFullYear());
  assert.equal(certs[0].imageFile, "cert.png");
});
