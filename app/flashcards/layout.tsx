import { notFound } from "next/navigation";
import { featureFlags } from "@/lib/featureFlags";

/**
 * Flashcards is a parked feature (FutureHub refocus — Phase 2). The whole
 * route subtree 404s unless re-enabled via NEXT_PUBLIC_ENABLE_FLASHCARDS=true.
 * Code and DB tables are intentionally kept — this is parked, not cut.
 * See futurehub-docs/docs/features/later.md.
 */
export default function FlashcardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!featureFlags.flashcards) {
    notFound();
  }

  return <>{children}</>;
}
