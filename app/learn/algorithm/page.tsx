"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Clock,
  Filter,
  Flame,
  Lock,
  Search,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Difficulty = "easy" | "medium" | "hard";
type Status = "solved" | "attempted" | "unsolved";

interface Problem {
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

interface CategoryStats {
  name: string;
  icon: React.ReactNode;
  total: number;
  solved: number;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const categoryTags = [
  "All",
  "Sorting",
  "Searching",
  "Dynamic Programming",
  "Greedy",
  "Divide & Conquer",
  "Backtracking",
  "Graph",
  "String",
  "Math",
  "Recursion",
  "Bit Manipulation",
];

const categories: CategoryStats[] = [
  {
    name: "Sorting",
    icon: <Zap className="h-4 w-4" />,
    total: 24,
    solved: 18,
    color: "text-blue-500",
  },
  {
    name: "Searching",
    icon: <Search className="h-4 w-4" />,
    total: 20,
    solved: 12,
    color: "text-emerald-500",
  },
  {
    name: "Dynamic Programming",
    icon: <Target className="h-4 w-4" />,
    total: 35,
    solved: 8,
    color: "text-purple-500",
  },
  {
    name: "Greedy",
    icon: <Flame className="h-4 w-4" />,
    total: 18,
    solved: 14,
    color: "text-amber-500",
  },
  {
    name: "Graph",
    icon: <BookOpen className="h-4 w-4" />,
    total: 28,
    solved: 6,
    color: "text-rose-500",
  },
  {
    name: "Divide & Conquer",
    icon: <ChevronRight className="h-4 w-4" />,
    total: 15,
    solved: 10,
    color: "text-cyan-500",
  },
];

const problems: Problem[] = [
  // Sorting
  {
    id: 1,
    title: "Bubble Sort Implementation",
    slug: "bubble-sort",
    difficulty: "easy",
    acceptance: 92,
    status: "solved",
    tags: ["Sorting"],
    category: "Sorting",
  },
  {
    id: 2,
    title: "Merge Sort",
    slug: "merge-sort",
    difficulty: "medium",
    acceptance: 74,
    status: "solved",
    tags: ["Sorting", "Divide & Conquer"],
    category: "Sorting",
  },
  {
    id: 3,
    title: "Quick Sort",
    slug: "quick-sort",
    difficulty: "medium",
    acceptance: 68,
    status: "attempted",
    tags: ["Sorting", "Divide & Conquer"],
    category: "Sorting",
  },
  {
    id: 4,
    title: "Counting Sort",
    slug: "counting-sort",
    difficulty: "easy",
    acceptance: 85,
    status: "solved",
    tags: ["Sorting"],
    category: "Sorting",
  },
  {
    id: 5,
    title: "Radix Sort",
    slug: "radix-sort",
    difficulty: "medium",
    acceptance: 61,
    status: "unsolved",
    tags: ["Sorting"],
    category: "Sorting",
  },
  {
    id: 6,
    title: "Heap Sort",
    slug: "heap-sort",
    difficulty: "hard",
    acceptance: 52,
    status: "unsolved",
    tags: ["Sorting"],
    category: "Sorting",
  },

  // Searching
  {
    id: 7,
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "easy",
    acceptance: 88,
    status: "solved",
    tags: ["Searching"],
    category: "Searching",
  },
  {
    id: 8,
    title: "Search in Rotated Sorted Array",
    slug: "search-rotated-array",
    difficulty: "medium",
    acceptance: 59,
    status: "solved",
    tags: ["Searching"],
    category: "Searching",
  },
  {
    id: 9,
    title: "Find First and Last Position",
    slug: "find-first-last",
    difficulty: "medium",
    acceptance: 63,
    status: "attempted",
    tags: ["Searching"],
    category: "Searching",
  },
  {
    id: 10,
    title: "Search a 2D Matrix",
    slug: "search-2d-matrix",
    difficulty: "medium",
    acceptance: 66,
    status: "unsolved",
    tags: ["Searching"],
    category: "Searching",
  },

  // Dynamic Programming
  {
    id: 11,
    title: "Fibonacci Number",
    slug: "fibonacci-number",
    difficulty: "easy",
    acceptance: 94,
    status: "solved",
    tags: ["Dynamic Programming", "Recursion"],
    category: "Dynamic Programming",
  },
  {
    id: 12,
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "easy",
    acceptance: 89,
    status: "solved",
    tags: ["Dynamic Programming"],
    category: "Dynamic Programming",
  },
  {
    id: 13,
    title: "Longest Common Subsequence",
    slug: "longest-common-subsequence",
    difficulty: "medium",
    acceptance: 58,
    status: "attempted",
    tags: ["Dynamic Programming", "String"],
    category: "Dynamic Programming",
  },
  {
    id: 14,
    title: "0/1 Knapsack Problem",
    slug: "01-knapsack",
    difficulty: "medium",
    acceptance: 54,
    status: "unsolved",
    tags: ["Dynamic Programming"],
    category: "Dynamic Programming",
  },
  {
    id: 15,
    title: "Edit Distance",
    slug: "edit-distance",
    difficulty: "hard",
    acceptance: 42,
    status: "unsolved",
    tags: ["Dynamic Programming", "String"],
    category: "Dynamic Programming",
  },
  {
    id: 16,
    title: "Longest Increasing Subsequence",
    slug: "longest-increasing-subsequence",
    difficulty: "medium",
    acceptance: 56,
    status: "unsolved",
    tags: ["Dynamic Programming"],
    category: "Dynamic Programming",
  },
  {
    id: 17,
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "medium",
    acceptance: 51,
    status: "attempted",
    tags: ["Dynamic Programming"],
    category: "Dynamic Programming",
  },

  // Greedy
  {
    id: 18,
    title: "Activity Selection",
    slug: "activity-selection",
    difficulty: "easy",
    acceptance: 87,
    status: "solved",
    tags: ["Greedy"],
    category: "Greedy",
  },
  {
    id: 19,
    title: "Fractional Knapsack",
    slug: "fractional-knapsack",
    difficulty: "medium",
    acceptance: 72,
    status: "solved",
    tags: ["Greedy"],
    category: "Greedy",
  },
  {
    id: 20,
    title: "Huffman Coding",
    slug: "huffman-coding",
    difficulty: "hard",
    acceptance: 45,
    status: "unsolved",
    tags: ["Greedy"],
    category: "Greedy",
    isPremium: true,
  },

  // Graph
  {
    id: 21,
    title: "BFS Traversal",
    slug: "bfs-traversal",
    difficulty: "easy",
    acceptance: 82,
    status: "solved",
    tags: ["Graph"],
    category: "Graph",
  },
  {
    id: 22,
    title: "DFS Traversal",
    slug: "dfs-traversal",
    difficulty: "easy",
    acceptance: 80,
    status: "solved",
    tags: ["Graph"],
    category: "Graph",
  },
  {
    id: 23,
    title: "Dijkstra's Shortest Path",
    slug: "dijkstra-shortest-path",
    difficulty: "medium",
    acceptance: 58,
    status: "attempted",
    tags: ["Graph", "Greedy"],
    category: "Graph",
  },
  {
    id: 24,
    title: "Topological Sort",
    slug: "topological-sort",
    difficulty: "medium",
    acceptance: 62,
    status: "unsolved",
    tags: ["Graph", "Sorting"],
    category: "Graph",
  },
  {
    id: 25,
    title: "Bellman-Ford Algorithm",
    slug: "bellman-ford",
    difficulty: "hard",
    acceptance: 40,
    status: "unsolved",
    tags: ["Graph"],
    category: "Graph",
    isPremium: true,
  },

  // Backtracking
  {
    id: 26,
    title: "N-Queens Problem",
    slug: "n-queens",
    difficulty: "hard",
    acceptance: 48,
    status: "unsolved",
    tags: ["Backtracking", "Recursion"],
    category: "Backtracking",
  },
  {
    id: 27,
    title: "Sudoku Solver",
    slug: "sudoku-solver",
    difficulty: "hard",
    acceptance: 44,
    status: "unsolved",
    tags: ["Backtracking"],
    category: "Backtracking",
  },
  {
    id: 28,
    title: "Permutations",
    slug: "permutations",
    difficulty: "medium",
    acceptance: 71,
    status: "solved",
    tags: ["Backtracking", "Recursion"],
    category: "Backtracking",
  },

  // Divide & Conquer
  {
    id: 29,
    title: "Maximum Subarray (Kadane's)",
    slug: "maximum-subarray",
    difficulty: "medium",
    acceptance: 65,
    status: "solved",
    tags: ["Divide & Conquer", "Dynamic Programming"],
    category: "Divide & Conquer",
  },
  {
    id: 30,
    title: "Closest Pair of Points",
    slug: "closest-pair-points",
    difficulty: "hard",
    acceptance: 38,
    status: "unsolved",
    tags: ["Divide & Conquer", "Math"],
    category: "Divide & Conquer",
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

export default function AlgorithmPage() {
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
    let list = problems.filter((p) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeCategory, difficultyFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Algorithms
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Practice algorithmic thinking with problems organized by topic and
          difficulty.
        </p>
      </div>

      {/* ── Progress Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Donut-style progress */}
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

        {/* Difficulty breakdown */}
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
                      href={`/learn/algorithm/${problem.slug}`}
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
