"use client";

import Link from "next/link";
import { Eye, FileText, FolderGit2, Heart, Pin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Stat } from "@/components/common/Stat";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TagList } from "@/components/common/Tag";
import { Badge } from "@/components/ui/badge";
import type { ArticleContent, ContentItem, ProjectContent } from "@/lib/types/content";
import { relativeTime } from "@/lib/utils/relativeTime";

type Item = ContentItem<ArticleContent | ProjectContent>;

const hrefOf = (c: ArticleContent | ProjectContent) =>
  c.type === "article" ? `/article/${c.id}` : `/project/${(c as ProjectContent).slug}`;

function KindBadge({ isArticle }: { isArticle: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={isArticle ? "brand" : "sky"}>
      {isArticle ? <FileText /> : <FolderGit2 />}
      {t(isArticle ? "home.kind.article" : "home.kind.project")}
    </Badge>
  );
}

/** Pinned item on a profile: compact card with a pin marker. */
export function PinnedContentCard({ item }: { item: Item }) {
  const { content, stats } = item;
  const isArticle = content.type === "article";
  return (
    <article className="group relative flex h-full flex-col gap-2 rounded-xl border border-primary/25 bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <KindBadge isArticle={isArticle} />
        <Pin className="size-3.5 -rotate-45 text-primary" aria-label="Pinned" />
      </div>
      <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">
        <Link href={hrefOf(content)} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
          {content.title}
        </Link>
      </h3>
      {content.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{content.description}</p>}
      <div className="mt-auto flex items-center justify-end gap-3 pt-1">
        <Stat icon={Eye} value={stats.views} />
        <Stat icon={Heart} value={stats.likes} />
      </div>
    </article>
  );
}

/** List row for a profile's articles / projects tabs. */
export function CompactContentCard({ item }: { item: Item }) {
  const { i18n } = useTranslation();
  const { content, stats } = item;
  const isArticle = content.type === "article";
  const project = content as ProjectContent;

  return (
    <article className="group relative rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <KindBadge isArticle={isArticle} />
        {!isArticle && (
          <>
            <StatusBadge kind="project" value={project.projectStatus} />
            <StatusBadge kind="difficulty" value={project.difficulty} />
          </>
        )}
      </div>
      <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">
        <Link href={hrefOf(content)} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:underline">
          {content.title}
        </Link>
      </h3>
      {content.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{content.description}</p>}
      <div className="mt-3 flex items-center gap-3">
        <TagList tags={isArticle ? content.tags : project.technologies} max={3} className="min-w-0 flex-1" />
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <Stat icon={Eye} value={stats.views} />
          <Stat icon={Heart} value={stats.likes} />
          <time className="text-xs text-muted-foreground" dateTime={content.createdAt}>
            {relativeTime(content.createdAt, i18n.language)}
          </time>
        </span>
      </div>
    </article>
  );
}
