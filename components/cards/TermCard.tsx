"use client";

import Link from "next/link";
import { Bookmark, Eye } from "lucide-react";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { Stat } from "@/components/common/Stat";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TagList } from "@/components/common/Tag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TermCardData {
  id: number;
  slug: string;
  term: string;
  reading: string | null;
  definition: string;
  language_code: string;
  status: string;
  views: number;
  saved: boolean;
  tags: string[];
  translation_languages: string[];
  display_term?: string;
  display_definition?: string;
}

function Languages({ entry }: { entry: TermCardData }) {
  const langs = [entry.language_code, ...(entry.translation_languages || []).filter((l) => l !== entry.language_code)];
  return (
    <span className="flex shrink-0 gap-1">
      {langs.map((l, i) => (
        <LanguageBadge key={l} code={l} active={i === 0} />
      ))}
    </span>
  );
}

function SaveButton({ entry, onToggleSave }: { entry: TermCardData; onToggleSave?: (id: number, saved: boolean) => void }) {
  if (!onToggleSave) return null;
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Save"
      aria-pressed={entry.saved}
      onClick={() => onToggleSave(entry.id, entry.saved)}
      className={cn("relative z-10 -my-1 -mr-1.5", entry.saved ? "text-primary" : "text-muted-foreground")}
    >
      <Bookmark fill={entry.saved ? "currentColor" : "none"} />
    </Button>
  );
}

/** Dictionary entry. `layout="grid"` = card, `layout="row"` = compact list line. */
export function TermCard({
  entry,
  layout = "grid",
  onToggleSave,
}: {
  entry: TermCardData;
  layout?: "grid" | "row";
  onToggleSave?: (id: number, saved: boolean) => void;
}) {
  const term = entry.display_term || entry.term;
  const definition = entry.display_definition || entry.definition;
  const title = (
    <Link href={`/dictionary/${entry.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
      {term}
    </Link>
  );

  if (layout === "row") {
    return (
      <article className="group relative flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="text-[15px] font-semibold">{title}</h3>
            {entry.reading && <span className="text-xs text-muted-foreground">{entry.reading}</span>}
            {entry.status !== "approved" && <StatusBadge kind="term" value={entry.status} />}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{definition}</p>
        </div>
        <Languages entry={entry} />
        <SaveButton entry={entry} onToggleSave={onToggleSave} />
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug tracking-tight">{title}</h3>
          {entry.reading && <p className="text-xs text-muted-foreground">{entry.reading}</p>}
        </div>
        <Languages entry={entry} />
      </div>
      {entry.status !== "approved" && <StatusBadge kind="term" value={entry.status} className="mt-2" />}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{definition}</p>
      <div className="mt-auto flex items-center gap-2 pt-3">
        <TagList tags={entry.tags} max={2} className="min-w-0 flex-1" />
        <Stat icon={Eye} value={entry.views} />
        <SaveButton entry={entry} onToggleSave={onToggleSave} />
      </div>
    </article>
  );
}
