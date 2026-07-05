import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/db";
import { parseProjectsMd, slugify } from "../lib/parseProjectsMd";
import { parseCertificatesMd } from "../lib/parseCertificatesMd";
import { isR2Configured, uploadBuffer, type UploadKind } from "../lib/r2";

async function seedProjects() {
  const raw = readFileSync(join(process.cwd(), "content", "projects.md"), "utf-8");
  const projects = parseProjectsMd(raw);

  for (const [index, p] of projects.entries()) {
    const slug = slugify(p.title);
    const data = {
      title: p.title,
      shortInfo: p.shortInfo,
      longInfo: p.longInfo,
      githubUrl: p.githubUrl,
      reportUrl: p.reportUrl,
      tags: p.tags,
      sortOrder: index,
    };
    await prisma.project.upsert({ where: { slug }, update: data, create: { slug, ...data } });
  }

  console.log(`Seeded ${projects.length} projects.`);
}

async function seedDocument(type: "resume" | "cv", fileName: string) {
  const filePath = join(process.cwd(), "content", fileName);
  if (!existsSync(filePath)) {
    console.log(`Skipping ${type}: content/${fileName} not found.`);
    return;
  }
  if (!isR2Configured()) {
    console.log(`Skipping ${type} upload: R2 is not configured yet (see .env.local).`);
    return;
  }

  const buffer = readFileSync(filePath);
  const publicUrl = await uploadBuffer(type, fileName, buffer, "application/pdf");
  await prisma.document.upsert({
    where: { type },
    update: { fileUrl: publicUrl, isPublic: true },
    create: { type, fileUrl: publicUrl, isPublic: true },
  });

  console.log(`Seeded ${type} document.`);
}

function imageContentType(fileName: string): string {
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function seedCertificates() {
  const mdPath = join(process.cwd(), "content", "certificates.md");
  if (!existsSync(mdPath)) {
    console.log("Skipping certificates: content/certificates.md not found.");
    return;
  }
  if (!isR2Configured()) {
    console.log("Skipping certificates upload: R2 is not configured yet (see .env.local).");
    return;
  }

  const raw = readFileSync(mdPath, "utf-8");
  const certs = parseCertificatesMd(raw);
  const kind: UploadKind = "certificate";

  for (const [index, c] of certs.entries()) {
    const imagePath = join(process.cwd(), "content", "certificates", c.imageFile);
    if (!existsSync(imagePath)) {
      console.log(`Skipping certificate "${c.name}": image content/certificates/${c.imageFile} not found.`);
      continue;
    }

    const buffer = readFileSync(imagePath);
    const publicUrl = await uploadBuffer(kind, c.imageFile, buffer, imageContentType(c.imageFile));

    const existing = await prisma.certificate.findFirst({ where: { name: c.name } });
    const data = { imageUrl: publicUrl, completedYear: c.year, sortOrder: index };
    if (existing) {
      await prisma.certificate.update({ where: { id: existing.id }, data });
    } else {
      await prisma.certificate.create({ data: { name: c.name, ...data } });
    }
  }

  console.log(`Seeded ${certs.length} certificates.`);
}

async function main() {
  await seedProjects();
  await seedDocument("resume", "resume.pdf");
  await seedDocument("cv", "cv.pdf");
  await seedCertificates();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
