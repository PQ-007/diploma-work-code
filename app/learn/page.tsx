"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Play,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Level = "beginner" | "intermediate" | "advanced";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  category: string;
  level: Level;
  duration: number; // hours
  lessons: number;
  enrolled: number;
  rating: number;
  tags: string[];
  progress?: number; // 0-100 — undefined = not enrolled
  createdAt: string;
  featured?: boolean;
  section?: string; // curated section id
}

interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  courseCount: number;
  totalHours: number;
  level: Level;
  progress?: number;
  color: string;
}

interface CuratedSection {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

interface SkillArea {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  courseCount: number;
  color: string;
  href: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const filterTags = [
  "All",
  "JavaScript",
  "Python",
  "React",
  "TypeScript",
  "Node.js",
  "Data Science",
  "AI / ML",
  "Frontend",
  "Backend",
  "Beginner",
  "Intermediate",
  "Advanced",
];

const curatedSections: CuratedSection[] = [
  {
    id: "trending",
    emoji: "🔥",
    title: "Trending Now",
    description:
      "The most popular courses this week — see what everyone is learning.",
  },
  {
    id: "beginner",
    emoji: "🌱",
    title: "Start Here",
    description:
      "Brand new to coding? These beginner-friendly courses will have you writing real code on day one.",
  },
  {
    id: "deepdive",
    emoji: "🧠",
    title: "Deep Dives",
    description:
      "Ready to level up? Explore advanced topics and master the skills employers are looking for.",
  },
];

const skillAreas: SkillArea[] = [
  {
    id: "1",
    slug: "programming-lang",
    title: "Programming Languages",
    description: "Master the fundamentals of popular languages",
    icon: <Code className="h-6 w-6" />,
    courseCount: 24,
    color: "from-blue-600 to-cyan-500",
    href: "/learn/programming-lang",
  },
  {
    id: "2",
    slug: "data-structure",
    title: "Data Structures",
    description: "Understand how data is organized and accessed",
    icon: <Layers className="h-6 w-6" />,
    courseCount: 18,
    color: "from-emerald-600 to-green-400",
    href: "/learn/data-structure",
  },
  {
    id: "3",
    slug: "algorithm",
    title: "Algorithms",
    description: "Solve problems efficiently with proven techniques",
    icon: <Target className="h-6 w-6" />,
    courseCount: 22,
    color: "from-violet-600 to-purple-400",
    href: "/learn/algorithm",
  },
  {
    id: "4",
    slug: "resources",
    title: "Resources & Guides",
    description: "Cheat sheets, references, and extra learning materials",
    icon: <FileText className="h-6 w-6" />,
    courseCount: 35,
    color: "from-amber-500 to-orange-400",
    href: "/learn/resources",
  },
];

const learningPaths: LearningPath[] = [
  {
    id: "1",
    slug: "full-stack-web-dev",
    title: "Full-Stack Web Developer",
    description:
      "Go from zero to deploying production apps with React, Node.js, and PostgreSQL.",
    icon: <Zap className="h-5 w-5" />,
    courseCount: 8,
    totalHours: 64,
    level: "intermediate",
    progress: 38,
    color: "from-blue-600 to-indigo-500",
  },
  {
    id: "2",
    slug: "frontend-specialist",
    title: "Frontend Specialist",
    description:
      "Master HTML, CSS, JavaScript, React, and modern frontend tooling.",
    icon: <Layers className="h-5 w-5" />,
    courseCount: 6,
    totalHours: 48,
    level: "beginner",
    progress: 72,
    color: "from-emerald-600 to-teal-500",
  },
  {
    id: "3",
    slug: "data-science-path",
    title: "Data Science with Python",
    description:
      "Learn pandas, visualization, statistics, and machine learning from scratch.",
    icon: <TrendingUp className="h-5 w-5" />,
    courseCount: 7,
    totalHours: 56,
    level: "intermediate",
    progress: 12,
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "4",
    slug: "backend-engineering",
    title: "Backend Engineering",
    description:
      "Databases, APIs, authentication, deployment — everything you need for solid backends.",
    icon: <Code className="h-5 w-5" />,
    courseCount: 5,
    totalHours: 40,
    level: "advanced",
    color: "from-orange-500 to-red-500",
  },
];

const courses: Course[] = [
  // ── Continue Learning (in-progress) ──
  {
    id: "1",
    slug: "complete-react-developer",
    title: "Complete React Developer Course",
    description:
      "Master React from basics to advanced concepts including hooks, context, and performance.",
    thumbnail: "/images/courses/react-developer.png",
    instructor: "Sarah Johnson",
    category: "Frontend",
    level: "intermediate",
    duration: 24,
    lessons: 156,
    enrolled: 12547,
    rating: 4.8,
    tags: ["React", "JavaScript", "Frontend", "Intermediate"],
    progress: 65,
    createdAt: "2025-01-10",
    section: "continue",
  },
  {
    id: "2",
    slug: "advanced-javascript-concepts",
    title: "Advanced JavaScript Concepts",
    description:
      "Deep dive into closures, prototypes, async programming, and modern ES6+ features.",
    thumbnail: "/images/courses/advanced-js.png",
    instructor: "Alex Rodriguez",
    category: "Frontend",
    level: "advanced",
    duration: 16,
    lessons: 89,
    enrolled: 6754,
    rating: 4.6,
    tags: ["JavaScript", "Advanced", "Frontend"],
    progress: 25,
    createdAt: "2025-02-05",
    section: "continue",
  },

  // ── Trending Now ──
  {
    id: "3",
    slug: "python-data-science-bootcamp",
    title: "Python Data Science Bootcamp",
    description:
      "Learn data analysis, visualization, and machine learning with Python.",
    thumbnail: "/images/courses/python-data-science.png",
    instructor: "Dr. Lisa Wang",
    category: "Data Science",
    level: "beginner",
    duration: 32,
    lessons: 201,
    enrolled: 15678,
    rating: 4.9,
    tags: ["Python", "Data Science", "AI / ML", "Beginner"],
    createdAt: "2025-03-01",
    section: "trending",
    featured: true,
  },
  {
    id: "4",
    slug: "typescript-masterclass",
    title: "TypeScript Masterclass 2026",
    description:
      "Everything you need to know about TypeScript for modern web apps.",
    thumbnail: "/images/courses/typescript-master.png",
    instructor: "Ryan Dahl",
    category: "Frontend",
    level: "intermediate",
    duration: 14,
    lessons: 78,
    enrolled: 9823,
    rating: 4.7,
    tags: ["TypeScript", "JavaScript", "Frontend", "Intermediate"],
    createdAt: "2025-04-12",
    section: "trending",
    featured: true,
  },
  {
    id: "5",
    slug: "ai-for-developers",
    title: "AI for Developers — Practical Guide",
    description:
      "Integrate GPT, embeddings, and AI agents into real applications.",
    thumbnail: "/images/courses/ai-devs.png",
    instructor: "Andrej Karpathy",
    category: "AI / ML",
    level: "intermediate",
    duration: 20,
    lessons: 112,
    enrolled: 18340,
    rating: 4.9,
    tags: ["AI / ML", "Python", "Intermediate"],
    createdAt: "2025-05-20",
    section: "trending",
    featured: true,
  },
  {
    id: "6",
    slug: "nodejs-express-masterclass",
    title: "Node.js & Express Masterclass",
    description:
      "Build scalable backend applications with Node.js, Express, and MongoDB.",
    thumbnail: "/images/courses/nodejs-express.png",
    instructor: "Michael Chen",
    category: "Backend",
    level: "intermediate",
    duration: 18,
    lessons: 98,
    enrolled: 8934,
    rating: 4.7,
    tags: ["Node.js", "Backend", "JavaScript", "Intermediate"],
    createdAt: "2025-01-25",
    section: "trending",
  },

  // ── Start Here (Beginner) ──
  {
    id: "7",
    slug: "html-css-fundamentals",
    title: "HTML & CSS Fundamentals",
    description:
      "Build beautiful, responsive websites from scratch — no experience required.",
    thumbnail: "/images/courses/html-css.png",
    instructor: "Emma Wilson",
    category: "Frontend",
    level: "beginner",
    duration: 12,
    lessons: 64,
    enrolled: 25430,
    rating: 4.8,
    tags: ["Frontend", "Beginner"],
    createdAt: "2025-06-01",
    section: "beginner",
  },
  {
    id: "8",
    slug: "python-for-beginners",
    title: "Python for Absolute Beginners",
    description:
      "Your first programming language. Learn variables, loops, functions, and more.",
    thumbnail: "/images/courses/python-beginners.png",
    instructor: "David Park",
    category: "Programming",
    level: "beginner",
    duration: 10,
    lessons: 52,
    enrolled: 31200,
    rating: 4.9,
    tags: ["Python", "Beginner"],
    createdAt: "2025-05-15",
    section: "beginner",
  },
  {
    id: "9",
    slug: "javascript-essentials",
    title: "JavaScript Essentials",
    description:
      "The language of the web. Master the fundamentals that power every website.",
    thumbnail: "/images/courses/js-essentials.png",
    instructor: "Mike Torres",
    category: "Frontend",
    level: "beginner",
    duration: 14,
    lessons: 72,
    enrolled: 19800,
    rating: 4.7,
    tags: ["JavaScript", "Frontend", "Beginner"],
    createdAt: "2025-04-20",
    section: "beginner",
  },
  {
    id: "10",
    slug: "git-github-basics",
    title: "Git & GitHub for Beginners",
    description:
      "Version control made simple. Learn to collaborate like a professional developer.",
    thumbnail: "/images/courses/git-github.png",
    instructor: "Sarah Kim",
    category: "Tools",
    level: "beginner",
    duration: 6,
    lessons: 30,
    enrolled: 14500,
    rating: 4.6,
    tags: ["Beginner"],
    createdAt: "2025-03-10",
    section: "beginner",
  },

  // ── Deep Dives ──
  {
    id: "11",
    slug: "system-design-fundamentals",
    title: "System Design Fundamentals",
    description:
      "Design scalable systems. Load balancers, caching, databases, and microservices.",
    thumbnail: "/images/courses/system-design.png",
    instructor: "Alex Xu",
    category: "Backend",
    level: "advanced",
    duration: 22,
    lessons: 88,
    enrolled: 7650,
    rating: 4.8,
    tags: ["Backend", "Advanced"],
    createdAt: "2025-07-01",
    section: "deepdive",
  },
  {
    id: "12",
    slug: "react-performance-patterns",
    title: "React Performance Patterns",
    description:
      "Optimize renders, memoize correctly, and build blazing-fast React applications.",
    thumbnail: "/images/courses/react-perf.png",
    instructor: "Dan Abramov",
    category: "Frontend",
    level: "advanced",
    duration: 10,
    lessons: 48,
    enrolled: 5430,
    rating: 4.9,
    tags: ["React", "Frontend", "Advanced"],
    createdAt: "2025-06-15",
    section: "deepdive",
  },
  {
    id: "13",
    slug: "machine-learning-with-python",
    title: "Machine Learning with Python",
    description:
      "From linear regression to neural networks — build and deploy ML models.",
    thumbnail: "/images/courses/ml-python.png",
    instructor: "Dr. Lisa Wang",
    category: "AI / ML",
    level: "advanced",
    duration: 28,
    lessons: 142,
    enrolled: 8900,
    rating: 4.8,
    tags: ["Python", "AI / ML", "Data Science", "Advanced"],
    createdAt: "2025-05-05",
    section: "deepdive",
  },
  {
    id: "14",
    slug: "graphql-api-mastery",
    title: "GraphQL API Mastery",
    description:
      "Build modern APIs with GraphQL, Apollo, and real-time subscriptions.",
    thumbnail: "/images/courses/graphql-mastery.png",
    instructor: "Lee Byron",
    category: "Backend",
    level: "advanced",
    duration: 16,
    lessons: 72,
    enrolled: 4200,
    rating: 4.7,
    tags: ["Backend", "Node.js", "Advanced"],
    createdAt: "2025-04-01",
    section: "deepdive",
  },

  // ── Extra courses (appear only in "All courses" grid) ──
  {
    id: "15",
    slug: "react-native-mobile",
    title: "React Native — Build Mobile Apps",
    description: "Ship iOS and Android apps from a single React codebase.",
    thumbnail: "/images/courses/react-native.png",
    instructor: "James Clarke",
    category: "Mobile",
    level: "intermediate",
    duration: 20,
    lessons: 96,
    enrolled: 7200,
    rating: 4.6,
    tags: ["React", "JavaScript", "Intermediate"],
    createdAt: "2025-08-01",
  },
  {
    id: "16",
    slug: "devops-essentials",
    title: "DevOps Essentials — CI/CD & Docker",
    description:
      "Automate builds, testing, and deployment with modern DevOps tools.",
    thumbnail: "/images/courses/devops.png",
    instructor: "Kate Nguyen",
    category: "DevOps",
    level: "intermediate",
    duration: 14,
    lessons: 62,
    enrolled: 5100,
    rating: 4.5,
    tags: ["Backend", "Intermediate"],
    createdAt: "2025-07-20",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const levelMeta: Record<Level, { label: string; bars: number }> = {
  beginner: { label: "BEGINNER", bars: 1 },
  intermediate: { label: "INTERMEDIATE", bars: 2 },
  advanced: { label: "ADVANCED", bars: 3 },
};

const fallbackThumbnail = "/images/courses/placeholder.svg";

function LevelBadge({ level }: { level: Level }) {
  const { label, bars } = levelMeta[level];
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted/60 text-muted-foreground"
    >
      <span className="inline-flex items-end gap-[2px] h-3">
        <span
          className={`w-[3px] rounded-sm ${
            bars >= 1 ? "bg-current" : "bg-muted-foreground/30"
          }`}
          style={{ height: "40%" }}
        />
        <span
          className={`w-[3px] rounded-sm ${
            bars >= 2 ? "bg-current" : "bg-muted-foreground/30"
          }`}
          style={{ height: "65%" }}
        />
        <span
          className={`w-[3px] rounded-sm ${
            bars >= 3 ? "bg-current" : "bg-muted-foreground/30"
          }`}
          style={{ height: "90%" }}
        />
      </span>
      {label}
    </Badge>
  );
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
) => {
  const img = event.currentTarget;
  img.onerror = null;
  img.src = fallbackThumbnail;
};

/* ------------------------------------------------------------------ */
/*  Course Card (horizontal scroll variant)                            */
/* ------------------------------------------------------------------ */

function CourseCard({ course }: { course: Course }) {
  const { t } = useLanguage();
  const isEnrolled = course.progress !== undefined;
  return (
    <Link
      href={`/learn/${course.slug}`}
      className="group snap-start h-full min-w-[240px] sm:min-w-[260px] lg:min-w-[280px]"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="280px"
            unoptimized
            onError={handleImageError}
          />
          {/* Rating badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {course.rating}
          </div>
          {/* Progress bar overlay */}
          {isEnrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/40">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {course.category}
          </span>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          {/* Meta */}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {course.duration}h
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {course.lessons}{" "}
              {t("learn.lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {formatNumber(course.enrolled)}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <LevelBadge level={course.level} />
            {isEnrolled && (
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold border-primary/40 text-primary"
              >
                {course.progress}% {t("learn.complete")}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Course Card (grid variant)                                         */
/* ------------------------------------------------------------------ */

function CourseGridCard({ course }: { course: Course }) {
  const { t } = useLanguage();
  const isEnrolled = course.progress !== undefined;
  return (
    <Link href={`/learn/${course.slug}`} className="group">
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg h-full flex flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
            onError={handleImageError}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {course.rating}
          </div>
          {isEnrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/40">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {course.category}
          </span>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.description}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {course.duration}h
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {course.lessons}{" "}
              {t("learn.lessons")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {formatNumber(course.enrolled)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <LevelBadge level={course.level} />
            {isEnrolled && (
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold border-primary/40 text-primary"
              >
                {course.progress}% {t("learn.complete")}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal-scroll curated section                                  */
/* ------------------------------------------------------------------ */

function CuratedRow({
  section,
  items,
}: {
  section: CuratedSection;
  items: Course[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = Math.max(scrollRef.current.clientWidth - 80, 240);
    scrollRef.current.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>{section.emoji}</span>
          {section.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {section.description}
        </p>
      </div>

      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 shadow-md backdrop-blur opacity-0 transition-opacity group-hover/row:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-2"
        >
          {items.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 shadow-md backdrop-blur opacity-0 transition-opacity group-hover/row:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter tag bar                                                     */
/* ------------------------------------------------------------------ */

function TagBar({
  tags,
  active,
  onToggle,
}: {
  tags: string[];
  active: string;
  onToggle: (tag: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => scroll("left")}
        className="flex-shrink-0 rounded-full border border-border bg-background p-1.5 shadow-sm hover:bg-muted transition-colors"
        aria-label="Scroll tags left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-none"
      >
        {tags.map((tag) => {
          const isActive = active === tag;
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-foreground hover:bg-muted"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => scroll("right")}
        className="flex-shrink-0 rounded-full border border-border bg-background p-1.5 shadow-sm hover:bg-muted transition-colors"
        aria-label="Scroll tags right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LearnPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [sortBy, setSortBy] = useState<"popular" | "latest" | "rating" | "a-z">(
    "popular",
  );

  const toggleTag = (tag: string) => setActiveTag(tag);

  const matchesFilter = (course: Course) => {
    if (
      searchQuery &&
      !course.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !course.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (activeTag !== "All") {
      const courseTags = course.tags.map((t) => t.toLowerCase());
      if (!courseTags.includes(activeTag.toLowerCase())) return false;
    }
    return true;
  };

  // Curated rows
  const curatedItems = useMemo(
    () =>
      curatedSections.map((section) => ({
        section,
        items: courses
          .filter((c) => c.section === section.id)
          .filter(matchesFilter),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, activeTag],
  );

  // All courses sorted
  const allCourses = useMemo(() => {
    const filtered = courses.filter(matchesFilter);
    switch (sortBy) {
      case "popular":
        return [...filtered].sort((a, b) => b.enrolled - a.enrolled);
      case "latest":
        return [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "rating":
        return [...filtered].sort((a, b) => b.rating - a.rating);
      case "a-z":
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return filtered;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTag, sortBy]);

  return (
    <div className="space-y-10 pb-16">
      {/* ── Skill Areas ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🎯</span> {t("learn.exploreByTopic")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillAreas.map((area) => (
            <Link key={area.id} href={area.href} className="group">
              <Card className="border-border overflow-hidden transition-shadow hover:shadow-lg h-full">
                <CardContent className="p-0">
                  <div
                    className={`bg-gradient-to-br ${area.color} p-5 text-white`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="rounded-lg bg-white/20 p-2">
                        {area.icon}
                      </div>
                      <ChevronRight className="h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1" />
                    </div>
                    <h3 className="font-bold text-base">{area.title}</h3>
                    <p className="text-sm text-white/80 mt-1 line-clamp-2">
                      {area.description}
                    </p>
                    <p className="mt-3 text-xs font-medium text-white/90">
                      {area.courseCount} {t("learn.courses")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Learning Paths ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🗺️</span> {t("learn.learningPaths")}
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {t("learn.structuredJourneys")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {learningPaths.map((path) => (
            <Link key={path.id} href={`/learn/${path.slug}`} className="group">
              <Card className="border-border overflow-hidden transition-shadow hover:shadow-lg h-full">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg bg-gradient-to-br ${path.color} p-2.5 text-white flex-shrink-0`}
                    >
                      {path.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {path.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {path.description}
                      </p>
                    </div>
                    <LevelBadge level={path.level} />
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {path.courseCount}{" "}
                      {t("learn.courses")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {path.totalHours}h total
                    </span>
                  </div>

                  {path.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          {t("learn.progress")}
                        </span>
                        <span className="font-medium">{path.progress}%</span>
                      </div>
                      <Progress value={path.progress} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Search + Filter Tags ── */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("learn.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <TagBar tags={filterTags} active={activeTag} onToggle={toggleTag} />
      </div>

      {/* ── Curated Sections ── */}
      {curatedItems.map(({ section, items }) => (
        <CuratedRow key={section.id} section={section} items={items} />
      ))}

      {/* ── All Courses Grid ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📚</span> {t("learn.allCourses")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("learn.browseFullCatalog")}
            </p>
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">{t("learn.mostPopular")}</SelectItem>
              <SelectItem value="latest">{t("learn.latest")}</SelectItem>
              <SelectItem value="rating">{t("learn.highestRated")}</SelectItem>
              <SelectItem value="a-z">{t("learn.aToZ")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {allCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {allCourses.map((c) => (
              <CourseGridCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("learn.noCoursesFound")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
