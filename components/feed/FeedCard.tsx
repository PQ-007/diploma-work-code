"use client";

import Link from "next/link";
import { Blocks, Eye, FileText, FolderGit2, Heart, MessageSquare, ThumbsUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
  article: { icon: FileText, label: "home.kind.article", tone: "bg-brand-blue/10 text-brand-blue" },
  project: { icon: FolderGit2, label: "home.kind.project", tone: "bg-brand-sky/15 text-[color:var(--brand-blue)]" },
  discussion: { icon: MessageSquare, label: "home.kind.discussion", tone: "bg-brand-red/10 text-brand-red" },
  term: { icon: Blocks, label: "home.kind.term", tone: "bg-muted text-muted-foreground" },
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
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", kind.tone)}>
              <kind.icon className="size-3" />
              {t(kind.label)}
            </span>
            {item.author && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Avatar className="size-5">
                  {item.author.avatarUrl && <AvatarImage src={item.author.avatarUrl} alt="" />}
                  <AvatarFallback className="text-[10px]">{item.author.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-foreground/80">{item.author.name}</span>
              </span>
            )}
            {item.meta && <span>{item.meta}</span>}
            <span aria-hidden>·</span>
            <time dateTime={item.createdAt}>{relativeTime(item.createdAt, i18n.language)}</time>
          </div>

          <h3 className="text-base font-semibold leading-snug text-foreground sm:text-[1.05rem]">
            <Link href={item.href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
              {item.title}
            </Link>
          </h3>

          {excerpt && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
          )}

          {(item.tags?.length || item.stats) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              {item.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-md bg-secondary px-1.5 py-0.5 text-secondary-foreground">
                  #{tag}
                </span>
              ))}
              {item.stats && (
                <span className="ml-auto inline-flex items-center gap-3">
                  {item.stats.views != null && (
                    <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{item.stats.views}</span>
                  )}
                  {item.stats.likes != null && (
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5" />{item.stats.likes}</span>
                  )}
                  {item.stats.votes != null && (
                    <span className="inline-flex items-center gap-1"><ThumbsUp className="size-3.5" />{item.stats.votes}</span>
                  )}
                  {item.stats.comments != null && (
                    <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" />{item.stats.comments}</span>
                  )}
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
