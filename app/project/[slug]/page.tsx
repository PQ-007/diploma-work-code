"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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
  Users,
  Target,
  ScrollText,
  FileText,
  BookOpen,
  Layers,
  MessageSquare,
  ArrowLeft,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionEditor from "@/app/project/components/SectionEditor";
import KanbanBoard from "@/app/project/components/KanbanBoard";
import TeamManager from "@/app/project/components/TeamManager";
import ProjectComments from "@/app/project/components/ProjectComments";
import FloatingActionBar from "@/app/project/components/FloatingActionBar";
import BackToTopButton from "@/app/project/components/BackToTopButton";
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

/* ─── Skeleton ─────────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      <div className="border-b border-border bg-background px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Separator />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
            <Separator />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16 rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4 border-b border-border pb-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Status badge helper ──────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    in_progress: {
      label: "In Progress",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    completed: {
      label: "Completed",
      className: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    archived: {
      label: "Archived",
      className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    },
  };
  const s = map[status] || map.draft;
  return (
    <Badge variant="outline" className={`text-xs ${s.className}`}>
      {s.label}
    </Badge>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const commentsRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [mnScript, setMnScript] = useState<string | null>(null);

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

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    if (!project?.title) return;
    fetch("/api/dictionary/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: project.title }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.result) setMnScript(json.result);
        else setMnScript(null);
      })
      .catch(() => setMnScript(null));
  }, [project?.title]);

  const scrollToComments = useCallback(() => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

  if (loading) return <PageSkeleton />;
  if (!project) return null;

  const canEdit = isOwner || isMember;
  const commentsCount = (project.comments || []).length;
  const milestonesCount = (project.milestones || []).length;
  const membersCount = (project.members || []).length;
  const filesCount = (project.files || []).length;
  const doneCount = (project.milestones || []).filter(
    (m) => m.completed,
  ).length;

  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      {/* Title bar */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={() => router.push("/project")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{project.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status={project.status} />
                {project.is_public && (
                  <Badge variant="secondary" className="text-[10px]">
                    Public
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/project/create?edit=${slug}`)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">
                    {t("common.edit") || "Edit"}
                  </span>
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
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">
                {copied
                  ? t("common.copied") || "Copied!"
                  : t("common.share") || "Share"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6">
        <div className="flex gap-4">
          {/* Mongolian vertical script accent */}
          {mnScript && (
            <div className="hidden xl:flex items-start pt-3 w-7 flex-shrink-0 select-none">
              <span
                className="mn-script text-[13px] font-bold text-violet-400/50 tracking-widest"
                style={{
                  writingMode: "vertical-lr",
                  letterSpacing: "0.18em",
                }}
                title={project.title}
              >
                {mnScript}
              </span>
            </div>
          )}
          <div className="flex-1 space-y-8">
            {/* Steam-style header: cover + info panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              {/* Cover image */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted group">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/5 via-primary/10 to-muted">
                    <Layers className="h-20 w-20 text-primary/20" />
                    <span className="text-sm text-muted-foreground font-medium">
                      {project.title}
                    </span>
                  </div>
                )}
                {/* Overlay badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-sm text-xs capitalize"
                  >
                    {project.project_type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`bg-background/80 backdrop-blur-sm text-xs ${difficultyColors[project.difficulty]}`}
                  >
                    {difficultyLabel[project.difficulty]}
                  </Badge>
                </div>
                {/* Progress overlay */}
                {milestonesCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="flex items-center justify-between text-white text-xs mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {doneCount}/{milestonesCount}{" "}
                        {t("project.tasksCompleted") || "tasks done"}
                      </span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Info sidebar */}
              <Card className="flex flex-col gap-4 text-sm p-5 border-border/60">
                <div>
                  <p className="font-semibold text-base mb-1">
                    {project.title}
                  </p>
                  {project.description && (
                    <p className="text-muted-foreground leading-relaxed text-[13px] line-clamp-4">
                      {project.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Stats */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("project.likes") || "Likes"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-0.5 px-2 gap-1 font-normal ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
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
                      <span className="tabular-nums">{project.progress}%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-2.5">
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
                      <span className="text-blue-400 hover:underline cursor-pointer">
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
                {(project.technologies.length > 0 ||
                  project.tags.length > 0) && (
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
              </Card>
            </div>

            {/* Tab navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none gap-0 overflow-x-auto">
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
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-sm font-medium whitespace-nowrap"
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
                  <ProjectLogTab
                    milestones={project.milestones || []}
                    members={project.members || []}
                    createdAt={project.created_at}
                  />
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
                          <span className="truncate flex-1">
                            {file.file_name}
                          </span>
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
            <div ref={commentsRef}>
              <Separator />
              <div className="pt-6">
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
        </div>
      </div>

      {/* Mobile floating action bar */}
      <FloatingActionBar
        liked={liked}
        likesCount={likesCount}
        onLike={handleLike}
        onCommentClick={scrollToComments}
        onShare={handleShare}
      />

      <BackToTopButton />
    </div>
  );
}

/* ─── Project Log Tab ──────────────────────────────────────────── */
interface ProjectLogTabProps {
  milestones: ProjectMilestone[];
  members: ProjectMember[];
  createdAt: string;
}

function ProjectLogTab({ milestones, members, createdAt }: ProjectLogTabProps) {
  const { t } = useLanguage();

  // Build timeline entries from milestones and project creation
  const entries: {
    date: string;
    icon: React.ElementType;
    color: string;
    title: string;
    description?: string;
  }[] = [];

  // Project created
  entries.push({
    date: createdAt,
    icon: Layers,
    color: "text-primary",
    title: t("project.logCreated") || "Project created",
  });

  // Members joined
  members.forEach((m) => {
    if (m.role !== "owner" && m.joined_at) {
      entries.push({
        date: m.joined_at,
        icon: Users,
        color: "text-blue-500",
        title: `${m.profile?.display_name || m.profile?.user_name || "User"} ${t("project.logJoined") || "joined as"} ${m.role}`,
      });
    }
  });

  // Completed milestones
  milestones
    .filter((m) => m.completed && m.completed_at)
    .forEach((m) => {
      entries.push({
        date: m.completed_at!,
        icon: CheckCircle2,
        color: "text-green-500",
        title: `${t("project.logCompleted") || "Completed:"} ${m.title}`,
      });
    });

  // Sort by date descending
  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-8 text-sm text-muted-foreground text-center">
        <ScrollText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p>{t("project.noLog") || "No activity logged yet."}</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

      {entries.map((entry, i) => {
        const Icon = entry.icon;
        return (
          <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background ${entry.color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium">{entry.title}</p>
              {entry.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(entry.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
