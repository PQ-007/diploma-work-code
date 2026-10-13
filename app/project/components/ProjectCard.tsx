"use client";

import Link from "next/link";
import { Eye, Heart, Layers } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Stat } from "@/components/common/Stat";
import { TagList } from "@/components/common/Tag";
import { UserChip } from "@/components/common/UserChip";
import type { ProjectPayload } from "@/app/project/types";
import { cn } from "@/lib/utils";

/** Gallery card: 16:9 cover → type/status → title → description → tags → author + stats. */
export default function ProjectCard({ project }: { project: ProjectPayload }) {
  const authorName = project.author?.display_name || project.author?.user_name || "—";
  const tags = [...(project.technologies || []), ...(project.tags || [])];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {project.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.thumbnail_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/5 to-brand-sky/20">
            <Layers className="size-9 text-primary/40" />
          </div>
        )}
        {project.progress > 0 && project.progress < 100 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10" aria-label={`${project.progress}%`}>
            <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <StatusBadge kind="projectType" value={project.type} />
          <StatusBadge kind="project" value={project.status} />
          <StatusBadge kind="difficulty" value={project.difficulty} />
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          <Link href={`/project/${project.slug}`} className="outline-none after:absolute after:inset-0 focus-visible:underline">
            {project.title}
          </Link>
        </h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
        )}

        <TagList tags={tags} max={3} className="mt-3" />

        <div className="mt-auto flex items-center gap-3 pt-4">
          <UserChip name={authorName} avatarUrl={project.author?.avatar_url} className="min-w-0 flex-1" />
          <Stat
            icon={Heart}
            value={project.likes_count}
            className={cn(project.userLiked && "text-brand-red [&>svg]:fill-current")}
          />
          <Stat icon={Eye} value={project.views} />
        </div>
      </div>
    </article>
  );
}
