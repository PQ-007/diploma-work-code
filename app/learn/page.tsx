"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Code,
  Flame,
  GraduationCap,
  Layers,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExploreCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
  items: number;
  completed: number;
  difficulty?: "beginner" | "intermediate" | "advanced" | "mixed";
  featured?: boolean;
  category: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const exploreCards: ExploreCard[] = [
  {
    id: "algorithm",
    title: "Algorithms",
    description:
      "Master sorting, searching, dynamic programming, greedy, graph algorithms and more.",
    href: "/learn/algorithm",
    icon: <Target className="h-7 w-7" />,
    gradient: "from-violet-600 to-purple-500",
    items: 30,
    completed: 15,
    difficulty: "mixed",
    featured: true,
    category: "Problem Sets",
  },
  {
    id: "data-structure",
    title: "Data Structures",
    description:
      "Arrays, linked lists, trees, graphs, hash tables — learn them all through practice.",
    href: "/learn/data-structure",
    icon: <Layers className="h-7 w-7" />,
    gradient: "from-emerald-600 to-green-500",
    items: 33,
    completed: 16,
    difficulty: "mixed",
    featured: true,
    category: "Problem Sets",
  },
  {
    id: "programming-lang",
    title: "Programming Languages",
    description:
      "Python, JavaScript, TypeScript, Java, C++, Go, Rust, SQL exercises from beginner to advanced.",
    href: "/learn/programming-lang",
    icon: <Code className="h-7 w-7" />,
    gradient: "from-blue-600 to-cyan-500",
    items: 37,
    completed: 18,
    difficulty: "beginner",
    featured: true,
    category: "Exercises",
  },
  {
    id: "resources",
    title: "Resources & Guides",
    description:
      "Articles, cheat sheets, tutorials, video courses, and curated documentation.",
    href: "/learn/resources",
    icon: <BookMarked className="h-7 w-7" />,
    gradient: "from-amber-500 to-orange-500",
    items: 27,
    completed: 17,
    difficulty: "beginner",
    category: "Resources",
  },
];

const difficultyLabel: Record<string, { text: string; color: string }> = {
  beginner: {
    text: "Beginner",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  intermediate: {
    text: "Intermediate",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  advanced: {
    text: "Advanced",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  mixed: {
    text: "All Levels",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LearnPage() {
  const { t } = useLanguage();

  const totalItems = exploreCards.reduce((s, c) => s + c.items, 0);
  const totalCompleted = exploreCards.reduce((s, c) => s + c.completed, 0);
  const overallPct =
    totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <div className="space-y-10 pb-16 max-w-6xl items-center mx-auto">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("learn.title") || "Explore"}
            </h1>
            <p className="text-muted-foreground max-w-lg">
              {t("learn.subtitle") ||
                "Curated study plans and problem sets to level up your skills step by step."}
            </p>
          </div>

          {/* Mini progress ring */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="8"
                  className="stroke-muted/20"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="8"
                  className="stroke-primary"
                  strokeDasharray={`${(totalCompleted / totalItems) * 327} 327`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{overallPct}%</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-semibold">
                {totalCompleted}/{totalItems}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("learn.completed") || "completed"}
              </p>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      </div>

      {/* ── Featured Study Plans ── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {t("learn.featured") || "Featured"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("learn.featuredDesc") ||
                "Most popular study plans to get started"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exploreCards
            .filter((c) => c.featured)
            .map((card) => {
              const pct =
                card.items > 0
                  ? Math.round((card.completed / card.items) * 100)
                  : 0;
              const diff = card.difficulty
                ? difficultyLabel[card.difficulty]
                : null;
              return (
                <Link key={card.id} href={card.href} className="group">
                  <Card className="overflow-hidden border-border transition-all hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 h-full">
                    <CardContent className="p-0">
                      {/* Gradient banner */}
                      <div
                        className={`bg-gradient-to-br ${card.gradient} p-5 text-white relative overflow-hidden`}
                      >
                        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                        <div className="relative flex items-start justify-between">
                          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                            {card.icon}
                          </div>
                          <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 mt-1" />
                        </div>
                        <h3 className="text-lg font-bold mt-4">{card.title}</h3>
                        <p className="text-sm text-white/75 mt-1 line-clamp-2">
                          {card.description}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {card.completed}/{card.items}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t("learn.items") || "items"}
                            </span>
                          </div>
                          {diff && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${diff.color}`}
                            >
                              {diff.text}
                            </Badge>
                          )}
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
      </section>

      {/* ── All Study Plans ── */}
      <section className="space-y-5">
        <h2 className="text-xl font-bold">
          {t("learn.allPlans") || "All Study Plans"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exploreCards.map((card) => {
            const pct =
              card.items > 0
                ? Math.round((card.completed / card.items) * 100)
                : 0;
            const diff = card.difficulty
              ? difficultyLabel[card.difficulty]
              : null;
            return (
              <Link key={card.id} href={card.href} className="group">
                <Card className="border-border transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 h-full">
                  <CardContent className="p-4 space-y-4">
                    {/* Icon + badge row */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`rounded-xl bg-gradient-to-br ${card.gradient} p-3 text-white`}
                      >
                        {card.icon}
                      </div>
                      {diff && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${diff.color}`}
                        >
                          {diff.text}
                        </Badge>
                      )}
                    </div>

                    {/* Title + desc */}
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {card.description}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {card.completed}/{card.items}{" "}
                          {t("learn.items") || "items"}
                        </span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/learn/algorithm" className="group">
          <Card className="border-border hover:border-primary/20 transition-all hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Flame className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {t("learn.topAlgorithms") || "Top Algorithm Problems"}
                </p>
                <p className="text-xs text-muted-foreground">30 problems</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/learn/data-structure" className="group">
          <Card className="border-border hover:border-primary/20 transition-all hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Star className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {t("learn.topDataStructures") ||
                    "Top Data Structure Problems"}
                </p>
                <p className="text-xs text-muted-foreground">33 problems</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/learn/programming-lang" className="group">
          <Card className="border-border hover:border-primary/20 transition-all hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {t("learn.learnLanguage") || "Learn a Language"}
                </p>
                <p className="text-xs text-muted-foreground">
                  8 languages, 37 exercises
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
