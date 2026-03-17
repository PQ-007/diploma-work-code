"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  FolderGit2,
  GraduationCap,
  Heart,
  Layers,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pin,
  ThumbsUp,
  UserMinus,
  UserPlus,
} from "lucide-react";
import {
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════
   Types matching the API response
   ═══════════════════════════════════════════ */

interface ProfileStats {
  articles: number;
  totalViews: number;
  totalReactions: number;
  totalComments: number;
  totalBookmarks: number;
  rankingPoint: number;
  followers: number;
  following: number;
}

interface ArticleItem {
  id: string;
  title: string;
  sub_title: string | null;
  language_code: string;
  published_at: string | null;
  views: number;
  reactions: number;
  tags: string[];
  status?: string;
}

interface ActivityItem {
  type: "comment";
  articleTitle: string;
  body: string;
  created_at: string;
}

interface ProjectItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  project_type: string;
  difficulty: string;
  status: string;
  technologies: string[];
  views: number;
  likes_count: number;
  created_at: string;
}

interface ProfileInfo {
  id: string;
  user_name: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  role: string | null;
  ranking_point: number;
  created_at: string | null;
  skills: string | null;
  interest: string | null;
  language_level: unknown;
  banner_gradient: string;
  avatar_ring_color: string;
  pinned_article_ids: string[];
  pinned_project_ids: number[];
}

interface ProfileApiResponse {
  profile: ProfileInfo;
  stats: ProfileStats;
  articles: ArticleItem[];
  projects: ProjectItem[];
  recentActivity: ActivityItem[];
  isFollowing: boolean;
  isOwner: boolean;
  languageSkills: {
    id: number;
    language_name: string;
    flag_emoji: string;
    proficiency_level: string;
    sort_order: number;
  }[];
}

