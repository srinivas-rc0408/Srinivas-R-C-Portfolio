import { Suspense } from "react";
import RewardContent from "./RewardContent";
import RewardSkeleton from "./RewardSkeleton";

/* ═══════════════════════════════════════════════════════════════
   REWARD PAGE — /rewards/[id]
   Dynamic page that renders the unlocked secret archive content.
   ═══════════════════════════════════════════════════════════════ */

const VALID_IDS = ["resume", "projects", "archagent", "ai_system"] as const;

export async function generateStaticParams() {
  return VALID_IDS.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const titles: Record<string, string> = {
    resume: "Secret Archive — Resume",
    projects: "Secret Archive — Projects",
    archagent: "Secret Archive — ArchAgent",
    ai_system: "Secret Archive — AI System",
  };
  return {
    title: titles[id] || "Secret Archive",
    description: `Unlocked content from the secret archive: ${id}`,
  };
}

export default async function RewardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<RewardSkeleton />}>
      <RewardContent id={id} />
    </Suspense>
  );
}
