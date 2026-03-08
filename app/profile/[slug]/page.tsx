"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Loader2,
  MessageSquare,
  Star,
  Trophy,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  tags: string[];
}

interface ActivityItem {
  type: "comment";
  articleTitle: string;
  body: string;
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
}

interface ProfileApiResponse {
  profile: ProfileInfo;
  stats: ProfileStats;
  articles: ArticleItem[];
  recentActivity: ActivityItem[];
  isFollowing: boolean;
  isOwner: boolean;
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

  // Also get banner/skills from user_metadata for owner
  const meta = user?.user_metadata || {};
  const bannerGradient =
    data?.isOwner && meta.bannerGradient
      ? meta.bannerGradient
      : "from-violet-600 via-purple-500 to-fuchsia-500";
  const skills: string[] = data?.isOwner && meta.skills ? meta.skills : [];

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

  const { profile, stats, articles, recentActivity, isOwner } = data;

  return (
    <div className="space-y-5 pb-12 max-w-6xl mx-auto">
      {/* ════════ Header: Banner + Avatar + Info ════════ */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className={`h-32 sm:h-40 bg-gradient-to-r ${bannerGradient}`} />

        <div className="relative bg-card border border-border border-t-0 rounded-b-2xl px-6 pb-5 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="-mt-14 relative">
              <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
                <AvatarImage src={profile.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground font-bold">
                  {(profile.display_name ||
                    profile.user_name)?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {profile.role && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name & bio */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {profile.display_name || profile.user_name}
              </h1>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge className="gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  <GraduationCap className="h-3 w-3" />
                  NMCT
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {profile.created_at
                    ? `Joined ${new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                    : "Joined recently"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {followerCount} followers · {stats.following} following
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              {isOwner ? (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href="/setup">
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
        </div>
      </div>

      {/* ════════ Stats Row ════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <FileText className="h-4 w-4" />,
            label: "Articles Written",
            value: stats.articles,
          },
          {
            icon: <Eye className="h-4 w-4" />,
            label: "Total Views",
            value: stats.totalViews,
          },
          {
            icon: <Heart className="h-4 w-4" />,
            label: "Reactions",
            value: stats.totalReactions,
          },
          {
            icon: <Trophy className="h-4 w-4" />,
            label: "Ranking Points",
            value: stats.rankingPoint,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {stat.icon}
                <span>{stat.label}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {stat.value.toLocaleString()}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ════════ Two-Column Layout ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* ─── Left: Tabs ─── */}
        <div>
          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="articles" className="text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Articles ({stats.articles})
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="text-xs sm:text-sm">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-xs sm:text-sm">
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Certificates
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles">
              {articles.length > 0 ? (
                <div className="space-y-3">
                  {articles.map((article) => (
                    <Link key={article.id} href={`/article/${article.id}`}>
                      <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                                {article.title}
                              </h3>
                              {article.sub_title && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {article.sub_title}
                                </p>
                              )}
                              <div className="flex items-center gap-3 flex-wrap">
                                {article.tags.slice(0, 4).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-[10px] px-2 py-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.views}
                              </span>
                              {article.published_at && (
                                <span>
                                  {new Date(
                                    article.published_at,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
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
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No articles published yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Flashcards Tab */}
            <TabsContent value="flashcards">
              <Card className="border-border/60">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No flashcard sets created yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates">
              <Card className="border-border/60">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No certificates earned yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="space-y-4">
          {/* Skills */}
          {skills.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
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

          {/* Engagement Stats */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
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

          {/* Recent Activity */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Commented on{" "}
                        <span className="text-foreground font-medium">
                          &ldquo;{item.articleTitle}&rdquo;
                        </span>
                      </p>
                      {item.created_at && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No recent activity.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
