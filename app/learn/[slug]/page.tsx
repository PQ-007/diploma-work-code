"use client";

/**
 * @deprecated FutureHub refocus (Phase 1): the Learn section is mock/placeholder
 * content with no backend and is slated for removal. It is NOT one of the four
 * cores (Articles · Projects · Dictionary · Discussions). Do not build on this.
 * See futurehub-docs/docs/features/deprecated.md.
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Play,
  Share2,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  coursesMap,
  getDefaultCourse,
  type Course,
  type Level,
} from "@/lib/data/courses";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const levelMeta: Record<Level, { label: string; color: string }> = {
  beginner: {
    label: "Beginner",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  intermediate: {
    label: "Intermediate",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  advanced: {
    label: "Advanced",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

const fallbackThumbnail = "/images/courses/placeholder.svg";
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = fallbackThumbnail;
};

/* ------------------------------------------------------------------ */
/*  Page Skeleton                                                      */
/* ------------------------------------------------------------------ */

function PageSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      {/* Top bar */}
      <div className="border-b border-border bg-background px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-48" />
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // Simulate fetch — replace with real API later
    const timer = setTimeout(() => {
      setCourse(coursesMap[slug] || getDefaultCourse(slug));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <PageSkeleton />;
  if (!course) {
    router.push("/learn");
    return null;
  }

  const isEnrolled = course.progress !== undefined;
  const meta = levelMeta[course.level];
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );
  const completedLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
    0,
  );
  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/learn">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-base font-semibold truncate">{course.title}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="shrink-0"
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            {copied
              ? t("learn.copied") || "Copied!"
              : t("learn.share") || "Share"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 space-y-8">
        {/* ── Hero: Thumbnail + Info Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              unoptimized
              onError={handleImageError}
            />
            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-semibold bg-background/80 backdrop-blur-sm ${meta.color}`}
              >
                {meta.label}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-background/80 backdrop-blur-sm"
              >
                {course.category}
              </Badge>
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-sm font-medium text-white backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              {course.rating}
            </div>

            {/* Progress at bottom */}
            {isEnrolled && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Info Panel */}
          <Card className="p-5 space-y-4 h-fit">
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {course.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {course.description}
              </p>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {course.duration}h {t("learn.totalDuration") || "total"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>
                  {course.lessons} {t("learn.lessons") || "lessons"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  {formatNumber(course.enrolled)}{" "}
                  {t("learn.enrolled") || "enrolled"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4 shrink-0" />
                <span>
                  {course.rating} {t("learn.rating") || "rating"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {course.instructorAvatar ? (
                  <Image
                    src={course.instructorAvatar}
                    alt={course.instructor}
                    width={40}
                    height={40}
                    className="object-cover"
                    unoptimized
                    onError={handleImageError}
                  />
                ) : (
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {course.instructor}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {course.instructorBio}
                </p>
              </div>
            </div>

            <Separator />

            {/* Enroll / Continue */}
            {isEnrolled ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("learn.progress") || "Progress"}
                  </span>
                  <span className="font-semibold">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <Button className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  {t("learn.continueLearning") || "Continue Learning"}
                </Button>
              </div>
            ) : (
              <Button className="w-full" size="lg">
                <GraduationCap className="h-4 w-4 mr-2" />
                {t("learn.enrollNow") || "Enroll Now — Free"}
              </Button>
            )}

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {course.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs rounded-full"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="curriculum">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="curriculum">
              <BookOpen className="h-4 w-4 mr-1.5" />
              {t("learn.curriculum") || "Curriculum"}
            </TabsTrigger>
            <TabsTrigger value="overview">
              {t("learn.overview") || "Overview"}
            </TabsTrigger>
          </TabsList>

          {/* Curriculum */}
          <TabsContent value="curriculum" className="mt-6 space-y-4">
            {course.modules.map((mod, mi) => {
              const modCompleted = mod.lessons.filter(
                (l) => l.completed,
              ).length;
              const modTotal = mod.lessons.length;
              return (
                <Card key={mod.id} className="overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                        {String(mi + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-sm font-semibold truncate">
                        {mod.title}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {modCompleted}/{modTotal}
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors"
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span
                          className={`flex-1 text-sm truncate ${lesson.completed ? "text-muted-foreground" : ""}`}
                        >
                          {lesson.title}
                        </span>
                        {lesson.preview && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {t("learn.preview") || "Preview"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {lesson.duration}m
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </TabsContent>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-8">
            {/* About */}
            <section className="space-y-3">
              <h3 className="text-base font-bold">
                {t("learn.aboutCourse") || "About this course"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.longDescription}
              </p>
            </section>

            {/* Outcomes */}
            <section className="space-y-3">
              <h3 className="text-base font-bold">
                {t("learn.whatYouWillLearn") || "What you will learn"}
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {course.outcomes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Requirements */}
            <section className="space-y-3">
              <h3 className="text-base font-bold">
                {t("learn.requirements") || "Requirements"}
              </h3>
              <ul className="space-y-1.5">
                {course.requirements.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Last updated */}
            <p className="text-xs text-muted-foreground">
              {t("learn.lastUpdated") || "Last updated"}: {course.lastUpdated}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
