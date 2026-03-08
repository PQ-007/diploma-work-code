"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Eye,
  Calendar,
  ExternalLink,
  Github,
  Globe,
  Pencil,
  Share2,
  Trash2,
  ChevronRight,
  Users,
  Target,
  ScrollText,
  FileText,
  BookOpen,
  Layers,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionEditor from "@/app/project/components/SectionEditor";
import KanbanBoard from "@/app/project/components/KanbanBoard";
import TeamManager from "@/app/project/components/TeamManager";
import ProjectComments from "@/app/project/components/ProjectComments";
import type {
  ProjectPayload,
  ProjectSection,
  ProjectMilestone,
  ProjectMember,
  ProjectComment,
  ProjectDifficulty,
} from "@/app/project/types";

const difficultyColors: Record<ProjectDifficulty, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-500 border-red-500/20",
};

const difficultyLabel: Record<ProjectDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) {
          router.push("/project");
          return;
        }
        const data = await res.json();
        setProject(data);
        setLiked(data.userLiked || false);
        setLikesCount(data.likes_count || 0);
        setIsOwner(data.isOwner || false);
        setIsMember(data.isMember || false);
      } catch {
        router.push("/project");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  const handleLike = useCallback(async () => {
    if (!user || !project) return;
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      await fetch(`/api/projects/${slug}/like`, { method: "POST" });
    } catch {
      setLiked((prev) => !prev);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
    }
  }, [user, project, slug, liked]);

  const handleDelete = useCallback(async () => {
    if (
      !confirm(
        t("project.confirmDelete") ||
          "Are you sure you want to delete this project?",
      )
    )
      return;
    const res = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
    if (res.ok) router.push("/project");
  }, [slug, router, t]);

  const handleSectionsChange = useCallback(
    (sections: ProjectSection[]) => {
      if (project) setProject({ ...project, sections });
    },
    [project],
  );

  const handleMilestonesChange = useCallback(
    (milestones: ProjectMilestone[]) => {
      if (project) {
        const completed = milestones.filter((m) => m.completed).length;
        const progress =
          milestones.length === 0
            ? 0
            : Math.round((completed / milestones.length) * 100);
        setProject({ ...project, milestones, progress });
      }
    },
    [project],
  );

  const handleMembersChange = useCallback(
    (members: ProjectMember[]) => {
      if (project) setProject({ ...project, members });
    },
    [project],
  );

  const handleCommentAdded = useCallback(
    (comment: ProjectComment) => {
      if (!project) return;
      if (comment.parent_id) {
        const addReply = (comments: ProjectComment[]): ProjectComment[] =>
          comments.map((c) =>
            c.id === comment.parent_id
              ? { ...c, replies: [...(c.replies || []), comment] }
              : { ...c, replies: addReply(c.replies || []) },
          );
        setProject({ ...project, comments: addReply(project.comments || []) });
      } else {
        setProject({
          ...project,
          comments: [...(project.comments || []), comment],
        });
      }
    },
    [project],
  );

  const handleCommentDeleted = useCallback(
    (id: number) => {
      if (!project) return;
      const removeComment = (comments: ProjectComment[]): ProjectComment[] =>
        comments
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, replies: removeComment(c.replies || []) }));
      setProject({
        ...project,
        comments: removeComment(project.comments || []),
      });
    },
    [project],
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-8 w-2/3 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="aspect-video bg-muted rounded-lg" />
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-4/5" />
            <div className="h-4 bg-muted rounded w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const canEdit = isOwner || isMember;
  const commentsCount = (project.comments || []).length;
  const milestonesCount = (project.milestones || []).length;
  const membersCount = (project.members || []).length;
  const filesCount = (project.files || []).length;

  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      {/* Title bar */}
      <div className=" border-border bg-background px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold truncate">{project.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/project/create?edit=${slug}`)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  {t("common.edit") || "Edit"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              {t("common.share") || "Share"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 space-y-8">
        {/* Steam-style header: cover + info panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Cover image */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
            {project.thumbnail_url ? (
              <img
                src={project.thumbnail_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/5 via-primary/10 to-muted">
                <Layers className="h-20 w-20 text-primary/20" />
                <span className="text-sm text-muted-foreground font-medium">
                  {project.title}
                </span>
              </div>
            )}
          </div>

          {/* Info sidebar */}
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="font-semibold text-base mb-1">{project.title}</p>
              {project.description && (
                <p className="text-muted-foreground leading-relaxed text-[13px]">
                  {project.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.likes") || "Likes"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto py-0.5 px-2 gap-1 font-normal ${liked ? "text-red-500" : "text-blue-400 hover:text-blue-300"}`}
                  onClick={handleLike}
                  disabled={!user}
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
                  />
                  {likesCount}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.views") || "Views"}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  {project.views}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.progress") || "Progress"}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span>{project.progress}%</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.releaseDate") || "Created"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.developer") || "Author"}
                </span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={project.author?.avatar_url || undefined}
                    />
                    <AvatarFallback className="text-[9px]">
                      {(project.author?.display_name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-blue-400">
                    {project.author?.display_name ||
                      project.author?.user_name ||
                      "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.difficulty") || "Difficulty"}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${difficultyColors[project.difficulty]}`}
                >
                  {difficultyLabel[project.difficulty]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("project.type") || "Type"}
                </span>
                <Badge variant="secondary" className="text-xs capitalize">
                  {project.project_type}
                </Badge>
              </div>
              {project.category && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("project.category") || "Category"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {project.category}
                  </Badge>
                </div>
              )}
            </div>

            {/* Links */}
            {(project.repository_url || project.demo_url) && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  {project.repository_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        {t("project.repository") || "Repository"}
                      </a>
                    </Button>
                  )}
                  {project.demo_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        {t("project.liveDemo") || "Live Demo"}
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Technologies + tags */}
            {(project.technologies.length > 0 || project.tags.length > 0) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  {t("project.popularTags") ||
                    "Popular user-defined tags for this project:"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant="secondary"
                      className="rounded text-xs px-2 py-0.5"
                    >
                      {tech}
                    </Badge>
                  ))}
                  {project.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded text-xs px-2 py-0.5 text-muted-foreground"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none gap-0">
            {(
              [
                {
                  value: "overview",
                  icon: BookOpen,
                  label: t("project.overview") || "Overview",
                  count: 0,
                },
                {
                  value: "milestones",
                  icon: Target,
                  label: t("project.kanban") || "To-Do Board",
                  count: milestonesCount,
                },
                {
                  value: "team",
                  icon: Users,
                  label: t("project.team") || "Team",
                  count: membersCount,
                },
                {
                  value: "project-log",
                  icon: ScrollText,
                  label: t("project.projectLog") || "Project Log",
                  count: 0,
                },
                ...(filesCount > 0
                  ? [
                      {
                        value: "files",
                        icon: FileText,
                        label: t("project.files") || "Files",
                        count: filesCount,
                      },
                    ]
                  : []),
              ] as {
                value: string;
                icon: React.ElementType;
                label: string;
                count: number;
              }[]
            ).map(({ value, icon: Icon, label, count }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-sm font-medium"
              >
                <Icon className="h-4 w-4" />
                {label}
                {count > 0 && (
                  <span className="ml-0.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="pt-6">
            <TabsContent value="overview" className="mt-0">
              <SectionEditor
                slug={slug}
                sections={project.sections || []}
                canEdit={canEdit}
                onSectionsChange={handleSectionsChange}
              />
            </TabsContent>
            <TabsContent value="milestones" className="mt-0">
              <KanbanBoard
                slug={slug}
                milestones={project.milestones || []}
                progress={project.progress}
                canEdit={canEdit}
                onMilestonesChange={handleMilestonesChange}
              />
            </TabsContent>
            <TabsContent value="team" className="mt-0">
              <TeamManager
                slug={slug}
                members={project.members || []}
                isOwner={isOwner}
                onMembersChange={handleMembersChange}
              />
            </TabsContent>
            <TabsContent value="project-log" className="mt-0">
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground text-center">
                  {t("project.noLog") || "No activity logged yet."}
                </div>
              </div>
            </TabsContent>
            {filesCount > 0 && (
              <TabsContent value="files" className="mt-0">
                <div className="space-y-2">
                  {(project.files || []).map((file) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate flex-1">{file.file_name}</span>
                      {file.file_size && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {(file.file_size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Comments section */}
        <Separator />
        <div>
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">
              {t("project.comments") || "Comments"}
              {commentsCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({commentsCount})
                </span>
              )}
            </h2>
          </div>
          <ProjectComments
            slug={slug}
            comments={(project.comments as ProjectComment[]) || []}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
          />
        </div>
      </div>
    </div>
  );
}
