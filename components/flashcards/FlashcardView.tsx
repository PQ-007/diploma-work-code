"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shuffle, RotateCw, BookMarked } from "lucide-react";
import type { Flashcard } from "@/lib/flashcards/types";
import { effectiveFront, effectiveBack } from "@/lib/flashcards/types";

// SM-2 grade config (matches the HTML design)
const GRADES = [
  {
    quality: 1,
    label: "Again",
    sub: "<10m",
    kbd: "1",
    color: "#ef4444",
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.4)",
  },
  {
    quality: 2,
    label: "Hard",
    sub: "2d",
    kbd: "2",
    color: "#fb923c",
    bg: "rgba(251,146,60,.12)",
    border: "rgba(251,146,60,.4)",
  },
  {
    quality: 4,
    label: "Good",
    sub: "4d",
    kbd: "3",
    color: "#22c55e",
    bg: "rgba(34,197,94,.12)",
    border: "rgba(34,197,94,.4)",
  },
  {
    quality: 5,
    label: "Easy",
    sub: "7d",
    kbd: "4",
    color: "#3b82f6",
    bg: "rgba(59,130,246,.12)",
    border: "rgba(59,130,246,.4)",
  },
] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface FlashcardViewProps {
  cards: Flashcard[];
  sm2Mode?: boolean;
  onClose?: () => void;
  onGrade?: (cardId: number, quality: number) => void;
}

