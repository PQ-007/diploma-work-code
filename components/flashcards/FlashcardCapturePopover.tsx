"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import FlashcardFormDialog from "./FlashcardFormDialog";
import type { Flashcard } from "@/lib/flashcards/types";

interface FlashcardCapturePopoverProps {
  /** The DOM container whose text selections should trigger the popover. */
  containerRef: React.RefObject<HTMLElement | null>;
  sourceType: string;
  sourceId?: number;
  /** Called after a flashcard has been saved. */
  onCaptured?: (card: Flashcard) => void;
}

export default function FlashcardCapturePopover({
  containerRef,
  sourceType,
  sourceId,
  onCaptured,
}: FlashcardCapturePopoverProps) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [selectedText, setSelectedText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Small timeout so the selection is finalized (esp. on mobile)
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setAnchor(null);
          return;
        }
        const text = sel.toString().trim();
        if (!text || text.length < 1 || text.length > 500) {
          setAnchor(null);
          return;
        }
        const range = sel.getRangeAt(0);
        // Only fire if selection is inside the container
        if (!container.contains(range.commonAncestorContainer)) {
          setAnchor(null);
          return;
        }
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setAnchor({
          top: rect.top + window.scrollY - 44,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }, 10);
    };

    const handleDocMouseDown = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setAnchor(null);
    };

    container.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleDocMouseDown);
    };
  }, [containerRef]);

  if (!anchor && !dialogOpen) return null;

  return (
    <>
      {anchor && !dialogOpen && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: anchor.top,
            left: anchor.left,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
          className="flex items-center gap-1 rounded-md border border-border/80 bg-popover shadow-lg px-1 py-1"
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create flashcard
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setAnchor(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <FlashcardFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setAnchor(null);
        }}
        defaultFront={selectedText}
        sourceType={sourceType}
        sourceId={sourceId}
        onSaved={(card) => onCaptured?.(card)}
      />
    </>
  );
}
