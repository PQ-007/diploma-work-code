import { ContentCard } from "@/components/content/ContentCard";
import {
  ContentItem,
  ArticleContent,
  ProjectContent,
} from "@/lib/types/content";
import { FileText, FolderGit2, Pin, Eye, ThumbsUp, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PinnedContentCardProps {
  item: ContentItem<ArticleContent | ProjectContent>;
}

/**
 * Special variant of ContentCard for pinned items in profile page.
 * Uses a compact card layout with a pinned ribbon.
 */
export function PinnedContentCard({ item }: PinnedContentCardProps) {
  const { content, stats } = item;

  // Build navigation link
  const href =
    content.type === "article"
      ? `/article/${content.id}`
      : `/project/${(content as ProjectContent).slug}`;

  // Icon and color based on content type
  const isArticle = content.type === "article";
  const IconComponent = isArticle ? FileText : FolderGit2;
  const iconColor = isArticle ? "text-primary" : "text-violet-500";
  const iconBg = isArticle ? "bg-primary/10" : "bg-violet-500/10";

  return (
    <Link href={href}>
      <div className="relative overflow-hidden group flex flex-col justify-between h-full rounded-lg border border-border/70 bg-card hover:border-border transition-colors p-4 gap-3 min-h-[110px]">
        {/* Pinned ribbon */}
        <div className="absolute top-0 right-0 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-bl-lg">
          <Pin className="h-2.5 w-2.5 -rotate-45" />
          Pinned
        </div>

        {/* Header */}
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 shrink-0 h-8 w-8 rounded-md ${iconBg} flex items-center justify-center`}
          >
            <IconComponent className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
              {content.title}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {content.description ||
                (isArticle
                  ? "Article"
                  : (content as ProjectContent).projectStatus)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {isArticle
              ? content.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                    {tag}
                  </span>
                ))
              : (content as ProjectContent).technologies
                  .slice(0, 2)
                  .map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          (content as ProjectContent).difficulty === "beginner"
                            ? "bg-emerald-400"
                            : (content as ProjectContent).difficulty ===
                                "intermediate"
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                      />
                      {tech}
                    </span>
                  ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {stats.views.toLocaleString()}
            </span>
            {!isArticle && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {stats.likes}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

interface CompactContentCardProps {
  item: ContentItem<ArticleContent | ProjectContent>;
}

/**
 * Compact variant of ContentCard for articles/projects tabs in profile.
 * Uses a list-style layout similar to the current inline implementations.
 */
export function CompactContentCard({ item }: CompactContentCardProps) {
  const { content, stats } = item;

  // Build navigation link
  const href =
    content.type === "article"
      ? `/article/${content.id}`
      : `/project/${(content as ProjectContent).slug}`;

  const isArticle = content.type === "article";
  const IconComponent = isArticle ? FileText : FolderGit2;

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <Link href={href}>
      <div className="group rounded-lg border border-border/60 bg-card hover:border-border transition-colors p-4 mt-3 space-y-2.5">
        {/* Type + title + menu */}
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <IconComponent className="h-3 w-3" />
              {isArticle ? "Article" : "Project"}
            </span>
            <span className="text-muted-foreground/40 text-xs shrink-0">·</span>
            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {content.title}
            </h3>
          </div>
        </div>

        {/* Tags/Technologies and Status badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isArticle ? (
            // Article tags
            content.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-2 py-0 rounded-md font-normal"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <>
              {/* Project status badge */}
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0 capitalize ${
                  (content as ProjectContent).projectStatus === "completed"
                    ? "border-emerald-500 text-emerald-600"
                    : (content as ProjectContent).projectStatus ===
                        "in_progress"
                      ? "border-blue-500 text-blue-600"
                      : (content as ProjectContent).projectStatus === "archived"
                        ? "border-muted-foreground text-muted-foreground"
                        : ""
                }`}
              >
                {(content as ProjectContent).projectStatus.replace("_", " ")}
              </Badge>

              {/* Difficulty badge */}
              <Badge
                variant="secondary"
                className={`text-[10px] px-2 py-0 capitalize ${
                  (content as ProjectContent).difficulty === "beginner"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : (content as ProjectContent).difficulty === "intermediate"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {(content as ProjectContent).difficulty}
              </Badge>

              {/* Technologies */}
              {(content as ProjectContent).technologies
                .slice(0, 4)
                .map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="text-[10px] px-2 py-0"
                  >
                    {tech}
                  </Badge>
                ))}
            </>
          )}
        </div>

        {/* Description for projects */}
        {!isArticle && content.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {content.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {stats.views}
          </span>
          <span className="flex items-center gap-1">
            {isArticle ? (
              <Heart className="h-3 w-3" />
            ) : (
              <ThumbsUp className="h-3 w-3" />
            )}
            {stats.likes}
          </span>
          <span>{formatRelativeTime(content.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
