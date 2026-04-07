"use client";

import BackToTopButton from "@/app/project/components/BackToTopButton";
import FloatingActionBar from "@/app/project/components/FloatingActionBar";
import ProjectComments from "@/app/project/components/ProjectComments";
import ProjectLogTimeline from "@/app/project/components/ProjectLogTimeline";
import type {
  ProjectComment,
  ProjectDifficulty,
  ProjectPayload,
} from "@/app/project/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Heart,
  Layers,
  MessageSquare,
  Pencil,
  Share2,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

function getSeedImage(seed: string, index: number) {
  return `https://picsum.photos/seed/future-hub-${encodeURIComponent(seed)}-${index}/1600/900`;
}

function isImageUrl(url: string, fileType?: string | null) {
  if (fileType && fileType.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

function buildPlaceholderProject(slug: string): ProjectPayload {
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 5);
  const inFourDays = new Date(now);
  inFourDays.setDate(now.getDate() + 4);
  const inSevenDays = new Date(now);
  inSevenDays.setDate(now.getDate() + 7);

  return {
    id: 999001,
    title: "FutureHub Testing Project",
    slug,
    description:
      "Placeholder introduction content for QA/testing. This sample simulates real project data, updates, milestones, files, and discussion state.",
    category: "Web Platform",
    project_type: "coding",
    difficulty: "intermediate",
    status: "in_progress",
    is_public: true,
    repository_url: "https://github.com/example/future-hub-testing-project",
    demo_url: "https://example.com/future-hub-testing-project",
    thumbnail_url: getSeedImage(slug, 0),
    progress: 62,
    technologies: ["Next.js", "TypeScript", "Supabase", "Tailwind"],
    created_by: "test-user-owner",
    created_at: fiveDaysAgo.toISOString(),
    updated_at: now.toISOString(),
    published_at: fiveDaysAgo.toISOString(),
    views: 284,
    likes_count: 17,
    tags: ["test", "placeholder", "intro-page", "ui-qa"],
    author: {
      id: "test-user-owner",
      user_name: "futurehub_owner",
      display_name: "FutureHub Owner",
      avatar_url: getSeedImage(slug, 9),
    },
    members: [
      {
        user_id: "test-user-owner",
        role: "owner",
        joined_at: fiveDaysAgo.toISOString(),
        profile: {
          id: "test-user-owner",
          user_name: "futurehub_owner",
          display_name: "FutureHub Owner",
          avatar_url: getSeedImage(slug, 9),
        },
      },
      {
        user_id: "test-user-contributor",
        role: "contributor",
        joined_at: twoDaysAgo.toISOString(),
        profile: {
          id: "test-user-contributor",
          user_name: "tester_contributor",
          display_name: "QA Contributor",
          avatar_url: getSeedImage(slug, 10),
        },
      },
    ],
    milestones: [
      {
        id: 1,
        project_id: 999001,
        title: "Implement intro/dev route split",
        description: "Project introduction and workspace routes separated.",
        due_date: inFourDays.toISOString().slice(0, 10),
        completed: true,
        completed_at: twoDaysAgo.toISOString(),
        kanban_status: "done",
        sort_order: 0,
        created_at: fiveDaysAgo.toISOString(),
      },
      {
        id: 2,
        project_id: 999001,
        title: "Add uploads and config pages",
        description: "Editor config + uploads test flows are being validated.",
        due_date: inSevenDays.toISOString().slice(0, 10),
        completed: false,
        completed_at: null,
        kanban_status: "in_progress",
        sort_order: 1,
        created_at: twoDaysAgo.toISOString(),
      },
    ],
    comments: [
      {
        id: 1001,
        project_id: 999001,
        user_id: "test-user-contributor",
        parent_id: null,
        body: "This is placeholder discussion data for UI testing.",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        author: {
          id: "test-user-contributor",
          user_name: "tester_contributor",
          display_name: "QA Contributor",
          avatar_url: getSeedImage(slug, 10),
        },
        replies: [],
      },
    ],
    files: [
      {
        id: 2001,
        project_id: 999001,
        uploaded_by: "test-user-owner",
        file_name: "Project Deck.pdf",
        file_url: "https://example.com/files/project-deck.pdf",
        file_type: "application/pdf",
        file_size: 823411,
        created_at: now.toISOString(),
      },
      {
        id: 2002,
        project_id: 999001,
        uploaded_by: "test-user-owner",
        file_name: "Architecture Mockup.png",
        file_url: getSeedImage(slug, 11),
        file_type: "image/png",
        file_size: 452311,
        created_at: now.toISOString(),
      },
    ],
    updates: [
      {
        id: 3001,
        project_id: 999001,
        created_by: "test-user-owner",
        title: "Testing update feed with modal content",
        body: "This is a placeholder update body used to verify project update rendering and modal behavior on the intro page.",
        update_type: "regular",
        image_url: getSeedImage(slug, 1),
        published_at: twoDaysAgo.toISOString(),
        created_at: twoDaysAgo.toISOString(),
        updated_at: twoDaysAgo.toISOString(),
        author: {
          id: "test-user-owner",
          user_name: "futurehub_owner",
          display_name: "FutureHub Owner",
          avatar_url: getSeedImage(slug, 9),
        },
      },
      {
        id: 3002,
        project_id: 999001,
        created_by: "test-user-contributor",
        title: "Added config and uploads test pages",
        body: "Second placeholder update for test data coverage and multiple timeline entries.",
        update_type: "milestone",
        image_url: getSeedImage(slug, 2),
        published_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        author: {
          id: "test-user-contributor",
          user_name: "tester_contributor",
          display_name: "QA Contributor",
          avatar_url: getSeedImage(slug, 10),
        },
      },
    ],
    sections: [],
    userLiked: false,
    isOwner: true,
    isMember: true,
  };
}

function buildGalleryImages(project: ProjectPayload) {
  const seedBase = project.slug || "placeholder";
  const collected = [
    project.thumbnail_url,
    ...(project.updates || []).map((update) => update.image_url),
    ...(project.files || [])
      .filter((file) => isImageUrl(file.file_url, file.file_type))
      .map((file) => file.file_url),
  ].filter((url): url is string => Boolean(url));

  const deduped = Array.from(new Set(collected));

  while (deduped.length < 4) {
    deduped.push(getSeedImage(seedBase, deduped.length + 3));
  }

  return deduped.slice(0, 4);
}

function PageSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
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

  useEffect(() => {
    if (!slug) return;
    (async () => {
      if (demoMode) {
        const demoProject = buildPlaceholderProject(slug);
        setProject(demoProject);
        setLiked(false);
        setLikesCount(demoProject.likes_count || 0);
        setIsOwner(true);
        setIsMember(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) {
          throw new Error("Project request failed");
        }
        const data = await res.json();
        setProject(data);
        setLiked(data.userLiked || false);
        setLikesCount(data.likes_count || 0);
        setIsOwner(data.isOwner || false);
        setIsMember(data.isMember || false);
      } catch {
        const fallbackProject = buildPlaceholderProject(slug);
        setProject(fallbackProject);
        setLiked(false);
        setLikesCount(fallbackProject.likes_count || 0);
        setIsOwner(true);
        setIsMember(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, demoMode]);

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

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).catch(() => undefined);
  }, []);

  const handleBookmark = useCallback(() => {
    setBookmarked((prev) => !prev);
  }, []);

  const scrollToComments = useCallback(() => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

  const commentsCount = (project.comments || []).length;
  const milestonesCount = (project.milestones || []).length;
  const doneCount = (project.milestones || []).filter(
    (m) => m.completed,
  ).length;
  const filesCount = (project.files || []).length;
  const canOpenWorkspace = isOwner || isMember;
  const heroImage = project.thumbnail_url || getSeedImage(project.slug, 0);
  const galleryImages = buildGalleryImages(project);

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_90%_2%,hsl(var(--primary)/0.08),transparent_42%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_100%)]" />

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

                {canOpenWorkspace && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-border hover:bg-muted"
                    onClick={() => router.push(`/project/dev/${slug}`)}
                    aria-label={t("project.workspace") || "Open Workspace"}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
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
            <h1 className="text-3xl md:text-4xl lg:text-[46px] leading-[1.05] font-black uppercase tracking-tight text-foreground">
              {project.title}
            </h1>
          </div>

          <div className="space-y-3">
            <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border border-border bg-card group shadow-[0_22px_40px_rgba(0,0,0,0.2)]">
              <img
                src={heroImage}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
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
              {galleryImages.map((imageUrl, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-md border border-border bg-card/90 overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={`${project.title} preview ${i + 1}`}
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
              ))}
            </div>
          </div>

          <Card className="border-border/80 bg-card/90 text-card-foreground p-5 sm:p-6 space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {t("project.about") || "About The Project"}
            </h2>
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
            {canOpenWorkspace && (
              <div className="pt-1">
                <Button
                  variant="outline"
                  className="border-border bg-muted/30 hover:bg-accent"
                  onClick={() => router.push(`/project/dev/${slug}`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("project.workspace") || "Open Workspace"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="border-border/80 bg-card/85 p-4 sm:p-5">
            <h3 className="text-base font-semibold mb-4">
              {t("project.projectLog") || "Project Updates"}
            </h3>
            <ProjectLogTimeline
              milestones={project.milestones || []}
              members={project.members || []}
              createdAt={project.created_at}
              projectTitle={project.title}
              heroImageUrl={heroImage}
              updates={project.updates || []}
            />
          </Card>

          {filesCount > 0 && (
            <Card className="border-border/80 bg-card/90 p-4 sm:p-5">
              <h3 className="text-base font-semibold mb-4">
                {t("project.files") || "Files"}
              </h3>
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
                    <span className="truncate flex-1">{file.file_name}</span>
                    {file.file_size && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(file.file_size / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </Card>
          )}

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
              <img
                src={heroImage}
                alt={project.title}
                className="w-full aspect-video object-cover"
              />
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

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={`text-xs ${difficultyColors[project.difficulty]}`}
              >
                {difficultyLabel[project.difficulty]}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-primary/35 text-primary bg-primary/5 uppercase"
              >
                {project.project_type}
              </Badge>
              {project.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[11px] px-2 py-0.5"
                >
                  #{tag}
                </Badge>
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
        </aside>
      </div>

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
