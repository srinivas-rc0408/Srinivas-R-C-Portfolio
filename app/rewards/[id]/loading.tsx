import RewardSkeleton from "./RewardSkeleton";

/**
 * Route-level loading UI.
 * Displayed automatically by Next.js while the page is streaming.
 * Uses the same skeleton as the Suspense fallback for visual consistency.
 */
export default function Loading() {
  return <RewardSkeleton />;
}
