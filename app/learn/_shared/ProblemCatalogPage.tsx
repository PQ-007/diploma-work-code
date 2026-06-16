"use client";

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
import { CheckCircle2, Circle, Lock, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export type Difficulty = "easy" | "medium" | "hard";
export type Status = "solved" | "attempted" | "unsolved";

export interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  acceptance: number;
  status: Status;
  tags: string[];
  category: string;
  isPremium?: boolean;
}

export interface CategoryStats {
  name: string;
  icon: ReactNode;
  total: number;
  solved: number;
  color: string;
}

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
/*  Template                                                           */
/* ------------------------------------------------------------------ */

export interface ProblemCatalogPageProps {
  /** Page heading, e.g. "Algorithms". */
  title: string;
  /** Subheading paragraph shown under the title. */
  description: string;
  /** Icon element rendered beside the title. */
  headerIcon: ReactNode;
  /** Route prefix for problem links, e.g. "/learn/algorithm". */
  basePath: string;
  categories: CategoryStats[];
  problems: Problem[];
}

/**
 * Shared catalog page for problem-based learning sections (algorithms, data
 * structures, …). Renders progress overview, category cards, filters and a
 * problem table. Behaviour is identical across sections; only the data and
 * header differ.
 */
export default function ProblemCatalogPage({
  title,
  description,
  headerIcon,
  basePath,
  categories,
  problems,
}: ProblemCatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "id" | "title" | "difficulty" | "acceptance"
  >("id");

  const totalSolved = problems.filter((p) => p.status === "solved").length;
  const totalAttempted = problems.filter(
    (p) => p.status === "attempted",
  ).length;
  const easySolved = problems.filter(
    (p) => p.difficulty === "easy" && p.status === "solved",
  ).length;
  const easyTotal = problems.filter((p) => p.difficulty === "easy").length;
  const mediumSolved = problems.filter(
    (p) => p.difficulty === "medium" && p.status === "solved",
  ).length;
  const mediumTotal = problems.filter((p) => p.difficulty === "medium").length;
  const hardSolved = problems.filter(
    (p) => p.difficulty === "hard" && p.status === "solved",
  ).length;
  const hardTotal = problems.filter((p) => p.difficulty === "hard").length;

  const filtered = useMemo(() => {
    const list = problems.filter((p) => {
      if (
        searchQuery &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (
        activeCategory !== "All" &&
        !p.tags.includes(activeCategory) &&
        p.category !== activeCategory
      )
        return false;
      if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter)
        return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
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
  }, [
    problems,
    searchQuery,
    activeCategory,
    difficultyFilter,
    statusFilter,
    sortBy,
  ]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {headerIcon}
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* ── Progress Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-5 flex flex-col items-center justify-center gap-3">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  strokeWidth="10"
                  className="stroke-muted/30"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  strokeWidth="10"
                  className="stroke-emerald-500"
                  strokeDasharray={`${(totalSolved / problems.length) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{totalSolved}</span>
                <span className="text-[10px] text-muted-foreground">
                  / {problems.length} solved
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {totalAttempted} attempted
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold">Difficulty Breakdown</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-500 font-medium">Easy</span>
                  <span className="text-muted-foreground">
                    {easySolved}/{easyTotal}
                  </span>
                </div>
                <Progress
                  value={(easySolved / easyTotal) * 100}
                  className="h-2 [&>div]:bg-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-500 font-medium">Medium</span>
                  <span className="text-muted-foreground">
                    {mediumSolved}/{mediumTotal}
                  </span>
                </div>
                <Progress
                  value={(mediumSolved / mediumTotal) * 100}
                  className="h-2 [&>div]:bg-amber-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-rose-500 font-medium">Hard</span>
                  <span className="text-muted-foreground">
                    {hardSolved}/{hardTotal}
                  </span>
                </div>
                <Progress
                  value={(hardSolved / hardTotal) * 100}
                  className="h-2 [&>div]:bg-rose-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Category Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() =>
              setActiveCategory(activeCategory === cat.name ? "All" : cat.name)
            }
            className={`rounded-xl border p-3 text-left transition-colors ${
              activeCategory === cat.name
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${cat.color}`}
            >
              {cat.icon}
              {cat.name}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg font-bold">{cat.solved}</span>
              <span className="text-xs text-muted-foreground">
                / {cat.total}
              </span>
            </div>
            <Progress
              value={(cat.solved / cat.total) * 100}
              className="h-1 mt-1.5"
            />
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
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

      {/* ── Problem Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[100px]">Difficulty</TableHead>
                <TableHead className="w-[100px] text-right">
                  Acceptance
                </TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((problem, idx) => (
                <TableRow
                  key={problem.id}
                  className={`cursor-pointer transition-colors ${
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  }`}
                >
                  <TableCell>
                    <StatusIcon status={problem.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {problem.id}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`${basePath}/${problem.slug}`}
                      className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {problem.title}
                      {problem.isPremium && (
                        <Lock className="h-3 w-3 text-amber-500" />
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${difficultyConfig[problem.difficulty].className}`}
                    >
                      {difficultyConfig[problem.difficulty].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {problem.acceptance}%
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {problem.tags.length > 2 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 rounded-full"
                        >
                          +{problem.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No problems found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Footer info ── */}
      <div className="text-center text-xs text-muted-foreground">
        Showing {filtered.length} of {problems.length} problems
      </div>
    </div>
  );
}
