"use client";

import Link from "next/link";
import { Bookmark, Clock, Eye, Heart, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { Stat } from "@/components/common/Stat";
import { TagList } from "@/components/common/Tag";
import { UserChip } from "@/components/common/UserChip";
import { Button } from "@/components/ui/button";
import type { ArticleContent, ContentItem } from "@/lib/types/content";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils/relativeTime";

/** Article list item: who/when → title + subtitle → tags + stats. */
export function ArticleCard({
  item,
  onBookmark,
  busy,
}: {
  item: ContentItem<ArticleContent>;
  onBookmark?: () => void;
  busy?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { content: a, stats, interactions } = item;

  return (
    <article className="group relative rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm sm:p-5">
      <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <UserChip name={a.author.displayName} avatarUrl={a.author.avatarUrl} username={a.author.username} />
        <span aria-hidden>·</span>
        <time dateTime={a.createdAt}>{relativeTime(a.publishedAt || a.createdAt, i18n.language)}</time>
        {a.readTime && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {a.readTime}
          </span>
        )}
        {a.languageCode && <LanguageBadge code={a.languageCode} className="ml-auto" />}
      </div>

      <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground">
        <Link href={`/article/${a.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
          {a.title}
        </Link>
      </h3>
      {(a.subtitle || a.description) && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.subtitle || a.description}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <TagList tags={a.tags} max={3} className="min-w-0 flex-1" />
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Stat icon={Eye} value={stats.views} label={t("common.views")} />
          <Stat icon={Heart} value={stats.likes} />
          <Stat icon={MessageSquare} value={stats.comments} />
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBookmark}
              disabled={busy}
              aria-pressed={interactions.isBookmarked}
              aria-label="Bookmark"
              className={cn("relative z-10 -mr-1.5", interactions.isBookmarked ? "text-primary" : "text-muted-foreground")}
            >
              <Bookmark fill={interactions.isBookmarked ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
