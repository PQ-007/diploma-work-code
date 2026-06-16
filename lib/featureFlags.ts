/**
 * Feature flags for parked features (FutureHub refocus — Phase 2).
 *
 * "Parked" features are kept in the codebase but removed from the product:
 * hidden from navigation and gated at the route. They are **off by default**;
 * set the matching env var to `"true"` to restore one during the transition.
 *
 *   NEXT_PUBLIC_ENABLE_FLASHCARDS=true
 *   NEXT_PUBLIC_ENABLE_LIBRARY=true
 *   NEXT_PUBLIC_ENABLE_LEADERBOARD=true
 *
 * See futurehub-docs/docs/features/later.md and roadmap/plan.md (Phase 2).
 */
export const featureFlags = {
  flashcards: process.env.NEXT_PUBLIC_ENABLE_FLASHCARDS === "true",
  library: process.env.NEXT_PUBLIC_ENABLE_LIBRARY === "true",
  leaderboard: process.env.NEXT_PUBLIC_ENABLE_LEADERBOARD === "true",
} as const;

export type FeatureFlag = keyof typeof featureFlags;
