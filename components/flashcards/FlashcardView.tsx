"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Shuffle, RotateCw } from "lucide-react";
import type { Flashcard } from "@/lib/flashcards/types";

interface FlashcardViewProps {
  cards: Flashcard[];
  onClose?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardView({ cards, onClose }: FlashcardViewProps) {
  const [order, setOrder] = useState<Flashcard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setOrder(cards);
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const card = order[index];

  const next = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, order.length - 1));
  }, [order.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose]);

  if (!card) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No cards to study.
      </div>
    );
  }

  const progress = ((index + 1) / order.length) * 100;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="w-full max-w-2xl space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Card {index + 1} of {order.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setOrder(shuffle(order));
                setIndex(0);
                setFlipped(false);
              }}
              title="Shuffle"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setOrder(cards);
                setIndex(0);
                setFlipped(false);
              }}
              title="Reset order"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full max-w-2xl aspect-[3/2] rounded-xl border border-border/60 bg-card/80 hover:bg-card transition-colors flex items-center justify-center p-10 text-center cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <div className="w-full">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            {flipped ? "Back" : "Front"}
          </div>
          <div className="text-xl sm:text-2xl font-medium whitespace-pre-wrap leading-relaxed">
            {flipped ? card.back : card.front}
          </div>
          {!flipped && (
            <div className="text-xs text-muted-foreground mt-6">
              Click or press Space to flip
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={prev}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          size="sm"
          onClick={next}
          disabled={index >= order.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
