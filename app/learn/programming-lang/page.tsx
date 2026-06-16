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
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code,
  FileCode,
  Flame,
  Lock,
  Search,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Difficulty = "easy" | "medium" | "hard";
type Status = "solved" | "attempted" | "unsolved";

interface Exercise {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  acceptance: number;
  status: Status;
  tags: string[];
  language: string;
  isPremium?: boolean;
}

interface Language {
  id: string;
  name: string;
  icon: string;
  exerciseCount: number;
  solved: number;
  color: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const languages: Language[] = [
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    exerciseCount: 45,
    solved: 28,
    color: "from-yellow-500 to-blue-500",
    description: "Versatile language for web, data science, and automation",
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: "⚡",
    exerciseCount: 42,
    solved: 22,
    color: "from-yellow-400 to-yellow-600",
    description:
      "The language of the web — browsers, servers, and everything between",
  },
  {
    id: "typescript",
    name: "TypeScript",
    icon: "🔷",
    exerciseCount: 30,
    solved: 15,
    color: "from-blue-500 to-blue-700",
    description: "JavaScript with types — build robust, scalable applications",
  },
  {
    id: "java",
    name: "Java",
    icon: "☕",
    exerciseCount: 38,
    solved: 12,
    color: "from-red-500 to-orange-500",
    description: "Enterprise-grade language for Android, backends, and more",
  },
  {
    id: "cpp",
    name: "C++",
    icon: "⚙️",
    exerciseCount: 35,
    solved: 8,
    color: "from-blue-600 to-indigo-600",
    description:
      "Performance-critical systems, game engines, and competitive programming",
  },
  {
    id: "go",
    name: "Go",
    icon: "🔵",
    exerciseCount: 25,
    solved: 5,
    color: "from-cyan-500 to-blue-400",
    description: "Simple and efficient — built for modern cloud infrastructure",
  },
  {
    id: "rust",
    name: "Rust",
    icon: "🦀",
    exerciseCount: 20,
    solved: 3,
    color: "from-orange-600 to-red-600",
    description:
      "Memory safety without garbage collection — the future of systems programming",
  },
  {
    id: "sql",
    name: "SQL",
    icon: "🗄️",
    exerciseCount: 28,
    solved: 18,
    color: "from-emerald-500 to-teal-500",
    description: "Query, manipulate, and manage relational databases",
  },
];

