"use client";

import { BackToTop } from "@/components/common/BackToTop";
import FloatingActionBar from "@/app/project/components/FloatingActionBar";
import ProjectComments from "@/app/project/components/ProjectComments";
import ProjectMediaViewer from "./ProjectMediaViewer";
import type { ProjectComment, ProjectPayload } from "@/app/project/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Tag } from "@/components/common/Tag";
import { UserChip } from "@/components/common/UserChip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  ExternalLink,
  FolderX,
  Github,
  Globe,
  Heart,
  MessageSquare,
  Pencil,
  Share2,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoLoader } from "@/components/brand/LogoLoader";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

/** Key facts about a project as a definition list (sidebar on xl, card below "About" otherwise). */
function ProjectFacts({ project, t }: { project: ProjectPayload; t: (k: string) => string }) {
  return (
    <dl className="divide-y text-sm">
      <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
        <dt className="text-muted-foreground">{t("project.type")}</dt>
        <dd><StatusBadge kind="projectType" value={project.type} /></dd>
      </div>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <dt className="text-muted-foreground">{t("project.status")}</dt>
        <dd><StatusBadge kind="project" value={project.status} /></dd>
      </div>
      {project.category && (
        <div className="flex items-center justify-between gap-3 py-2.5">
          <dt className="text-muted-foreground">{t("project.category")}</dt>
          <dd className="font-medium">{t(`project.categoryValue.${project.category}`)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 py-2.5">
        <dt className="text-muted-foreground">{t("project.difficulty")}</dt>
        <dd><StatusBadge kind="difficulty" value={project.difficulty} /></dd>
      </div>
      <div className="space-y-1.5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("project.progress")}</dt>
          <dd className="font-medium tabular-nums">{project.progress}%</dd>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <dt className="text-muted-foreground">{t("project.created")}</dt>
        <dd className="font-medium">{new Date(project.created_at).toLocaleDateString()}</dd>
      </div>
      {project.tags.length > 0 && (
        <div className="space-y-2 pt-2.5 last:pb-0">
          <dt className="text-muted-foreground">{t("project.tags")}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => <Tag key={tag} name={tag} />)}
          </dd>
        </div>
      )}
    </dl>
  );
}

function ProjectLinks({ project, t }: { project: ProjectPayload; t: (k: string) => string }) {
  if (!project.repository_url && !project.demo_url) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {project.demo_url && (
        <Button asChild size="sm">
          <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
            <Globe />
            {t("project.liveDemo")}
          </a>
        </Button>
      )}
      {project.repository_url && (
        <Button asChild size="sm" variant="outline">
          <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
            <Github />
            {t("project.repository")}
          </a>
        </Button>
      )}
    </div>
  );
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
/*  Page                                                                */
/* ------------------------------------------------------------------ */

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

  /* ─── media viewer ─── */
  const [selectedMediaId, setSelectedMediaId] = useState<string>("thumbnail");

  useEffect(() => {
    if (!slug) return;
    (async () => {
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
        setProject(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

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

  if (loading) return <LogoLoader />;
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderX className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">{t("project.notFound")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("project.notFoundDesc")}
        </p>
        <Button size="sm" onClick={() => router.push("/project")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("project.backToProjects")}
        </Button>
      </div>
    );
  }

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
    <div className="relative min-h-screen pb-16 -mx-4 sm:-mx-6 lg:-mx-8 bg-background text-foreground">
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
          <header className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge kind="projectType" value={project.type} />
              <StatusBadge kind="project" value={project.status} />
              <StatusBadge kind="difficulty" value={project.difficulty} />
            </div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <UserChip
                size="sm"
                name={project.author?.display_name || project.author?.user_name || t("project.unknownUser")}
                avatarUrl={project.author?.avatar_url}
                username={project.author?.user_name}
                subtitle={t("project.leadContributor")}
              />
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="xl:hidden">
              <ProjectLinks project={project} t={t} />
            </div>
          </header>

          {/* ── Steam-style media viewer ── */}
          <ProjectMediaViewer
            title={project.title}
            thumbnailUrl={project.thumbnail_url}
            youTubeId={youTubeId}
            activeGalleryUrl={activeGalleryUrl}
            hasStrip={Boolean(hasStrip)}
            galleryStripItems={galleryStripItems}
            selectedMediaId={selectedMediaId}
            setSelectedMediaId={setSelectedMediaId}
          />

          {/* ── About ── */}
          <Card className="gap-4 p-5 sm:p-6">
            <h2 className="text-base font-semibold">{t("project.about")}</h2>

            <p className="whitespace-pre-line text-[15px] leading-7 text-foreground/85">
              {project.description}
            </p>

            {/* Technologies (legacy data) */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <Tag key={tech} name={tech} />
                ))}
              </div>
            )}
          </Card>

          {/* ── Facts (sidebar holds them on xl) ── */}
          <Card className="gap-3 p-5 xl:hidden">
            <h2 className="text-base font-semibold">{t("project.details")}</h2>
            <ProjectFacts project={project} t={t} />
          </Card>

          {/* ── Team ── */}
          {teamMembers.length > 1 && (
            <Card className="gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-2">
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
                    <Badge variant={member.role === "owner" ? "brand" : "neutral"} className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Attachments (non-image files) ── */}
          {nonImageFiles.length > 0 && (
            <Card className="gap-4 p-4 sm:p-5">
              <h3 className="text-base font-semibold">
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
          <Card ref={commentsRef} className="p-5 sm:p-6">
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
          {(project.repository_url || project.demo_url) && (
            <Card className="gap-3 p-4">
              <ProjectLinks project={project} t={t} />
            </Card>
          )}

          <Card className="gap-3 p-4">
            <h2 className="text-sm font-semibold">{t("project.details")}</h2>
            <ProjectFacts project={project} t={t} />
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

      <BackToTop />
    </div>
  );
}
