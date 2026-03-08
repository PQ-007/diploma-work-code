"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Eye, Layers } from "lucide-react";
import Link from "next/link";
import type { ProjectPayload, ProjectDifficulty } from "@/app/project/types";
import { useLanguage } from "@/contexts/LanguageContext";

const difficultyColors: Record<ProjectDifficulty, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  archived: "bg-muted text-muted-foreground",
};

export default function ProjectCard({ project }: { project: ProjectPayload }) {
  const { t } = useLanguage();

  return (
    <Link href={`/project/${project.slug}`} className="group">
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/20 h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
              <Layers className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

          {/* Top badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold uppercase bg-background/80 backdrop-blur-sm ${difficultyColors[project.difficulty]}`}
            >
              {t(`project.difficulty.${project.difficulty}`) || project.difficulty}
            </Badge>
            <Badge
              className={`text-[10px] font-semibold uppercase bg-background/80 backdrop-blur-sm ${statusColors[project.status] || ""}`}
              variant="outline"
            >
              {t(`project.status.${project.status}`) || project.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Progress bar */}
          {project.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>

          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Technologies */}
          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.technologies.slice(0, 3).map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="rounded-full px-2 py-0 text-[10px]"
                >
                  {tech}
                </Badge>
              ))}
              {project.technologies.length > 3 && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0 text-[10px]"
                >
                  +{project.technologies.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-full px-2 py-0 text-[10px] text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
            {/* Author */}
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={project.author?.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">
                  {(
                    project.author?.display_name ||
                    project.author?.user_name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                {project.author?.display_name ||
                  project.author?.user_name ||
                  "Unknown"}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart
                  className={`h-3 w-3 ${project.userLiked ? "fill-red-500 text-red-500" : ""}`}
                />
                {project.likes_count}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {project.views}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