const getRankIcon = (points: number) => {
  if (points >= 2500)
    return <ChessKing className="h-5 w-5 shrink-0 text-red-500" />;
  if (points >= 2000)
    return <ChessQueen className="h-5 w-5 shrink-0 text-orange-500" />;
  if (points >= 1600)
    return <ChessRook className="h-5 w-5 shrink-0 text-purple-500" />;
  if (points >= 1200)
    return <ChessBishop className="h-5 w-5  shrink-0 text-blue-500" />;
  if (points >= 800)
    return <ChessKnight className="h-5 w-5 shrink-0 text-green-500" />;
  return <ChessPawn className="h-5 w-5 shrink-0 text-muted-foreground" />;
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo === 1) return "1 mo ago";
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;

  const [data, setData] = useState<ProfileApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const json: ProfileApiResponse = await res.json();
      setData(json);
      setFollowing(json.isFollowing);
      setFollowerCount(json.stats.followers);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!authLoading) fetchProfile();
  }, [authLoading, fetchProfile]);

  // Data derived from API response (stored in DB)
  const bannerGradient =
    data?.profile.banner_gradient || "from-violet-600 via-purple-500 to-fuchsia-500";
  const avatarRingColor =
    data?.profile.avatar_ring_color || "from-amber-400 via-yellow-300 to-amber-500";
  const skills: string[] = data?.profile.skills
    ? data.profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const languageSkills = data?.languageSkills ?? [];

  // Pinned items: use DB-stored IDs, fallback to top by views/likes
  const pinnedArticleIds: string[] = data?.profile.pinned_article_ids ?? [];
  const pinnedProjectIds: number[] = data?.profile.pinned_project_ids ?? [];
  const pinnedArticles =
    data && pinnedArticleIds.length > 0
      ? data.articles.filter((a) => pinnedArticleIds.includes(a.id))
      : (data?.articles
          .slice()
          .sort((a, b) => b.views - a.views)
          .slice(0, 3) ?? []);
  const pinnedProjects =
    data && pinnedProjectIds.length > 0
      ? data.projects.filter((p) => pinnedProjectIds.includes(p.id))
      : (data?.projects
          .slice()
          .sort((a, b) => b.likes_count - a.likes_count)
          .slice(0, 2) ?? []);

  const handleFollow = async () => {
    if (!data || !user) return;
    setFollowLoading(true);
    try {
      const res = await fetch("/api/profile/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data.profile.id }),
      });
      const result = await res.json();
      if (res.ok) {
        setFollowing(result.followed);
        setFollowerCount((c) => (result.followed ? c + 1 : c - 1));
      }
    } catch {
      // ignore
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const { profile, stats, articles, projects, isOwner } = data;

  return (
    <div className="space-y-5 pb-12 max-w-6xl mx-auto">
      {/* ════════ Header: Banner + Avatar + Info ════════ */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className={`h-32 sm:h-40 bg-gradient-to-r ${bannerGradient}`} />

        <div className="relative bg-card border border-border border-t-0 rounded-b-2xl px-6 pb-5 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="-mt-8 relative shrink-0">
              <div className={`rounded-full p-[3px] ${avatarRingColor ? `bg-gradient-to-br ${avatarRingColor} shadow-[0_0_18px_rgba(251,191,36,0.5)]` : "bg-border"}`}>
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground font-bold">
                    {(profile.display_name ||
                      profile.user_name)?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {profile.role && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pt-3 sm:pt-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight flex items-center ">
                    {profile.display_name || profile.user_name}
                    {getRankIcon(stats.rankingPoint)}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.bio || profile.user_name}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {isOwner ? (
                    <Button size="sm" asChild className="gap-1.5">
                      <Link href={`/profile/${slug}/edit`}>
                        Edit Profile
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : user ? (
                    <Button
                      variant={following ? "outline" : "default"}
                      size="sm"
                      onClick={handleFollow}
                      disabled={followLoading}
                      className="gap-1.5"
                    >
                      {followLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : following ? (
                        <UserMinus className="h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      {following ? "Unfollow" : "Follow"}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  <GraduationCap className="h-3 w-3" />
                  {(() => {
                    const enrollYear = parseInt(
                      profile.email?.substring(1, 3) ?? "0",
                    );
                    const n = new Date().getFullYear() - enrollYear - 2000;
                    const s =
                      n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
                    return `${n}${s} year student`;
                  })()}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {profile.created_at
                    ? `Joined ${new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                    : "Joined recently"}
                </span>

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  {followerCount} followers · {stats.following} following
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ Two-Column Layout ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* ─── Left: Pinned + Tabs ─── */}
        <div className="space-y-4">
          {/* Skills */}
          {skills.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Skills</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill: string) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="rounded-full px-2.5 py-0.5 text-[11px]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Language Skills */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Language Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {languageSkills.length > 0 ? (
                <div className="space-y-2">
                  {languageSkills.map((item, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-foreground">
                          {item.language_name}
                        </span>
                        {item.proficiency_level && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 shrink-0"
                          >
                            {item.proficiency_level}
                          </Badge>
                        )}
                      </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No language skills listed.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              {[
                {
                  icon: <MessageSquare className="h-3.5 w-3.5 text-blue-500" />,
                  label: "Comments received",
                  value: stats.totalComments,
                },
                {
                  icon: <Heart className="h-3.5 w-3.5 text-rose-500" />,
                  label: "Reactions received",
                  value: stats.totalReactions,
                },
                {
                  icon: <Bookmark className="h-3.5 w-3.5 text-amber-500" />,
                  label: "Bookmarks received",
                  value: stats.totalBookmarks,
                },
                {
                  icon: <Eye className="h-3.5 w-3.5 text-emerald-500" />,
                  label: "Total views",
                  value: stats.totalViews,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="space-y-4">
          {/* ── Pinned Section ── */}
          {(pinnedArticles.length > 0 || pinnedProjects.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pinnedArticles.map((article) => (
                <Link key={`a-${article.id}`} href={`/article/${article.id}`}>
                  <div className="relative overflow-hidden group flex flex-col justify-between h-full rounded-lg border border-border/70 bg-card hover:border-border transition-colors p-4 gap-3 min-h-[110px]">
                    {/* Pinned ribbon */}
                    <div className="absolute top-0 right-0 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-bl-lg ">
                      <Pin className="h-2.5 w-2.5 -rotate-45" />
                      Pinned
                    </div>
                    {/* Header */}
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                          {article.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {article.sub_title || "Article"}
                        </p>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                          >
                            <span className="h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {pinnedProjects.map((project) => (
                <Link key={`p-${project.id}`} href={`/project/${project.slug}`}>
                  <div className="relative overflow-hidden group flex flex-col justify-between h-full rounded-lg border border-border/70 bg-card hover:border-border transition-colors p-4 gap-3 min-h-[110px]">
                    {/* Pinned ribbon */}
                    <div className="absolute top-0 right-0 flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-bl-lg">
                      <Pin className="h-2.5 w-2.5 -rotate-45" />
                      Pinned
                    </div>
                    {/* Header */}
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0 h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center">
                        <FolderGit2 className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                          {project.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {project.description || project.project_type}
                        </p>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {project.technologies.slice(0, 2).map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                          >
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                project.difficulty === "beginner"
                                  ? "bg-emerald-400"
                                  : project.difficulty === "intermediate"
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                              }`}
                            />
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {project.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {project.likes_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="bg-transparent  border-border w-full rounded-none p-0 h-auto justify-start gap-0 mb-0">
              <TabsTrigger value="articles">
                <FileText className="h-3.5 w-3.5" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FolderGit2 className="h-3.5 w-3.5" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="flashcards">
                <Layers className="h-3.5 w-3.5" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles" className="mt-2">
              {articles.length > 0 ? (
                <div className="space-y-2">
                  {articles.map((article) => (
                    <Link key={article.id} href={`/article/${article.id}`}>
                      <div className="group rounded-lg border border-border/60 bg-card hover:border-border transition-colors p-4 space-y-2.5">
                        {/* type + title + menu */}
                        <div className="flex items-start gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                              <FileText className="h-3 w-3" />
                              Article
                            </span>
                            <span className="text-muted-foreground/40 text-xs shrink-0">
                              ·
                            </span>
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {article.title}
                            </h3>
                          </div>
                          <button
                            onClick={(e) => e.preventDefault()}
                            className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                        {/* tags */}
                        {article.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {article.tags.slice(0, 4).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-2 py-0 rounded-md font-normal"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* stats */}
                        <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {article.reactions}
                          </span>
                          {article.published_at && (
                            <span>{relativeTime(article.published_at)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 bg-card p-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No articles published yet.</p>
                </div>
              )}
            </TabsContent>

            {/* Flashcards Tab */}
            <TabsContent value="flashcards" className="mt-2">
              <Card className="border-border/60">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No flashcard sets created yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-2">
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Link key={project.id} href={`/project/${project.slug}`}>
                      <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                                  {project.title}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-2 py-0 capitalize ${
                                    project.status === "completed"
                                      ? "border-emerald-500 text-emerald-600"
                                      : project.status === "in_progress"
                                        ? "border-blue-500 text-blue-600"
                                        : project.status === "archived"
                                          ? "border-muted-foreground text-muted-foreground"
                                          : ""
                                  }`}
                                >
                                  {project.status.replace("_", " ")}
                                </Badge>
                              </div>
                              {project.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-2 py-0 capitalize ${
                                    project.difficulty === "beginner"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : project.difficulty === "intermediate"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                                >
                                  {project.difficulty}
                                </Badge>
                                {project.technologies
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
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {project.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {project.likes_count}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="border-border/60">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <FolderGit2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No projects published yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="mt-2">
              <div className="rounded-lg border border-border/60 bg-card p-8 text-center text-muted-foreground">
                <p className="text-sm">No certificates earned yet.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
