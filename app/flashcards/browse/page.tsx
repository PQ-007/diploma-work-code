"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Brain,
  Compass,
  Search,
  Layers,
  Check,
  Loader2,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { DeckPreview } from "@/lib/flashcards/types";

export default function BrowseDecksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<DeckPreview[]>([]);
  const [query, setQuery] = useState("");
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

  useEffect(() => {
    fetchDecks("");
  }, [fetchDecks]);

  useEffect(() => {
    const h = setTimeout(() => fetchDecks(query.trim()), 300);
    return () => clearTimeout(h);
  }, [query, fetchDecks]);

  const handleClone = async (deck: DeckPreview) => {
    if (!user) {
      router.push("/signin");
      return;
    }
    setCloning(deck.id);
    try {
      const res = await fetch(`/api/decks/${deck.id}/clone`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to add to library");
        return;
      }
      toast.success(`"${deck.name}" added to your library`);
      router.push(`/flashcards/${encodeURIComponent(json.deck.slug)}`);
    } catch {
      toast.error("Failed to add to library");
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-5 max-w-7xl px-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link
                href="/flashcards"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Brain className="h-4 w-4" />
                My Flashcards
              </Link>
              <span>/</span>
              <span className="text-foreground">Browse</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Compass className="h-6 w-6" />
              Browse public decks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover decks shared by other learners. Add any deck to your
              library to study your own copy.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/flashcards">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              My Flashcards
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search decks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <Card
                key={deck.id}
                className="border-border/60 bg-card/50 hover:bg-card transition-colors flex flex-col"
              >
                <CardContent className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-tight line-clamp-2">
                      {deck.name}
                    </h3>
                    {deck.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {deck.description}
                      </p>
                    )}
                  </div>

                  {deck.owner && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={deck.owner.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {deck.owner.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/profile/${deck.owner.user_name}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {deck.owner.display_name}
                      </Link>
                    </div>
                  )}

                  <Badge variant="secondary" className="self-start text-[11px] gap-1">
                    <Layers className="h-3 w-3" />
                    {deck.card_count}{" "}
                    {deck.card_count === 1 ? "card" : "cards"}
                  </Badge>

                  {deck.previews.length > 0 && (
                    <div className="space-y-1.5 text-xs border-t border-border/40 pt-3 flex-1">
                      {deck.previews.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="line-clamp-1 text-muted-foreground"
                        >
                          <span className="font-medium text-foreground">
                            {p.front}
                          </span>
                          <span className="mx-1.5">→</span>
                          {p.back}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 mt-auto">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                    >
                      <Link href={`/flashcards/${encodeURIComponent(deck.slug)}`}>
                        Preview
                      </Link>
                    </Button>
                    {deck.already_cloned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        disabled
                      >
                        <Check className="h-3 w-3" />
                        In library
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs gap-1"
                        disabled={cloning === deck.id || authLoading}
                        onClick={() => handleClone(deck)}
                      >
                        {cloning === deck.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Library className="h-3 w-3" />
                        )}
                        Add to Library
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