const exercises: Exercise[] = [
  // Python
  {
    id: 1,
    title: "Hello World & Variables",
    slug: "hello-world-variables",
    difficulty: "easy",
    acceptance: 97,
    status: "solved",
    tags: ["Basics"],
    language: "python",
  },
  {
    id: 2,
    title: "String Manipulation",
    slug: "string-manipulation",
    difficulty: "easy",
    acceptance: 92,
    status: "solved",
    tags: ["Strings"],
    language: "python",
  },
  {
    id: 3,
    title: "List Comprehensions",
    slug: "list-comprehensions",
    difficulty: "easy",
    acceptance: 88,
    status: "solved",
    tags: ["Lists"],
    language: "python",
  },
  {
    id: 4,
    title: "Dictionary Operations",
    slug: "dictionary-operations",
    difficulty: "easy",
    acceptance: 85,
    status: "solved",
    tags: ["Dicts"],
    language: "python",
  },
  {
    id: 5,
    title: "Functions & Decorators",
    slug: "functions-decorators",
    difficulty: "medium",
    acceptance: 68,
    status: "attempted",
    tags: ["Functions"],
    language: "python",
  },
  {
    id: 6,
    title: "OOP: Classes & Inheritance",
    slug: "oop-classes",
    difficulty: "medium",
    acceptance: 62,
    status: "solved",
    tags: ["OOP"],
    language: "python",
  },
  {
    id: 7,
    title: "File I/O & Error Handling",
    slug: "file-io",
    difficulty: "medium",
    acceptance: 70,
    status: "solved",
    tags: ["I/O"],
    language: "python",
  },
  {
    id: 8,
    title: "Generators & Iterators",
    slug: "generators-iterators",
    difficulty: "medium",
    acceptance: 55,
    status: "attempted",
    tags: ["Advanced"],
    language: "python",
  },
  {
    id: 9,
    title: "Async/Await Concurrency",
    slug: "async-await-python",
    difficulty: "hard",
    acceptance: 42,
    status: "unsolved",
    tags: ["Async"],
    language: "python",
  },
  {
    id: 10,
    title: "Metaclasses & Descriptors",
    slug: "metaclasses",
    difficulty: "hard",
    acceptance: 35,
    status: "unsolved",
    tags: ["Advanced"],
    language: "python",
    isPremium: true,
  },

  // JavaScript
  {
    id: 11,
    title: "Variables, Types & Coercion",
    slug: "js-variables-types",
    difficulty: "easy",
    acceptance: 94,
    status: "solved",
    tags: ["Basics"],
    language: "javascript",
  },
  {
    id: 12,
    title: "Array Methods",
    slug: "js-array-methods",
    difficulty: "easy",
    acceptance: 90,
    status: "solved",
    tags: ["Arrays"],
    language: "javascript",
  },
  {
    id: 13,
    title: "Closures & Scope",
    slug: "closures-scope",
    difficulty: "medium",
    acceptance: 62,
    status: "solved",
    tags: ["Functions"],
    language: "javascript",
  },
  {
    id: 14,
    title: "Promises & Async/Await",
    slug: "promises-async",
    difficulty: "medium",
    acceptance: 58,
    status: "attempted",
    tags: ["Async"],
    language: "javascript",
  },
  {
    id: 15,
    title: "Prototypal Inheritance",
    slug: "prototypal-inheritance",
    difficulty: "medium",
    acceptance: 52,
    status: "unsolved",
    tags: ["OOP"],
    language: "javascript",
  },
  {
    id: 16,
    title: "Event Loop Deep Dive",
    slug: "event-loop",
    difficulty: "hard",
    acceptance: 38,
    status: "unsolved",
    tags: ["Advanced"],
    language: "javascript",
  },
  {
    id: 17,
    title: "DOM Manipulation & Events",
    slug: "dom-manipulation",
    difficulty: "easy",
    acceptance: 86,
    status: "solved",
    tags: ["DOM"],
    language: "javascript",
  },
  {
    id: 18,
    title: "ES6+ Features",
    slug: "es6-features",
    difficulty: "easy",
    acceptance: 88,
    status: "solved",
    tags: ["Modern JS"],
    language: "javascript",
  },

  // TypeScript
  {
    id: 19,
    title: "Basic Types & Interfaces",
    slug: "ts-basic-types",
    difficulty: "easy",
    acceptance: 91,
    status: "solved",
    tags: ["Types"],
    language: "typescript",
  },
  {
    id: 20,
    title: "Generics",
    slug: "ts-generics",
    difficulty: "medium",
    acceptance: 60,
    status: "attempted",
    tags: ["Generics"],
    language: "typescript",
  },
  {
    id: 21,
    title: "Utility Types",
    slug: "ts-utility-types",
    difficulty: "medium",
    acceptance: 55,
    status: "solved",
    tags: ["Types"],
    language: "typescript",
  },
  {
    id: 22,
    title: "Type Guards & Narrowing",
    slug: "type-guards",
    difficulty: "medium",
    acceptance: 58,
    status: "unsolved",
    tags: ["Advanced"],
    language: "typescript",
  },
  {
    id: 23,
    title: "Conditional & Mapped Types",
    slug: "conditional-mapped-types",
    difficulty: "hard",
    acceptance: 35,
    status: "unsolved",
    tags: ["Advanced"],
    language: "typescript",
    isPremium: true,
  },

  // Java
  {
    id: 24,
    title: "Hello Java & Data Types",
    slug: "hello-java",
    difficulty: "easy",
    acceptance: 95,
    status: "solved",
    tags: ["Basics"],
    language: "java",
  },
  {
    id: 25,
    title: "OOP: Abstraction & Polymorphism",
    slug: "java-oop",
    difficulty: "medium",
    acceptance: 64,
    status: "attempted",
    tags: ["OOP"],
    language: "java",
  },
  {
    id: 26,
    title: "Collections Framework",
    slug: "java-collections",
    difficulty: "medium",
    acceptance: 60,
    status: "unsolved",
    tags: ["Collections"],
    language: "java",
  },
  {
    id: 27,
    title: "Streams & Lambda Expressions",
    slug: "java-streams",
    difficulty: "medium",
    acceptance: 52,
    status: "unsolved",
    tags: ["Modern Java"],
    language: "java",
  },
  {
    id: 28,
    title: "Multithreading Basics",
    slug: "java-multithreading",
    difficulty: "hard",
    acceptance: 40,
    status: "unsolved",
    tags: ["Concurrency"],
    language: "java",
  },

  // C++
  {
    id: 29,
    title: "Pointers & References",
    slug: "cpp-pointers",
    difficulty: "medium",
    acceptance: 62,
    status: "solved",
    tags: ["Memory"],
    language: "cpp",
  },
  {
    id: 30,
    title: "STL Containers",
    slug: "stl-containers",
    difficulty: "medium",
    acceptance: 58,
    status: "attempted",
    tags: ["STL"],
    language: "cpp",
  },
  {
    id: 31,
    title: "Templates & SFINAE",
    slug: "cpp-templates",
    difficulty: "hard",
    acceptance: 35,
    status: "unsolved",
    tags: ["Advanced"],
    language: "cpp",
  },

  // Go
  {
    id: 32,
    title: "Goroutines & Channels",
    slug: "goroutines-channels",
    difficulty: "medium",
    acceptance: 60,
    status: "solved",
    tags: ["Concurrency"],
    language: "go",
  },
  {
    id: 33,
    title: "Interfaces & Structs",
    slug: "go-interfaces",
    difficulty: "easy",
    acceptance: 82,
    status: "solved",
    tags: ["Basics"],
    language: "go",
  },

  // SQL
  {
    id: 34,
    title: "SELECT & WHERE Clauses",
    slug: "select-where",
    difficulty: "easy",
    acceptance: 96,
    status: "solved",
    tags: ["Basics"],
    language: "sql",
  },
  {
    id: 35,
    title: "JOINs (INNER, LEFT, RIGHT)",
    slug: "sql-joins",
    difficulty: "medium",
    acceptance: 72,
    status: "solved",
    tags: ["Joins"],
    language: "sql",
  },
  {
    id: 36,
    title: "Subqueries & CTEs",
    slug: "subqueries-ctes",
    difficulty: "medium",
    acceptance: 60,
    status: "attempted",
    tags: ["Advanced"],
    language: "sql",
  },
  {
    id: 37,
    title: "Window Functions",
    slug: "window-functions",
    difficulty: "hard",
    acceptance: 42,
    status: "unsolved",
    tags: ["Advanced"],
    language: "sql",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const difficultyConfig: Record<
  Difficulty,
  { label: string; className: string }
> = {
  easy: { label: "Easy", className: "text-emerald-500" },
  medium: { label: "Medium", className: "text-amber-500" },
  hard: { label: "Hard", className: "text-rose-500" },
};

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case "solved":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "attempted":
      return (
        <div className="h-4 w-4 rounded-full border-2 border-amber-500 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        </div>
      );
    case "unsolved":
      return <Circle className="h-4 w-4 text-muted-foreground/40" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProgrammingLangPage() {
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "id" | "title" | "difficulty" | "acceptance"
  >("id");

  const activeLang = languages.find((l) => l.id === selectedLang);

  const totalSolved = exercises.filter((e) => e.status === "solved").length;
  const totalExercises = exercises.length;

  const filtered = useMemo(() => {
    let list = exercises.filter((e) => {
      if (selectedLang !== "all" && e.language !== selectedLang) return false;
      if (
        searchQuery &&
        !e.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (difficultyFilter !== "all" && e.difficulty !== difficultyFilter)
        return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    });

    switch (sortBy) {
      case "title":
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case "difficulty": {
        const order: Record<Difficulty, number> = {
          easy: 0,
          medium: 1,
          hard: 2,
        };
        return [...list].sort(
          (a, b) => order[a.difficulty] - order[b.difficulty],
        );
      }
      case "acceptance":
        return [...list].sort((a, b) => b.acceptance - a.acceptance);
      default:
        return list;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang, searchQuery, difficultyFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" />
          Programming Languages
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Learn and practice programming languages through interactive exercises
          — from "Hello World" to advanced patterns.
        </p>
      </div>

      {/* ── Overall progress ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <FileCode className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{languages.length}</p>
              <p className="text-xs text-muted-foreground">Languages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSolved}</p>
              <p className="text-xs text-muted-foreground">Solved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-500/10 p-2.5">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalExercises}</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round((totalSolved / totalExercises) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Language Cards ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Choose a Language</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() =>
                setSelectedLang(selectedLang === lang.id ? "all" : lang.id)
              }
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedLang === lang.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{lang.icon}</span>
                <span className="font-semibold text-sm">{lang.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                {lang.description}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm font-bold">{lang.solved}</span>
                <span className="text-[11px] text-muted-foreground">
                  / {lang.exerciseCount} solved
                </span>
              </div>
              <Progress
                value={(lang.solved / lang.exerciseCount) * 100}
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
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="attempted">Attempted</SelectItem>
            <SelectItem value="unsolved">Unsolved</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as typeof sortBy)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id"># Number</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="acceptance">Acceptance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Exercises Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Title</TableHead>
                {selectedLang === "all" && (
                  <TableHead className="w-[110px]">Language</TableHead>
                )}
                <TableHead className="w-[100px]">Difficulty</TableHead>
                <TableHead className="w-[100px] text-right">
                  Acceptance
                </TableHead>
                <TableHead className="hidden md:table-cell">Topic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ex, idx) => (
                <TableRow
                  key={ex.id}
                  className={`cursor-pointer transition-colors ${
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  }`}
                >
                  <TableCell>
                    <StatusIcon status={ex.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {ex.id}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/learn/programming-lang/${ex.slug}`}
                      className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {ex.title}
                      {ex.isPremium && (
                        <Lock className="h-3 w-3 text-amber-500" />
                      )}
                    </Link>
                  </TableCell>
                  {selectedLang === "all" && (
                    <TableCell>
                      <span className="text-xs flex items-center gap-1">
                        {languages.find((l) => l.id === ex.language)?.icon}{" "}
                        {languages.find((l) => l.id === ex.language)?.name}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${difficultyConfig[ex.difficulty].className}`}
                    >
                      {difficultyConfig[ex.difficulty].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {ex.acceptance}%
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {ex.tags.map((tag) => (
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
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No exercises found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Showing {filtered.length} of {exercises.length} exercises
        {activeLang && ` in ${activeLang.name}`}
      </div>
    </div>
  );
}
