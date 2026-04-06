"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Bookmark,
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
  const [bookmarked, setBookmarked] = useState(false);
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

  const handleBookmark = useCallback(() => {
    setBookmarked((prev) => !prev);
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
  const tabItems: {
    value: string;
    icon: React.ElementType;
    label: string;
    count: number;
  }[] = [
    {
      value: "overview",
      icon: BookOpen,
      label: t("project.overview") || "Overview",
      count: 0,
    },
    {
      value: "milestones",
      icon: Target,
      label: t("project.kanban") || "Requirements",
      count: milestonesCount,
    },
    {
      value: "team",
      icon: Users,
      label: t("project.team") || "Technical",
      count: membersCount,
    },
    {
      value: "project-log",
      icon: ScrollText,
      label: t("project.projectLog") || "Changelog",
      count: 0,
    },
    ...(filesCount > 0
      ? [
          {
            value: "files",
            icon: FileText,
            label: t("project.files") || "Media",
            count: filesCount,
          },
        ]
      : []),
  ];
  const recentActivity = [...(project.milestones || [])]
    .filter((m) => m.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at || 0).getTime() -
        new Date(a.completed_at || 0).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_90%_2%,hsl(var(--primary)/0.08),transparent_42%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_100%)]" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="relative mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_320px] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="flex">
                <div className="flex flex-col items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full border ${
                    liked
                      ? "text-destructive border-destructive/40 bg-destructive/10"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={handleLike}
                  disabled={!user}
                  aria-label={t("project.likes") || "Like"}
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full border ${
                    bookmarked
                      ? "text-primary border-primary/40 bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                  onClick={handleBookmark}
                  aria-label={t("common.bookmark") || "Bookmark"}
                >
                  <Bookmark
                    className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border hover:bg-muted"
                  onClick={scrollToComments}
                  aria-label={t("project.comments") || "Comments"}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-border hover:bg-muted"
                  onClick={handleShare}
                  aria-label={t("common.share") || "Share"}
                >
                  <Share2 className="h-5 w-5" />
                </Button>

                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-border hover:bg-muted"
                      onClick={() =>
                        router.push(`/project/create?edit=${slug}`)
                      }
                      aria-label={t("common.edit") || "Edit"}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>

                  </>
                )}

                <div className="h-px w-10 bg-border my-1" />
                <div className="text-[11px] text-muted-foreground text-center">
                  <div className="font-semibold text-foreground/80">
                    {likesCount}
                  </div>
                  <div>{t("project.likes") || "Likes"}</div>
                </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-8 min-w-0">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-[46px] leading-[1.05] font-black uppercase tracking-tight text-foreground">
                {project.title}
              </h2>
            </div>

            <div className="space-y-3">
              <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border border-border bg-card group shadow-[0_22px_40px_rgba(0,0,0,0.2)]">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 via-muted to-card">
                    <Layers className="h-20 w-20 text-primary/20" />
                    <span className="text-sm text-muted-foreground font-medium">
                      {project.title}
                    </span>
                  </div>
                )}
                {milestonesCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/50 to-transparent p-4">
                    <div className="flex items-center justify-between text-foreground text-xs mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {doneCount}/{milestonesCount}{" "}
                        {t("project.tasksCompleted") || "tasks done"}
                      </span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-foreground/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-md border border-border bg-card/90 overflow-hidden"
                  >
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={`${project.title} preview ${i + 1}`}
                        className="w-full h-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-wide">
                        Preview {i + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-border/80 bg-card/90 text-card-foreground p-5 sm:p-6 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tight">
                {t("project.about") || "About The Project"}
              </h3>
              <p className="text-sm sm:text-[15px] leading-7 text-muted-foreground">
                {project.description ||
                  "This project details a modular build intended for high-performance development workflows and collaborative iteration."}
              </p>
              {(project.technologies.length > 0 || project.tags.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    ...project.technologies.slice(0, 4),
                    ...project.tags.slice(0, 4),
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-md border border-border/70 bg-muted/40 p-3"
                    >
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        module
                      </p>
                      <p className="text-sm font-semibold mt-1">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {tabItems.map(({ value, icon: Icon, label, count }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={`rounded-md border px-3 py-2 text-sm flex items-center justify-between ${
                    activeTab === value
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {count > 0 && <span className="text-xs">{count}</span>}
                </button>
              ))}
            </div>

            <Card className="border-border/80 bg-card/85 p-4 sm:p-5">
              <TabsContent value="overview" className="mt-0 text-foreground">
                <SectionEditor
                  slug={slug}
                  sections={project.sections || []}
                  canEdit={canEdit}
                  onSectionsChange={handleSectionsChange}
                />
              </TabsContent>
              <TabsContent value="milestones" className="mt-0 text-foreground">
                <KanbanBoard
                  slug={slug}
                  milestones={project.milestones || []}
                  progress={project.progress}
                  canEdit={canEdit}
                  onMilestonesChange={handleMilestonesChange}
                />
              </TabsContent>
              <TabsContent value="team" className="mt-0 text-foreground">
                <TeamManager
                  slug={slug}
                  members={project.members || []}
                  isOwner={isOwner}
                  onMembersChange={handleMembersChange}
                />
              </TabsContent>
              <TabsContent value="project-log" className="mt-0 text-foreground">
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
                        className="flex items-center gap-3 rounded-md border border-border p-3 text-sm text-foreground hover:bg-accent transition-colors"
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
            </Card>

            <Card
              ref={commentsRef}
              className="border-border/80 bg-card/90 p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">
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
            </Card>
          </main>

          <aside className="hidden xl:flex xl:flex-col gap-4 sticky top-[84px] self-start">
            <Card className="border-border/80 bg-card/90 p-4 text-card-foreground">
              <div className="rounded-md overflow-hidden border border-border">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted/60 text-muted-foreground text-xs uppercase tracking-wide">
                    Preview
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                {project.description ||
                  "A high-performance implementation designed for collaborative open-source contributors."}
              </p>
              <div className="space-y-2 mt-4 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("project.releaseDate") || "Release date"}</span>
                  <span className="text-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("project.developer") || "Developer"}</span>
                  <span className="text-foreground truncate max-w-[160px] text-right">
                    {project.author?.display_name ||
                      project.author?.user_name ||
                      "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("project.progress") || "Progress"}</span>
                  <span className="text-foreground">{project.progress}%</span>
                </div>
              </div>

              {(project.tags.length > 0 || project.technologies.length > 0) && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
                    {t("project.popularTags") || "Tags"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[11px] px-2 py-0.5"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {project.tags.length === 0 &&
                      project.technologies.slice(0, 6).map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="text-[11px] px-2 py-0.5"
                        >
                          {tech}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="border-border/80 bg-card/90 p-4 text-card-foreground">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Core Tech Stack
              </p>
              <div className="space-y-2.5">
                {(project.technologies.length > 0
                  ? project.technologies.slice(0, 5)
                  : ["TypeScript", "Supabase", "Next.js"]
                ).map((tech) => (
                  <div
                    key={tech}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="text-sm">{tech}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      core
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-border/80 bg-card/90 p-4 text-card-foreground">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Contributor Spotlight
              </p>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={project.author?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(project.author?.display_name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {project.author?.display_name ||
                      project.author?.user_name ||
                      "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Lead contributor
                  </p>
                </div>
              </div>
              {(project.repository_url || project.demo_url) && (
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {project.repository_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start border-border bg-muted/30 hover:bg-accent text-foreground"
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
                      className="w-full justify-start border-border bg-muted/30 hover:bg-accent text-foreground"
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
              )}
            </Card>

            <Card className="border-border/80 bg-card/90 p-4 text-card-foreground">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                Recent Activity
              </p>
              <div className="space-y-2">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="text-xs border-l border-border pl-2"
                    >
                      <p className="text-foreground truncate">{item.title}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(
                          item.completed_at || item.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No activity updates yet.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </Tabs>

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