export default function FlashcardView({
  cards,
  sm2Mode = false,
  onClose,
  onGrade,
}: FlashcardViewProps) {
  const [order, setOrder] = useState<Flashcard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState<number | null>(null);

  useEffect(() => {
    setOrder(cards);
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const card = order[index];

  const next = useCallback(() => {
    setFlipped(false);
    setGrading(null);
    setTimeout(() => setIndex((i) => Math.min(i + 1, order.length - 1)), 50);
  }, [order.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setGrading(null);
    setTimeout(() => setIndex((i) => Math.max(i - 1, 0)), 50);
  }, []);

  const handleGrade = async (quality: number) => {
    if (!card || grading !== null) return;
    setGrading(quality);
    try {
      await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      onGrade?.(card.id, quality);
    } catch {
      // silently continue
    } finally {
      setGrading(null);
      next();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape" && onClose) onClose();
      // SM-2 keyboard grades
      if (flipped && sm2Mode) {
        if (e.key === "1") handleGrade(1);
        else if (e.key === "2") handleGrade(2);
        else if (e.key === "3") handleGrade(4);
        else if (e.key === "4") handleGrade(5);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose, flipped, sm2Mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!card) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        No cards to study.
      </div>
    );
  }

  const front = effectiveFront(card);
  const back = effectiveBack(card);
  const total = order.length;
  const progress = ((index + 1) / total) * 100;

  const isJapanese = front.language === "ja";

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Session ·{" "}
          <span className="text-foreground font-medium">{index + 1}</span> of{" "}
          {total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setOrder(shuffle(order)); setIndex(0); setFlipped(false); }}
            title="Shuffle"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setOrder(cards); setIndex(0); setFlipped(false); }}
            title="Reset order"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 3-D Flip card */}
      <div
        className="flip-scene w-full cursor-pointer select-none"
        style={{ height: 380 }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flip-inner${flipped ? " flipped" : ""}`}>
          {/* ── FRONT ────────────────────────────────────────── */}
          <div
            className="flip-face rounded-2xl p-10 flex flex-col items-center justify-center text-center relative"
            style={{
              background:
                "linear-gradient(180deg, #0d1018, #08090d)",
              boxShadow:
                "0 30px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.05)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-4"
            >
              Term{isJapanese ? " · 動詞" : ""}
            </div>

            {/* Source badge */}
            {card.source_type === "dictionary" && (
              <div className="mb-3">
                <Badge
                  variant="secondary"
                  className="text-[10px] gap-1"
                  style={{
                    background: "rgba(37,99,235,.16)",
                    color: "#60a5fa",
                    border: "1px solid rgba(37,99,235,.3)",
                  }}
                >
                  <BookMarked className="h-2.5 w-2.5" />
                  Dictionary
                </Badge>
              </div>
            )}

            {/* Term — large */}
            <div
              className={isJapanese ? "font-jp-serif" : ""}
              style={{
                fontSize: isJapanese ? 88 : 48,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: isJapanese ? "-0.02em" : "-0.01em",
              }}
            >
              {front.term}
            </div>

            {/* Reading */}
            {front.reading && (
              <div
                className={`font-jp text-muted-foreground mt-4`}
                style={{ fontSize: 22 }}
              >
                {front.reading}
              </div>
            )}

            {/* Language badge */}
            <div className="mt-3">
              <Badge variant="outline" className="text-[10px]">
                {front.language?.toUpperCase()}
              </Badge>
            </div>

            {/* Parts of speech */}
            {front.partsOfSpeech && front.partsOfSpeech.length > 0 && (
              <div className="flex justify-center gap-1.5 flex-wrap mt-3">
                {front.partsOfSpeech.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {p}
                  </Badge>
                ))}
              </div>
            )}

            {/* Flip hint */}
            <div className="absolute bottom-5 right-6 text-[10px] text-muted-foreground flex items-center gap-1.5">
              <RotateCw className="h-3 w-3" />
              Tap or press{" "}
              <span className="kbd">Space</span> to flip
            </div>
          </div>

          {/* ── BACK ─────────────────────────────────────────── */}
          <div
            className="flip-face flip-face-back rounded-2xl p-8 flex flex-col relative"
            style={{
              background:
                "linear-gradient(180deg, #0d1018, #08090d)",
              boxShadow:
                "0 30px 60px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.05)",
            }}
          >
            {/* Back header row: term + source */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-baseline gap-2">
                <span
                  className={isJapanese ? "font-jp-serif" : ""}
                  style={{ fontSize: 28, fontWeight: 600 }}
                >
                  {front.term}
                </span>
                {front.reading && (
                  <span className="font-jp text-[13px] text-muted-foreground italic">
                    {front.reading}
                  </span>
                )}
              </div>
              {card.source_type === "dictionary" && (
                <Badge
                  variant="secondary"
                  className="text-[10px] gap-1"
                  style={{
                    background: "rgba(37,99,235,.16)",
                    color: "#60a5fa",
                    border: "1px solid rgba(37,99,235,.3)",
                  }}
                >
                  Dictionary
                </Badge>
              )}
            </div>

            {/* Definition + translations */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {/* Definition (EN by default) */}
              <div className="flex gap-3 items-start py-2 border-b border-border/40">
                <span
                  className="text-[10px] font-semibold border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground shrink-0"
                  style={{ minWidth: 34, textAlign: "center" }}
                >
                  DEF
                </span>
                <div className="text-[15px] flex-1 leading-snug">
                  {back.definition}
                </div>
              </div>

              {/* Translations */}
              {back.translations?.map((t, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start py-2 border-b border-border/40"
                >
                  <span
                    className="text-[10px] font-semibold border border-border/60 rounded px-1.5 py-0.5 text-muted-foreground shrink-0 uppercase"
                    style={{ minWidth: 34, textAlign: "center" }}
                  >
                    {t.language}
                  </span>
                  <div
                    className={`text-[15px] flex-1 leading-snug ${t.language === "ja" ? "font-jp" : ""}`}
                  >
                    {t.term}
                    {t.explanation && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t.explanation})
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* SM-2 hint */}
              {card.sm2_repetition > 0 && (
                <div className="text-[11px] text-muted-foreground pt-2">
                  Reviewed {card.sm2_repetition}× · interval{" "}
                  {card.sm2_interval}d
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grade buttons (after flip in SM-2 mode) or tap hint */}
      {sm2Mode && flipped ? (
        <div className="grid grid-cols-4 gap-2 w-full max-w-[640px]">
          {GRADES.map((g) => (
            <button
              key={g.quality}
              onClick={(e) => { e.stopPropagation(); handleGrade(g.quality); }}
              disabled={grading !== null}
              className="rounded-lg p-3 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{
                background: g.bg,
                border: `1px solid ${g.border}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: g.color }}
                >
                  {g.label}
                </span>
                <span
                  className="kbd"
                  style={{
                    borderColor: g.border,
                    color: g.color,
                    background: "transparent",
                  }}
                >
                  {g.kbd}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                next in {g.sub}
              </div>
            </button>
          ))}
        </div>
      ) : !flipped ? (
        /* Show answer hint */
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Try to recall the answer, then</span>
          <button
            className="inline-flex items-center gap-1.5 border border-border/60 rounded-md px-3 py-1.5 text-[11px] hover:bg-accent transition-colors"
            onClick={() => setFlipped(true)}
          >
            Show answer{" "}
            <span className="kbd">Space</span>
          </button>
        </div>
      ) : (
        /* Normal prev/next */
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-1 border border-border/60 rounded-md px-3 py-1.5 text-xs hover:bg-accent transition-colors disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            onClick={next}
            disabled={index >= order.length - 1}
            className="inline-flex items-center gap-1 border border-border/60 rounded-md px-3 py-1.5 text-xs hover:bg-accent transition-colors disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      <div className="text-center text-[10px] text-muted-foreground">
        Powered by SM-2 spaced repetition · adjusts intervals based on your recall
      </div>
    </div>
  );
}
