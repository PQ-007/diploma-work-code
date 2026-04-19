"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, Search, Compass, Plus, Layers } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { DeckPreview } from "@/lib/flashcards/types";
import { termText } from "@/lib/flashcards/types";

type LangFilter = "all" | "ja" | "mn" | "en";

const OWNER_COLORS = [
  "#1e40af", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#ea580c",
];

function ownerColor(name: string) {
  return OWNER_COLORS[name.length % OWNER_COLORS.length];
}

export default function BrowseDecksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<DeckPreview[]>([]);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<number | null>(null);

  const fetchDecks = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/decks/browse", window.location.origin);
      if (q) url.searchParams.set("q", q);
      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setDecks(json.items || []);
      }
    } catch {
      toast.error("Failed to load decks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecks(""); }, [fetchDecks]);

  useEffect(() => {
    const h = setTimeout(() => fetchDecks(query.trim()), 300);
    return () => clearTimeout(h);
  }, [query, fetchDecks]);

  const handleClone = async (deck: DeckPreview) => {
    if (!user) { router.push("/signin"); return; }
    setCloning(deck.id);
    try {
      const res = await fetch(`/api/decks/${deck.id}/clone`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to add to library"); return; }
      toast.success(`"${deck.name}" added to your library`);
      router.push(`/flashcards/${encodeURIComponent(json.deck.slug)}`);
    } catch {
      toast.error("Failed to add to library");
    } finally {
      setCloning(null);
    }
  };

  // Featured deck = first deck that isn't already cloned
  const featured = decks.find((d) => !d.already_cloned) ?? decks[0];
  const grid = decks.filter((d) => d !== featured);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-7 max-w-6xl px-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(59,130,246,.1)", color: "#60a5fa" }}
          >
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Browse public decks</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Decks shared by other FutureHub students. Clone any deck to start
              studying — your reviews stay private.
            </p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-2 flex-wrap mt-5 mb-5">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search decks, owners, or sample terms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 text-[13px]"
            />
          </div>
          <div className="seg">
            {(["all", "ja", "mn", "en"] as const).map((l) => (
              <button
                key={l}
                className={lang === l ? "active" : ""}
                onClick={() => setLang(l)}
              >
                {l === "all" ? "All" : l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Compass className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {query
                ? `No public decks match "${query}"`
                : "No public decks available yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Be the first to share one — create a deck and toggle Public.
            </p>
          </div>
        ) : (
          <>
            {/* Featured deck strip */}
            {featured && (
              <div
                className="rounded-xl p-5 mb-5 relative overflow-hidden"
                style={{
                  background:
                    "radial-gradient(circle at 80% 20%, rgba(37,99,235,.15), transparent 50%), var(--card)",
                  border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
                }}
              >
                <div className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">
                  Featured deck
                </div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-[22px] font-bold tracking-tight">{featured.name}</h2>
                    {featured.description && (
                      <p className="text-[12px] text-muted-foreground mt-1 max-w-lg line-clamp-2">
                        {featured.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                      {featured.owner && (
                        <span className="inline-flex items-center gap-1.5">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${ownerColor(featured.owner.display_name)}, #4f46e5)`,
                            }}
                          >
                            {featured.owner.display_name.charAt(0).toUpperCase()}
                          </div>
                          by{" "}
                          <Link
                            href={`/profile/${featured.owner.user_name}`}
                            className="text-primary hover:underline"
                          >
                            @{featured.owner.user_name}
                          </Link>
                        </span>
                      )}
                      <span>· {featured.card_count} cards</span>
                    </div>
                  </div>
                  {featured.already_cloned ? (
                    <Button variant="outline" size="sm" disabled className="gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      In your library
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={cloning === featured.id || authLoading}
                      onClick={() => handleClone(featured)}
                    >
                      {cloning === featured.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add to library
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grid.map((deck) => (
                <PublicDeckCard
                  key={deck.id}
                  deck={deck}
                  cloning={cloning === deck.id}
                  authLoading={authLoading}
                  onClone={() => handleClone(deck)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PublicDeckCard({
  deck,
  cloning,
  authLoading,
  onClone,
}: {
  deck: DeckPreview;
  cloning: boolean;
  authLoading: boolean;
  onClone: () => void;
}) {
  const color = deck.owner
    ? ownerColor(deck.owner.display_name)
    : "#1e40af";

  const sampleTerms = deck.previews.slice(0, 3).map((p) => termText(p.front)).filter(Boolean);

  return (
    <div
      className="flex flex-col gap-3 transition-colors"
      style={{
        background: "var(--card)",
        border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      {/* Owner */}
      {deck.owner && (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${color}, #4f46e5)` }}
          >
            {deck.owner.display_name.charAt(0).toUpperCase()}
          </div>
          <Link
            href={`/profile/${deck.owner.user_name}`}
            className="text-[11.5px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            @{deck.owner.user_name}
          </Link>
          <span className="ml-auto text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <Layers className="h-2.5 w-2.5" />
            {deck.card_count}
          </span>
        </div>
      )}

      {/* Name + desc */}
      <div>
        <Link
          href={`/flashcards/${encodeURIComponent(deck.slug)}`}
          className="text-[14px] font-semibold tracking-tight hover:text-primary transition-colors line-clamp-1"
        >
          {deck.name}
        </Link>
        {deck.description && (
          <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {deck.description}
          </p>
        )}
      </div>

      {/* Sample terms */}
      {sampleTerms.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-1">
          {sampleTerms.map((s) => (
            <span
              key={s}
              className="font-jp text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Action button */}
      {deck.already_cloned ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-auto h-7 text-[11px] gap-1"
          disabled
        >
          <Check className="h-3 w-3" />
          In your library
        </Button>
      ) : (
        <Button
          size="sm"
          className="mt-auto h-7 text-[11px] gap-1"
          disabled={cloning || authLoading}
          onClick={onClone}
        >
          {cloning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Add to library
        </Button>
      )}
    </div>
  );
}
