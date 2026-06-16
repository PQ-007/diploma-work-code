"use client";

/**
 * @deprecated FutureHub refocus (Phase 1): the Learn section is mock/placeholder
 * content with no backend and is slated for removal. It is NOT one of the four
 * cores (Articles · Projects · Dictionary · Discussions). Do not build on this.
 * See futurehub-docs/docs/features/deprecated.md.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Link2,
  Lock,
  Monitor,
  PenTool,
  Search,
  Star,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Level = "beginner" | "intermediate" | "advanced";
type ResourceStatus = "completed" | "in-progress" | "not-started";
type Format =
  | "article"
  | "video"
  | "cheatsheet"
  | "interactive"
  | "documentation"
  | "course";

interface Resource {
  id: number;
  title: string;
  slug: string;
  level: Level;
  status: ResourceStatus;
  format: Format;
  tags: string[];
  estimatedTime: string;
  rating: number;
  isPremium?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  completed: number;
  color: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const categories: Category[] = [
  {
    id: "fundamentals",
    name: "CS Fundamentals",
    icon: <GraduationCap className="h-5 w-5" />,
    count: 12,
    completed: 9,
    color: "from-blue-500 to-indigo-600",
    description: "Core computer science concepts and theory",
  },
  {
    id: "cheatsheets",
    name: "Cheat Sheets",
    icon: <FileText className="h-5 w-5" />,
    count: 18,
    completed: 14,
    color: "from-emerald-500 to-teal-600",
    description: "Quick-reference guides for languages, frameworks & tools",
  },
  {
    id: "tutorials",
    name: "Guided Tutorials",
    icon: <Monitor className="h-5 w-5" />,
    count: 15,
    completed: 6,
    color: "from-purple-500 to-violet-600",
    description: "Step-by-step build-along projects",
  },
  {
    id: "interviews",
    name: "Interview Prep",
    icon: <PenTool className="h-5 w-5" />,
    count: 20,
    completed: 8,
    color: "from-amber-500 to-orange-600",
    description: "Patterns, strategies, and mock questions",
  },
  {
    id: "videos",
    name: "Video Courses",
    icon: <Video className="h-5 w-5" />,
    count: 10,
    completed: 3,
    color: "from-rose-500 to-pink-600",
    description: "Curated video playlists and lectures",
  },
  {
    id: "docs",
    name: "Official Docs",
    icon: <BookMarked className="h-5 w-5" />,
    count: 8,
    completed: 8,
    color: "from-cyan-500 to-sky-600",
    description: "Links to official documentation you should know",
  },
];

const resources: Resource[] = [
  // CS Fundamentals
  {
    id: 1,
    title: "How the Internet Works",
    slug: "how-internet-works",
    level: "beginner",
    status: "completed",
    format: "article",
    tags: ["Networking"],
    estimatedTime: "15 min",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Big-O Notation Explained",
    slug: "big-o-explained",
    level: "beginner",
    status: "completed",
    format: "article",
    tags: ["Complexity"],
    estimatedTime: "20 min",
    rating: 4.9,
  },
  {
    id: 3,
    title: "Operating Systems Crash Course",
    slug: "os-crash-course",
    level: "intermediate",
    status: "completed",
    format: "video",
    tags: ["OS"],
    estimatedTime: "45 min",
    rating: 4.7,
  },
  {
    id: 4,
    title: "Intro to Databases & SQL",
    slug: "intro-databases",
    level: "beginner",
    status: "completed",
    format: "interactive",
    tags: ["Databases"],
    estimatedTime: "30 min",
    rating: 4.6,
  },
  {
    id: 5,
    title: "Compiler Design Basics",
    slug: "compiler-design",
    level: "advanced",
    status: "not-started",
    format: "course",
    tags: ["Compilers"],
    estimatedTime: "3 hrs",
    rating: 4.5,
    isPremium: true,
  },

  // Cheat Sheets
  {
    id: 6,
    title: "Python Cheat Sheet",
    slug: "python-cheatsheet",
    level: "beginner",
    status: "completed",
    format: "cheatsheet",
    tags: ["Python"],
    estimatedTime: "5 min",
    rating: 4.9,
  },
  {
    id: 7,
    title: "Git Commands Reference",
    slug: "git-cheatsheet",
    level: "beginner",
    status: "completed",
    format: "cheatsheet",
    tags: ["Git"],
    estimatedTime: "5 min",
    rating: 4.8,
  },
  {
    id: 8,
    title: "JavaScript ES6+ Cheat Sheet",
    slug: "js-es6-cheatsheet",
    level: "beginner",
    status: "completed",
    format: "cheatsheet",
    tags: ["JavaScript"],
    estimatedTime: "5 min",
    rating: 4.7,
  },
  {
    id: 9,
    title: "SQL Queries Quick Ref",
    slug: "sql-cheatsheet",
    level: "beginner",
    status: "completed",
    format: "cheatsheet",
    tags: ["SQL"],
    estimatedTime: "5 min",
    rating: 4.8,
  },
  {
    id: 10,
    title: "Docker Commands Cheat Sheet",
    slug: "docker-cheatsheet",
    level: "intermediate",
    status: "completed",
    format: "cheatsheet",
    tags: ["DevOps"],
    estimatedTime: "5 min",
    rating: 4.6,
  },
  {
    id: 11,
    title: "Regex Cheat Sheet",
    slug: "regex-cheatsheet",
    level: "intermediate",
    status: "completed",
    format: "cheatsheet",
    tags: ["Tools"],
    estimatedTime: "5 min",
    rating: 4.5,
  },
  {
    id: 12,
    title: "CSS Flexbox & Grid Guide",
    slug: "css-layout-cheatsheet",
    level: "beginner",
    status: "completed",
    format: "cheatsheet",
    tags: ["CSS"],
    estimatedTime: "10 min",
    rating: 4.7,
  },

  // Guided Tutorials
  {
    id: 13,
    title: "Build a REST API with Express",
    slug: "build-rest-api",
    level: "intermediate",
    status: "completed",
    format: "interactive",
    tags: ["Node.js", "API"],
    estimatedTime: "2 hrs",
    rating: 4.8,
  },
  {
    id: 14,
    title: "Build a Chat App with WebSockets",
    slug: "websocket-chat",
    level: "intermediate",
    status: "in-progress",
    format: "interactive",
    tags: ["WebSocket"],
    estimatedTime: "3 hrs",
    rating: 4.6,
  },
  {
    id: 15,
    title: "Full-Stack Next.js E-Commerce",
    slug: "nextjs-ecommerce",
    level: "advanced",
    status: "not-started",
    format: "course",
    tags: ["Next.js", "React"],
    estimatedTime: "8 hrs",
    rating: 4.9,
  },
  {
    id: 16,
    title: "Build a CLI Tool with Go",
    slug: "go-cli-tool",
    level: "intermediate",
    status: "not-started",
    format: "interactive",
    tags: ["Go"],
    estimatedTime: "2 hrs",
    rating: 4.5,
  },

  // Interview Prep
  {
    id: 17,
    title: "Top 50 Coding Patterns",
    slug: "coding-patterns",
    level: "intermediate",
    status: "in-progress",
    format: "article",
    tags: ["Patterns"],
    estimatedTime: "1 hr",
    rating: 4.9,
  },
  {
    id: 18,
    title: "System Design Interview Guide",
    slug: "system-design-guide",
    level: "advanced",
    status: "not-started",
    format: "article",
    tags: ["System Design"],
    estimatedTime: "2 hrs",
    rating: 4.8,
    isPremium: true,
  },
  {
    id: 19,
    title: "Behavioral Interview Questions",
    slug: "behavioral-questions",
    level: "beginner",
    status: "completed",
    format: "article",
    tags: ["Soft Skills"],
    estimatedTime: "30 min",
    rating: 4.5,
  },
  {
    id: 20,
    title: "Mock Interview Simulator",
    slug: "mock-interview-sim",
    level: "intermediate",
    status: "not-started",
    format: "interactive",
    tags: ["Practice"],
    estimatedTime: "1 hr",
    rating: 4.7,
  },

  // Video Courses
  {
    id: 21,
    title: "Data Structures Visual Guide",
    slug: "ds-visual-guide",
    level: "beginner",
    status: "completed",
    format: "video",
    tags: ["Data Structures"],
    estimatedTime: "4 hrs",
    rating: 4.8,
  },
  {
    id: 22,
    title: "Advanced React Patterns",
    slug: "react-patterns-video",
    level: "advanced",
    status: "in-progress",
    format: "video",
    tags: ["React"],
    estimatedTime: "6 hrs",
    rating: 4.7,
    isPremium: true,
  },
  {
    id: 23,
    title: "Introduction to Machine Learning",
    slug: "intro-ml-video",
    level: "intermediate",
    status: "not-started",
    format: "video",
    tags: ["ML", "AI"],
    estimatedTime: "5 hrs",
    rating: 4.6,
  },

  // Official Docs
  {
    id: 24,
    title: "React Documentation",
    slug: "react-docs",
    level: "beginner",
    status: "completed",
    format: "documentation",
    tags: ["React"],
    estimatedTime: "Ref",
    rating: 5.0,
  },
  {
    id: 25,
    title: "MDN Web Docs – JavaScript",
    slug: "mdn-javascript",
    level: "beginner",
    status: "completed",
    format: "documentation",
    tags: ["JavaScript"],
    estimatedTime: "Ref",
    rating: 5.0,
  },
  {
    id: 26,
    title: "TypeScript Handbook",
    slug: "ts-handbook",
    level: "intermediate",
    status: "completed",
    format: "documentation",
    tags: ["TypeScript"],
    estimatedTime: "Ref",
    rating: 4.9,
  },
  {
    id: 27,
    title: "Python Official Docs",
    slug: "python-docs",
    level: "beginner",
    status: "completed",
    format: "documentation",
    tags: ["Python"],
    estimatedTime: "Ref",
    rating: 4.9,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const levelConfig: Record<Level, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "text-emerald-500" },
  intermediate: { label: "Intermediate", className: "text-amber-500" },
  advanced: { label: "Advanced", className: "text-rose-500" },
};

const formatConfig: Record<
  Format,
  { label: string; icon: React.ReactNode; className: string }
> = {
  article: {
    label: "Article",
    icon: <FileText className="h-3 w-3" />,
    className: "bg-blue-500/10 text-blue-500",
  },
  video: {
    label: "Video",
    icon: <Video className="h-3 w-3" />,
    className: "bg-red-500/10 text-red-500",
  },
  cheatsheet: {
    label: "Cheat Sheet",
    icon: <Layers className="h-3 w-3" />,
    className: "bg-emerald-500/10 text-emerald-500",
  },
  interactive: {
    label: "Interactive",
    icon: <Monitor className="h-3 w-3" />,
    className: "bg-purple-500/10 text-purple-500",
  },
  documentation: {
    label: "Docs",
    icon: <BookMarked className="h-3 w-3" />,
    className: "bg-cyan-500/10 text-cyan-500",
  },
  course: {
    label: "Course",
    icon: <GraduationCap className="h-3 w-3" />,
    className: "bg-amber-500/10 text-amber-500",
  },
};

function StatusIcon({ status }: { status: ResourceStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "in-progress":
      return (
        <div className="h-4 w-4 rounded-full border-2 border-amber-500 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        </div>
      );
    case "not-started":
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"id" | "title" | "level" | "rating">(
    "id",
  );

  const totalCompleted = resources.filter(
    (r) => r.status === "completed",
  ).length;
  const totalResources = resources.length;

  const filtered = useMemo(() => {
    let list = resources.filter((r) => {
      if (
        searchQuery &&
        !r.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (levelFilter !== "all" && r.level !== levelFilter) return false;
      if (formatFilter !== "all" && r.format !== formatFilter) return false;
      // Category filter: map resource index ranges to categories
      if (selectedCategory !== "all") {
        const catMap: Record<string, number[]> = {
          fundamentals: [1, 2, 3, 4, 5],
          cheatsheets: [6, 7, 8, 9, 10, 11, 12],
          tutorials: [13, 14, 15, 16],
          interviews: [17, 18, 19, 20],
          videos: [21, 22, 23],
          docs: [24, 25, 26, 27],
        };
        const ids = catMap[selectedCategory] ?? [];
        if (!ids.includes(r.id)) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "title":
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case "level": {
        const order: Record<Level, number> = {
          beginner: 0,
          intermediate: 1,
          advanced: 2,
        };
        return [...list].sort((a, b) => order[a.level] - order[b.level]);
      }
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, levelFilter, formatFilter, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Learning Resources
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Curated articles, cheat sheets, tutorials, video courses, and
          documentation to supercharge your learning.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalResources}</p>
              <p className="text-xs text-muted-foreground">Resources</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(
                  resources.reduce((sum, r) => sum + r.rating, 0) /
                  resources.length
                ).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Category Cards ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? "all" : cat.id,
                )
              }
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedCategory === cat.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`rounded-lg bg-gradient-to-br ${cat.color} p-2 text-white`}
                >
                  {cat.icon}
                </div>
                <span className="font-semibold text-sm">{cat.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                {cat.description}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm font-bold">{cat.completed}</span>
                <span className="text-[11px] text-muted-foreground">
                  / {cat.count} completed
                </span>
              </div>
              <Progress
                value={(cat.completed / cat.count) * 100}
                className="h-1.5"
              />
            </button>
          ))}
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="cheatsheet">Cheat Sheets</SelectItem>
            <SelectItem value="interactive">Interactive</SelectItem>
            <SelectItem value="documentation">Docs</SelectItem>
            <SelectItem value="course">Courses</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as typeof sortBy)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id"># Number</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="level">Level</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Resources Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[110px]">Format</TableHead>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[80px] text-right">Time</TableHead>
                <TableHead className="w-[80px] text-right">Rating</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((res, idx) => (
                <TableRow
                  key={res.id}
                  className={`cursor-pointer transition-colors ${
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  }`}
                >
                  <TableCell>
                    <StatusIcon status={res.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {res.id}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/learn/resources/${res.slug}`}
                      className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {res.title}
                      {res.isPremium && (
                        <Lock className="h-3 w-3 text-amber-500" />
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${formatConfig[res.format].className}`}
                    >
                      {formatConfig[res.format].icon}
                      {formatConfig[res.format].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${levelConfig[res.level].className}`}
                    >
                      {levelConfig[res.level].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {res.estimatedTime}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      {res.rating}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {res.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No resources found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Showing {filtered.length} of {resources.length} resources
      </div>
    </div>
  );
}
