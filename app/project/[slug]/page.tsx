"use client";

import BackToTopButton from "@/app/project/components/BackToTopButton";
import FloatingActionBar from "@/app/project/components/FloatingActionBar";
import ProjectComments from "@/app/project/components/ProjectComments";
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
  ExternalLink,
  Github,
  Globe,
  Heart,
  MessageSquare,
  Pencil,
  Play,
  Share2,
  Users,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

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

const TYPE_LABELS: Record<string, string> = {
  private: "Private",
  diploma: "Diploma",
  contest: "Contest",
  intership: "Internship",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getSeedImage(seed: string, index: number) {
  return `https://picsum.photos/seed/future-hub-${encodeURIComponent(seed)}-${index}/1600/900`;
}

function isImageUrl(url: string, fileType?: string | null) {
  if (fileType && fileType.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);
}

function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */
/*  Placeholder project (demo / fallback)                              */
/* ------------------------------------------------------------------ */

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
      "Placeholder showcase content for QA/testing. This sample simulates project summary, team, files, links, and discussion state.",
    category: "web_dev",
    type: "private",
    difficulty: "intermediate",
    status: "in_progress",
    is_public: true,
    repository_url: "https://github.com/example/future-hub-testing-project",
    demo_url: "https://example.com/future-hub-testing-project",
    video_url: null,
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
      {
        id: 2003,
        project_id: 999001,
        uploaded_by: "test-user-owner",
        file_name: "UI Wireframe.png",
        file_url: getSeedImage(slug, 12),
        file_type: "image/png",
        file_size: 301200,
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
    ],
    sections: [],
    userLiked: false,
    isOwner: true,
    isMember: true,
  };
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                            */
/* ------------------------------------------------------------------ */

function PageSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_320px] gap-6">
        <div className="hidden lg:block" />
        <div className="space-y-5">
          <Skeleton className="h-12 w-3/4 rounded" />
          <Skeleton className="aspect-video rounded-md" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="w-32 aspect-video rounded-sm flex-shrink-0"
              />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="hidden xl:block space-y-4">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

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

  /* ─── media viewer ─── */
  const [selectedMediaId, setSelectedMediaId] = useState<string>("thumbnail");

  useEffect(() => {
    if (!slug) return;
    (async () => {
      if (demoMode) {
        const demo = buildPlaceholderProject(slug);
        setProject(demo);
        setLiked(false);
        setLikesCount(demo.likes_count || 0);
        setIsOwner(true);
        setIsMember(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        setProject(data);
        setLiked(data.userLiked || false);
        setLikesCount(data.likes_count || 0);
        setIsOwner(data.isOwner || false);
        setIsMember(data.isMember || false);
      } catch {
        const fallback = buildPlaceholderProject(slug);
        setProject(fallback);
        setLiked(false);
        setLikesCount(fallback.likes_count || 0);
        setIsOwner(true);
        setIsMember(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, demoMode]);

  /* ─── default selected media after load ─── */
  useEffect(() => {
    if (!project) return;
    const ytId = getYouTubeId(project.video_url);
    if (ytId) setSelectedMediaId("youtube");
    else if (project.thumbnail_url) setSelectedMediaId("thumbnail");
  }, [project?.slug]);

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
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
  }, []);

  const handleBookmark = useCallback(() => setBookmarked((p) => !p), []);

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
      const remove = (comments: ProjectComment[]): ProjectComment[] =>
        comments
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, replies: remove(c.replies || []) }));
      setProject({ ...project, comments: remove(project.comments || []) });
    },
    [project],
  );

  if (loading) return <PageSkeleton />;
  if (!project) return null;

  /* ─── derived ─── */
  const youTubeId = getYouTubeId(project.video_url);
  const imageFiles = (project.files || []).filter((f) =>
    isImageUrl(f.file_url, f.file_type),
  );
  const nonImageFiles = (project.files || []).filter(
    (f) => !isImageUrl(f.file_url, f.file_type),
  );
  const galleryStripItems = imageFiles.map((f) => ({
    url: f.file_url,
    id: `file-${f.id}`,
  }));
  const activeGalleryUrl =
    galleryStripItems.find((g) => g.id === selectedMediaId)?.url ?? null;
  const teamMembers = project.members || [];
  const canEdit = isOwner || isMember;
  const hasStrip =
    youTubeId || galleryStripItems.length > 0 || project.thumbnail_url;

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,hsl(var(--primary)/0.12),transparent_34%),radial-gradient(circle_at_90%_2%,hsl(var(--primary)/0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[84px_minmax(0,1fr)] xl:grid-cols-[84px_minmax(0,1fr)_320px] gap-6">
        {/* ═══ Left sidebar ═══ */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 flex flex-col items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full border ${liked ? "text-destructive border-destructive/40 bg-destructive/10" : "border-border hover:bg-muted"}`}
              onClick={handleLike}
              disabled={!user}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full border ${bookmarked ? "text-primary border-primary/40 bg-primary/10" : "border-border hover:bg-muted"}`}
              onClick={handleBookmark}
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
            >
              <MessageSquare className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-border hover:bg-muted"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border border-border hover:bg-muted"
                onClick={() => router.push(`/project/create?edit=${slug}`)}
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
        </aside>

        {/* ═══ Main content ═══ */}
        <main className="space-y-8 min-w-0">
          {/* ── Title ── */}
          <h1 className="text-3xl md:text-4xl lg:text-[46px] leading-[1.05] font-black uppercase tracking-tight text-foreground">
            {project.title}
          </h1>

          {/* ── Steam-style media viewer ── */}
          <div className="space-y-2">
            {/* Main viewer */}
            <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border border-border bg-muted/30 shadow-[0_22px_40px_rgba(0,0,0,0.2)]">
              {selectedMediaId === "youtube" && youTubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
                  title="Project video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : activeGalleryUrl ? (
                <img
                  src={activeGalleryUrl}
                  alt="Screenshot"
                  className="w-full h-full object-cover"
                />
              ) : project.thumbnail_url ? (
                <img
                  src={project.thumbnail_url}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                  <span className="text-sm">
                    {t("project.noPreview") || "No preview available"}
                  </span>
                </div>
              )}
            </div>

            {/* Horizontal strip */}
            {hasStrip && (
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {/* YouTube card */}
                {youTubeId && (
                  <button
                    type="button"
                    onClick={() => setSelectedMediaId("youtube")}
                    style={{ scrollSnapAlign: "start" }}
                    className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${
                      selectedMediaId === "youtube"
                        ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${youTubeId}/mqdefault.jpg`}
                      alt="Video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-black/70 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </button>
                )}

                {/* Thumbnail card */}
                {project.thumbnail_url && (
                  <button
                    type="button"
                    onClick={() => setSelectedMediaId("thumbnail")}
                    style={{ scrollSnapAlign: "start" }}
                    className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${
                      selectedMediaId === "thumbnail"
                        ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <img
                      src={project.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}

                {/* Gallery image cards */}
                {galleryStripItems.map(({ url, id }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedMediaId(id)}
                    style={{ scrollSnapAlign: "start" }}
                    className={`relative flex-shrink-0 w-32 aspect-video rounded-sm overflow-hidden border-2 transition-all ${
                      selectedMediaId === id
                        ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <img
                      src={url}
                      alt="Screenshot"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── About ── */}
          <Card className="border-border/80 bg-card/90 text-card-foreground p-5 sm:p-6 space-y-5">
            <h2 className="text-xl font-black uppercase tracking-tight">
              {t("project.about") || "About The Project"}
            </h2>

            <p className="text-sm sm:text-[15px] leading-7 text-muted-foreground">
              {project.description || "No description provided."}
            </p>

            {/* Technologies (legacy data) */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className="text-xs px-2.5 py-0.5 rounded-full border-border/60"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* ── Team ── */}
          {teamMembers.length > 1 && (
            <Card className="border-border/80 bg-card/90 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold">
                  {t("project.team") || "Team"}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({teamMembers.length})
                  </span>
                </h3>
              </div>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                        <AvatarImage
                          src={member.profile?.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-xs">
                          {(
                            member.profile?.display_name ||
                            member.profile?.user_name ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.profile?.display_name ||
                            member.profile?.user_name ||
                            "Unknown"}
                        </p>
                        {member.profile?.user_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{member.profile.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[11px] uppercase shrink-0"
                    >
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Attachments (non-image files) ── */}
          {nonImageFiles.length > 0 && (
            <Card className="border-border/80 bg-card/90 p-4 sm:p-5">
              <h3 className="text-base font-semibold mb-4">
                {t("project.files") || "Files"}
              </h3>
              <div className="space-y-2">
                {nonImageFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-accent transition-colors"
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

          {/* ── Comments ── */}
          <Card
            ref={commentsRef}
            className="border-border/80 bg-card/90 p-5 sm:p-6"
          >
            <ProjectComments
              slug={slug}
              comments={(project.comments as ProjectComment[]) || []}
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          </Card>
        </main>

        {/* ═══ Right sidebar ═══ */}
        <aside className="hidden xl:flex xl:flex-col gap-3 sticky top-[84px] self-start">
          {/* ── Contributor Spotlight ── */}
          <Card className="border-border/80 bg-card/90 p-4 text-card-foreground space-y-2.5">
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
                    t("project.unknownUser") ||
                    "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("project.leadContributor") || "Lead contributor"}
                </p>
              </div>
            </div>
            {(project.repository_url || project.demo_url) && (
              <div className="grid grid-cols-1 gap-2 pt-1">
                {project.repository_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start border-border bg-muted/30 hover:bg-accent"
                  >
                    <a
                      href={project.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-3.5 w-3.5 mr-2" />
                      {t("project.repository") || "Repository"}
                    </a>
                  </Button>
                )}
                {project.demo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start border-border bg-muted/30 hover:bg-accent"
                  >
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-3.5 w-3.5 mr-2" />
                      {t("project.liveDemo") || "Live Demo"}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* ── Project info card ── */}
          <Card className="border-border/80 bg-card/90 p-4 text-card-foreground space-y-3">
            {/* Thumbnail */}
            {project.thumbnail_url && (
              <div
                className="rounded-md overflow-hidden border border-border cursor-pointer group"
                onClick={() => setSelectedMediaId("thumbnail")}
              >
                <img
                  src={project.thumbnail_url}
                  alt={project.title}
                  className="w-full aspect-video object-cover transition-opacity group-hover:opacity-80"
                />
              </div>
            )}

            {/* Brief */}
            {project.description && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("project.brief") || "Brief"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {project.description}
                </p>
              </div>
            )}

            {/* Project Type + Category */}
            <div className="border-t border-border/40 pt-2.5 grid grid-cols-1 gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("project.type") || "Project Type"}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/35 text-primary bg-primary/5 uppercase"
                  >
                    {t(`project.typeValue.${project.type}`) ||
                      TYPE_LABELS[project.type] ||
                      project.type}
                  </Badge>
                </div>
                {project.category && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("project.category") || "Category"}
                    </p>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {project.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {project.tags.length > 0 && (
              <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("project.tags") || "Tags"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary text-primary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Created date */}
            <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2.5">
              <span className="text-muted-foreground">
                {t("project.created") || "Created"}
              </span>
              <span className="text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 border-t border-border/40 pt-2.5">
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("project.progress") || "Progress"}
                </p>
                <span className="text-xs font-semibold">
                  {project.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5 border-t border-border/40 pt-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("project.difficulty") || "Difficulty"}
              </p>
              <Badge
                variant="outline"
                className={`text-xs ${difficultyColors[project.difficulty]}`}
              >
                {t(`project.difficulty.${project.difficulty}`) ||
                  difficultyLabel[project.difficulty]}
              </Badge>
            </div>
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
