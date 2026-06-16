"use client";

/**
 * @deprecated FutureHub refocus (Phase 1): the Learn section is mock/placeholder
 * content with no backend and is slated for removal. It is NOT one of the four
 * cores (Articles · Projects · Dictionary · Discussions). Do not build on this.
 * See futurehub-docs/docs/features/deprecated.md.
 */

import {
  BookOpen,
  ChevronRight,
  Flame,
  Search,
  Target,
  Zap,
} from "lucide-react";
import ProblemCatalogPage, {
  type CategoryStats,
  type Problem,
} from "@/app/learn/_shared/ProblemCatalogPage";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

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

export default function AlgorithmPage() {
  return (
    <ProblemCatalogPage
      title="Algorithms"
      description="Practice algorithmic thinking with problems organized by topic and difficulty."
      headerIcon={<Target className="h-6 w-6 text-primary" />}
      basePath="/learn/algorithm"
      categories={categories}
      problems={problems}
    />
  );
}
