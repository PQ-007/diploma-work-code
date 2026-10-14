"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  FolderGit2,
  GraduationCap,
  Heart,
  Loader2,
  MessageSquare,
  UserMinus,
  UserPlus,
} from "lucide-react";
import {getRankIcon} from "@/lib/utils/rankIcons";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// --- Unified Content System ---
import {
  PinnedContentCard,
  CompactContentCard,
} from "@/components/content/ProfileContentCards";
import {
  transformProfileArticle,
  transformProfileProject,
  ProfileArticleAPI,
  ProfileProjectAPI,
} from "@/lib/api/transformers/profile";
import { Author } from "@/lib/types/author";
import { LogoLoader } from "@/components/brand/LogoLoader";

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



export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { t, language: i18nLang } = useLanguage();
  const params = useParams();
  const slug = params?.slug as string;

  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t],
  );

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
    data?.profile.banner_gradient ||
    "from-violet-600 via-purple-500 to-fuchsia-500";
  const avatarRingColor =
    data?.profile.avatar_ring_color ||
    "from-amber-400 via-yellow-300 to-amber-500";
  const skills: string[] = data?.profile.skills
    ? data.profile.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
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
      <LogoLoader />
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">
          {tr("profile.notFound", "Profile not found")}
        </p>
        <Button asChild variant="outline">
          <Link href="/">{tr("profile.goHome", "Go Home")}</Link>
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
            <div className="relative -mt-8 w-fit shrink-0 self-start">
              <div
                className={`rounded-full p-[3px] ${avatarRingColor ? `bg-gradient-to-br ${avatarRingColor}` : "bg-border"}`}
              >
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground font-bold">
                    {(profile.display_name ||
                      profile.user_name)?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {(profile.role === "admin" || profile.role === "teacher") && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center" title={profile.role}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pt-3 sm:pt-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="flex items-center gap-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                    {profile.display_name || profile.user_name}
                    {getRankIcon(stats.rankingPoint, 5.5)}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {profile.bio || profile.user_name}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {isOwner ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/profile/${slug}/edit`}>
                        {tr("profile.editProfile", "Edit Profile")}
                      </Link>
                    </Button>
                  ) : user ? (
                    <Button
                      variant={following ? "secondary" : "default"}
                      size="sm"
                      onClick={handleFollow}
                      disabled={followLoading}
                      aria-pressed={following}
                    >
                      {followLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : following ? (
                        <UserMinus className="h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      {following
                        ? tr("profile.unfollow", "Unfollow")
                        : tr("feed.actions.follow", "Follow")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                
                {(() => {
                  // Student codes look like s21c010b@nmct.edu.mn → enrolled 2021.
                  const m = profile.email?.match(/^[a-z](\d{2})/i);
                  if (!m) return null;
                  const n = new Date().getFullYear() - 2000 - parseInt(m[1], 10);
                  return (
                    <Badge variant="brand">
                      <GraduationCap />
                      {n > 5 ? tr("profile.alumni", "Alumni") : `${n} ${tr("profile.yearStudent", "year student")}`}
                    </Badge>
                  );
                })()}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {profile.created_at
                    ? `${tr("profile.joinedDate", "Joined")} ${new Date(profile.created_at).toLocaleDateString(i18nLang, { month: "short", year: "numeric" })}`
                    : tr("profile.joinedRecently", "Joined recently")}
                </span>

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  {followerCount} {tr("profile.followers", "followers")} ·{" "}
                  {stats.following} {tr("profile.following", "following")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ Two-Column Layout ════════ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* ─── About: skills, languages, engagement (after content on phones) ─── */}
        <div className="order-2 space-y-4 lg:order-1">
          {/* Skills */}
          {skills.length > 0 && (
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  {tr("profile.skills", "Skills")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill: string) => (
                    <Badge key={skill} variant="neutral" className="h-6 px-2.5 text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Language Skills */}
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {tr("profile.languageSkills", "Language Skills")}
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
                        <Badge variant="outline">{item.proficiency_level}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {tr("profile.noLanguageSkills", "No language skills listed.")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {tr("profile.engagement", "Engagement")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              {[
                {
                  icon: <MessageSquare className="size-4 text-muted-foreground" />,
                  label: tr("profile.commentsReceived", "Comments received"),
                  value: stats.totalComments,
                },
                {
                  icon: <Heart className="size-4 text-muted-foreground" />,
                  label: tr("profile.reactionsReceived", "Reactions received"),
                  value: stats.totalReactions,
                },
                {
                  icon: <Bookmark className="size-4 text-muted-foreground" />,
                  label: tr("profile.bookmarksReceived", "Bookmarks received"),
                  value: stats.totalBookmarks,
                },
                {
                  icon: <Eye className="size-4 text-muted-foreground" />,
                  label: tr("profile.totalViews", "Total views"),
                  value: stats.totalViews,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ─── Content: pinned + tabs ─── */}
        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          {/* ── Pinned Section ── */}
          {(pinnedArticles.length > 0 || pinnedProjects.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pinnedArticles.map((article) => {
                const author: Author = {
                  id: profile.id,
                  username: profile.user_name,
                  displayName: profile.display_name || profile.user_name,
                  avatarUrl: profile.avatar_url,
                  rankingPoint: profile.ranking_point,
                };
                const transformedArticle = transformProfileArticle(
                  article as ProfileArticleAPI,
                  author,
                );
                return (
                  <PinnedContentCard
                    key={`a-${article.id}`}
                    item={transformedArticle}
                  />
                );
              })}
              {pinnedProjects.map((project) => {
                const author: Author = {
                  id: profile.id,
                  username: profile.user_name,
                  displayName: profile.display_name || profile.user_name,
                  avatarUrl: profile.avatar_url,
                  rankingPoint: profile.ranking_point,
                };
                const transformedProject = transformProfileProject(
                  project as ProfileProjectAPI,
                  author,
                );
                return (
                  <PinnedContentCard
                    key={`p-${project.id}`}
                    item={transformedProject}
                  />
                );
              })}
            </div>
          )}

          <Tabs defaultValue="articles" className="w-full">
            <TabsList variant="underline">
              <TabsTrigger value="articles">
                <FileText />
                {tr("sidebar.articles", "Articles")}
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FolderGit2 />
                {tr("sidebar.projects", "Projects")}
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles" className="mt-2">
              {articles.length > 0 ? (
                <div className="space-y-2">
                  {articles.map((article) => {
                    const author: Author = {
                      id: profile.id,
                      username: profile.user_name,
                      displayName: profile.display_name || profile.user_name,
                      avatarUrl: profile.avatar_url,
                      rankingPoint: profile.ranking_point,
                    };
                    const transformedArticle = transformProfileArticle(
                      article as ProfileArticleAPI,
                      author,
                    );
                    return (
                      <CompactContentCard
                        key={article.id}
                        item={transformedArticle}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 bg-card p-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    {tr("profile.noArticlesYet", "No articles published yet.")}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-2">
              {projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project) => {
                    const author: Author = {
                      id: profile.id,
                      username: profile.user_name,
                      displayName: profile.display_name || profile.user_name,
                      avatarUrl: profile.avatar_url,
                      rankingPoint: profile.ranking_point,
                    };
                    const transformedProject = transformProfileProject(
                      project as ProfileProjectAPI,
                      author,
                    );
                    return (
                      <CompactContentCard
                        key={project.id}
                        item={transformedProject}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="gap-3">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <FolderGit2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      {tr(
                        "profile.noProjectsYet",
                        "No projects published yet.",
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
