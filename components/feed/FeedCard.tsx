"use client";

import Link from "next/link";
import { Blocks, Eye, FileText, FolderGit2, Heart, MessageSquare, ThumbsUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageBadge } from "@/components/common/LanguageBadge";
import { Stat } from "@/components/common/Stat";
import { TagList } from "@/components/common/Tag";
import { UserChip } from "@/components/common/UserChip";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils/relativeTime";

export type FeedKind = "article" | "project" | "discussion" | "term";

export interface FeedItem {
  kind: FeedKind;
  id: string;
  href: string;
  title: string;
  excerpt?: string | null;
  createdAt: string;
  author?: { name: string; avatarUrl?: string | null } | null;
  imageUrl?: string | null;
  tags?: string[];
  meta?: string | null;
  stats?: { views?: number; likes?: number; comments?: number; votes?: number };
}

const KIND = {
  article: { icon: FileText, label: "home.kind.article", tone: "brand" },
  project: { icon: FolderGit2, label: "home.kind.project", tone: "sky" },
  discussion: { icon: MessageSquare, label: "home.kind.discussion", tone: "danger" },
  term: { icon: Blocks, label: "home.kind.term", tone: "neutral" },
} as const;

/** Strip markdown so excerpts read as plain text. */
function plain(text?: string | null) {
  return (text || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~$]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function FeedCard({ item }: { item: FeedItem }) {
  const { t, i18n } = useTranslation();
  const kind = KIND[item.kind];
  const excerpt = plain(item.excerpt);

  return (
    <article className="group relative rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm sm:p-5">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Badge variant={kind.tone}>
              <kind.icon />
              {t(kind.label)}
            </Badge>
            {item.author && <UserChip name={item.author.name} avatarUrl={item.author.avatarUrl} />}
            {item.meta && <LanguageBadge code={item.meta.toLowerCase()} />}
            <span aria-hidden>·</span>
            <time dateTime={item.createdAt}>{relativeTime(item.createdAt, i18n.language)}</time>
          </div>

          <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-[1.05rem]">
            <Link href={item.href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
              {item.title}
            </Link>
          </h3>
          {excerpt && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>}

          {(item.tags?.length || item.stats) && (
            <div className="mt-3 flex items-center gap-3">
              <TagList tags={item.tags} max={3} className="min-w-0 flex-1" />
              {item.stats && (
                <span className="ml-auto flex shrink-0 items-center gap-3">
                  {item.stats.views != null && <Stat icon={Eye} value={item.stats.views} />}
                  {item.stats.likes != null && <Stat icon={Heart} value={item.stats.likes} />}
                  {item.stats.votes != null && <Stat icon={ThumbsUp} value={item.stats.votes} />}
                  {item.stats.comments != null && <Stat icon={MessageSquare} value={item.stats.comments} />}
                </span>
              )}
            </div>
          )}
        </div>

        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="aspect-square w-20 shrink-0 self-start rounded-lg border object-cover sm:aspect-[4/3] sm:w-32 md:w-40"
          />
        )}
      </div>
    </article>
  );
}
