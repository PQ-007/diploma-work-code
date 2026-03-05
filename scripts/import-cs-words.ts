/**
 * DICTIONARY IMPORTER — ~1 000 CS terms from Wikipedia
 * ──────────────────────────────────────────────────────
 * Prerequisites
 *   npm install @supabase/supabase-js dotenv tsx --save-dev
 *
 * Add to .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   SEED_AUTHOR_UUID=<your profile UUID from the profiles table>
 *
 * Run:
 *   npx tsx scripts/import-cs-words.ts
 *
 * The script is safe to re-run — it skips already-imported slugs and
 * resumes from a .import-progress.json checkpoint file.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import * as path from "path";

// ── env ──────────────────────────────────────────────────────────────────────
// dotenv: try .env.local, then .env
const envFiles = [".env.local", ".env"];
for (const f of envFiles) {
  const fp = path.join(process.cwd(), f);
  if (existsSync(fp)) {
    const lines = readFileSync(fp, "utf8").split("\n");
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
      if (m) process.env[m[1]] ??= m[2];
    }
    break;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const AUTHOR_UUID = process.env.SEED_AUTHOR_UUID ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
if (!AUTHOR_UUID) {
  console.error(
    "✗ Missing SEED_AUTHOR_UUID in .env.local  (your profile UUID from the profiles table)"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── config ───────────────────────────────────────────────────────────────────
const RATE_MS = 180;          // pause between Wikipedia requests (ms)
const MAX_DEF_LEN = 600;      // max characters to store for a definition
const PROGRESS_FILE = path.join(process.cwd(), "scripts", ".import-progress.json");

// ── category → tags mapping ───────────────────────────────────────────────────
const CATEGORY_TAGS: Record<string, string[]> = {
  "algorithms":            ["algorithms", "computer-science"],
  "complexity":            ["algorithms", "computer-science"],
  "data-structures":       ["data-structures", "computer-science", "algorithms"],
  "programming-languages": ["programming", "computer-science"],
  "programming":           ["programming", "computer-science", "design-patterns"],
  "web-development":       ["web-development", "programming"],
  "databases":             ["databases", "computer-science"],
  "networking":            ["networking", "infrastructure"],
  "computer-science":      ["computer-science"],
  "ai-ml":                 ["machine-learning", "artificial-intelligence", "deep-learning"],
  "software-engineering":  ["software-engineering", "programming", "agile"],
  "security":              ["security", "computer-science"],
  "cloud":                 ["cloud", "devops", "infrastructure"],
};

// ── term list ─────────────────────────────────────────────────────────────────
// "wikipedia" = exact Wikipedia article title used for the REST summary API
// "category"  = key in CATEGORY_TAGS above
interface Term { wikipedia: string; category: string }

const TERMS: Term[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  //  ALGORITHMS
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Algorithm",                                   category: "algorithms" },
  { wikipedia: "Sorting algorithm",                           category: "algorithms" },
  { wikipedia: "Bubble sort",                                 category: "algorithms" },
  { wikipedia: "Insertion sort",                              category: "algorithms" },
  { wikipedia: "Selection sort",                              category: "algorithms" },
  { wikipedia: "Merge sort",                                  category: "algorithms" },
  { wikipedia: "Quicksort",                                   category: "algorithms" },
  { wikipedia: "Heapsort",                                    category: "algorithms" },
  { wikipedia: "Radix sort",                                  category: "algorithms" },
  { wikipedia: "Counting sort",                               category: "algorithms" },
  { wikipedia: "Bucket sort",                                 category: "algorithms" },
  { wikipedia: "Timsort",                                     category: "algorithms" },
  { wikipedia: "Shell sort",                                  category: "algorithms" },
  { wikipedia: "Cocktail shaker sort",                        category: "algorithms" },
  { wikipedia: "Linear search",                               category: "algorithms" },
  { wikipedia: "Binary search algorithm",                     category: "algorithms" },
  { wikipedia: "Jump search",                                 category: "algorithms" },
  { wikipedia: "Interpolation search",                        category: "algorithms" },
  { wikipedia: "Exponential search",                          category: "algorithms" },
  { wikipedia: "Ternary search",                              category: "algorithms" },
  { wikipedia: "Breadth-first search",                        category: "algorithms" },
  { wikipedia: "Depth-first search",                          category: "algorithms" },
  { wikipedia: "Dijkstra's algorithm",                        category: "algorithms" },
  { wikipedia: "Bellman–Ford algorithm",                      category: "algorithms" },
  { wikipedia: "Floyd–Warshall algorithm",                    category: "algorithms" },
  { wikipedia: "A* search algorithm",                         category: "algorithms" },
  { wikipedia: "Kruskal's algorithm",                         category: "algorithms" },
  { wikipedia: "Prim's algorithm",                            category: "algorithms" },
  { wikipedia: "Topological sorting",                         category: "algorithms" },
  { wikipedia: "Tarjan's strongly connected components algorithm", category: "algorithms" },
  { wikipedia: "Kosaraju's algorithm",                        category: "algorithms" },
  { wikipedia: "Dynamic programming",                         category: "algorithms" },
  { wikipedia: "Memoization",                                 category: "algorithms" },
  { wikipedia: "Greedy algorithm",                            category: "algorithms" },
  { wikipedia: "Divide-and-conquer algorithm",                category: "algorithms" },
  { wikipedia: "Backtracking",                                category: "algorithms" },
  { wikipedia: "Randomized algorithm",                        category: "algorithms" },
  { wikipedia: "Approximation algorithm",                     category: "algorithms" },
  { wikipedia: "Las Vegas algorithm",                         category: "algorithms" },
  { wikipedia: "Monte Carlo algorithm",                       category: "algorithms" },
  { wikipedia: "Genetic algorithm",                           category: "algorithms" },
  { wikipedia: "Simulated annealing",                         category: "algorithms" },
  { wikipedia: "Branch and bound",                            category: "algorithms" },
  { wikipedia: "Knuth–Morris–Pratt algorithm",                category: "algorithms" },
  { wikipedia: "Rabin–Karp algorithm",                        category: "algorithms" },
  { wikipedia: "Boyer–Moore string-search algorithm",         category: "algorithms" },
  { wikipedia: "Suffix array",                                category: "algorithms" },
  { wikipedia: "Suffix tree",                                 category: "algorithms" },
  { wikipedia: "Edit distance",                               category: "algorithms" },
  { wikipedia: "Longest common subsequence",                  category: "algorithms" },
  { wikipedia: "Longest increasing subsequence",              category: "algorithms" },
  { wikipedia: "Knapsack problem",                            category: "algorithms" },
  { wikipedia: "Fibonacci sequence",                          category: "algorithms" },
  { wikipedia: "Euclidean algorithm",                         category: "algorithms" },
  { wikipedia: "Floyd's cycle-finding algorithm",             category: "algorithms" },
  { wikipedia: "In-place algorithm",                          category: "algorithms" },
  { wikipedia: "Stable sort",                                 category: "algorithms" },
  { wikipedia: "Online algorithm",                            category: "algorithms" },
  { wikipedia: "Streaming algorithm",                         category: "algorithms" },
  { wikipedia: "Flood fill",                                  category: "algorithms" },
  { wikipedia: "Minimax algorithm",                           category: "algorithms" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMPLEXITY THEORY
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Big O notation",                              category: "complexity" },
  { wikipedia: "Time complexity",                             category: "complexity" },
  { wikipedia: "Space complexity",                            category: "complexity" },
  { wikipedia: "P versus NP problem",                         category: "complexity" },
  { wikipedia: "NP-completeness",                             category: "complexity" },
  { wikipedia: "NP-hardness",                                 category: "complexity" },
  { wikipedia: "Polynomial time",                             category: "complexity" },
  { wikipedia: "Amortized analysis",                          category: "complexity" },
  { wikipedia: "Computational complexity theory",             category: "complexity" },
  { wikipedia: "Turing machine",                              category: "complexity" },
  { wikipedia: "Halting problem",                             category: "complexity" },
  { wikipedia: "Church–Turing thesis",                        category: "complexity" },
  { wikipedia: "Automata theory",                             category: "complexity" },
  { wikipedia: "Regular expression",                          category: "complexity" },
  { wikipedia: "Context-free grammar",                        category: "complexity" },
  { wikipedia: "Finite automaton",                            category: "complexity" },
  { wikipedia: "Pushdown automaton",                          category: "complexity" },
  { wikipedia: "Decidability (logic)",                        category: "complexity" },
  { wikipedia: "Rice's theorem",                              category: "complexity" },
  { wikipedia: "Reduction (complexity)",                      category: "complexity" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  DATA STRUCTURES
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Data structure",                              category: "data-structures" },
  { wikipedia: "Array (data structure)",                      category: "data-structures" },
  { wikipedia: "Linked list",                                 category: "data-structures" },
  { wikipedia: "Doubly linked list",                          category: "data-structures" },
  { wikipedia: "Circular linked list",                        category: "data-structures" },
  { wikipedia: "Stack (abstract data type)",                  category: "data-structures" },
  { wikipedia: "Queue (abstract data type)",                  category: "data-structures" },
  { wikipedia: "Double-ended queue",                          category: "data-structures" },
  { wikipedia: "Priority queue",                              category: "data-structures" },
  { wikipedia: "Heap (data structure)",                       category: "data-structures" },
  { wikipedia: "Binary heap",                                 category: "data-structures" },
  { wikipedia: "Fibonacci heap",                              category: "data-structures" },
  { wikipedia: "Binary tree",                                 category: "data-structures" },
  { wikipedia: "Binary search tree",                          category: "data-structures" },
  { wikipedia: "AVL tree",                                    category: "data-structures" },
  { wikipedia: "Red–black tree",                              category: "data-structures" },
  { wikipedia: "B-tree",                                      category: "data-structures" },
  { wikipedia: "B+ tree",                                     category: "data-structures" },
  { wikipedia: "Trie",                                        category: "data-structures" },
  { wikipedia: "Hash table",                                  category: "data-structures" },
  { wikipedia: "Hash function",                               category: "data-structures" },
  { wikipedia: "Graph (abstract data type)",                  category: "data-structures" },
  { wikipedia: "Directed graph",                              category: "data-structures" },
  { wikipedia: "Weighted graph",                              category: "data-structures" },
  { wikipedia: "Adjacency matrix",                            category: "data-structures" },
  { wikipedia: "Adjacency list",                              category: "data-structures" },
  { wikipedia: "Disjoint-set data structure",                 category: "data-structures" },
  { wikipedia: "Segment tree",                                category: "data-structures" },
  { wikipedia: "Fenwick tree",                                category: "data-structures" },
  { wikipedia: "Skip list",                                   category: "data-structures" },
  { wikipedia: "Bloom filter",                                category: "data-structures" },
  { wikipedia: "Sparse table",                                category: "data-structures" },
  { wikipedia: "Rope (data structure)",                       category: "data-structures" },
  { wikipedia: "Van Emde Boas tree",                          category: "data-structures" },
  { wikipedia: "Cache replacement policies",                  category: "data-structures" },
  { wikipedia: "Sparse matrix",                               category: "data-structures" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PROGRAMMING LANGUAGES
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Programming language",                        category: "programming-languages" },
  { wikipedia: "Python (programming language)",               category: "programming-languages" },
  { wikipedia: "JavaScript",                                  category: "programming-languages" },
  { wikipedia: "TypeScript",                                  category: "programming-languages" },
  { wikipedia: "Java (programming language)",                 category: "programming-languages" },
  { wikipedia: "C (programming language)",                    category: "programming-languages" },
  { wikipedia: "C++",                                         category: "programming-languages" },
  { wikipedia: "C Sharp (programming language)",              category: "programming-languages" },
  { wikipedia: "Rust (programming language)",                 category: "programming-languages" },
  { wikipedia: "Go (programming language)",                   category: "programming-languages" },
  { wikipedia: "Swift (programming language)",                category: "programming-languages" },
  { wikipedia: "Kotlin (programming language)",               category: "programming-languages" },
  { wikipedia: "Ruby (programming language)",                 category: "programming-languages" },
  { wikipedia: "PHP",                                         category: "programming-languages" },
  { wikipedia: "Scala (programming language)",                category: "programming-languages" },
  { wikipedia: "Haskell (programming language)",              category: "programming-languages" },
  { wikipedia: "Erlang (programming language)",               category: "programming-languages" },
  { wikipedia: "Elixir (programming language)",               category: "programming-languages" },
  { wikipedia: "R (programming language)",                    category: "programming-languages" },
  { wikipedia: "Julia (programming language)",                category: "programming-languages" },
  { wikipedia: "Perl",                                        category: "programming-languages" },
  { wikipedia: "Lua (programming language)",                  category: "programming-languages" },
  { wikipedia: "Assembly language",                           category: "programming-languages" },
  { wikipedia: "COBOL",                                       category: "programming-languages" },
  { wikipedia: "Fortran",                                     category: "programming-languages" },
  { wikipedia: "Lisp (programming language)",                 category: "programming-languages" },
  { wikipedia: "Prolog",                                      category: "programming-languages" },
  { wikipedia: "Clojure",                                     category: "programming-languages" },
  { wikipedia: "F Sharp (programming language)",              category: "programming-languages" },
  { wikipedia: "Dart (programming language)",                 category: "programming-languages" },
  { wikipedia: "WebAssembly",                                 category: "programming-languages" },
  { wikipedia: "Bash (Unix shell)",                           category: "programming-languages" },
  { wikipedia: "SQL",                                         category: "programming-languages" },
  { wikipedia: "GraphQL",                                     category: "programming-languages" },
  { wikipedia: "HTML",                                        category: "programming-languages" },
  { wikipedia: "CSS",                                         category: "programming-languages" },
  { wikipedia: "YAML",                                        category: "programming-languages" },
  { wikipedia: "XML",                                         category: "programming-languages" },
  { wikipedia: "JSON",                                        category: "programming-languages" },
  { wikipedia: "Markdown",                                    category: "programming-languages" },
  { wikipedia: "Zig (programming language)",                  category: "programming-languages" },
  { wikipedia: "Nim (programming language)",                  category: "programming-languages" },
  { wikipedia: "Crystal (programming language)",              category: "programming-languages" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  PROGRAMMING CONCEPTS & PARADIGMS
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Object-oriented programming",                 category: "programming" },
  { wikipedia: "Class (computer programming)",                category: "programming" },
  { wikipedia: "Inheritance (object-oriented programming)",   category: "programming" },
  { wikipedia: "Polymorphism (computer science)",             category: "programming" },
  { wikipedia: "Encapsulation (computer programming)",        category: "programming" },
  { wikipedia: "Abstraction (computer science)",              category: "programming" },
  { wikipedia: "Interface (object-oriented programming)",     category: "programming" },
  { wikipedia: "Design pattern (computer science)",           category: "programming" },
  { wikipedia: "Singleton pattern",                           category: "programming" },
  { wikipedia: "Factory method pattern",                      category: "programming" },
  { wikipedia: "Observer pattern",                            category: "programming" },
  { wikipedia: "Decorator pattern",                           category: "programming" },
  { wikipedia: "Strategy pattern",                            category: "programming" },
  { wikipedia: "Command pattern",                             category: "programming" },
  { wikipedia: "Facade pattern",                              category: "programming" },
  { wikipedia: "Adapter pattern",                             category: "programming" },
  { wikipedia: "Proxy pattern",                               category: "programming" },
  { wikipedia: "Iterator pattern",                            category: "programming" },
  { wikipedia: "Composite pattern",                           category: "programming" },
  { wikipedia: "Template method pattern",                     category: "programming" },
  { wikipedia: "Builder pattern",                             category: "programming" },
  { wikipedia: "Prototype pattern",                           category: "programming" },
  { wikipedia: "Functional programming",                      category: "programming" },
  { wikipedia: "Lambda calculus",                             category: "programming" },
  { wikipedia: "Closure (computer programming)",              category: "programming" },
  { wikipedia: "Higher-order function",                       category: "programming" },
  { wikipedia: "Pure function",                               category: "programming" },
  { wikipedia: "Immutable object",                            category: "programming" },
  { wikipedia: "Currying",                                    category: "programming" },
  { wikipedia: "Monad (functional programming)",              category: "programming" },
  { wikipedia: "Recursion (computer science)",                category: "programming" },
  { wikipedia: "Tail call",                                   category: "programming" },
  { wikipedia: "Lazy evaluation",                             category: "programming" },
  { wikipedia: "Eager evaluation",                            category: "programming" },
  { wikipedia: "Concurrent computing",                        category: "programming" },
  { wikipedia: "Thread (computing)",                          category: "programming" },
  { wikipedia: "Process (computing)",                         category: "programming" },
  { wikipedia: "Mutual exclusion",                            category: "programming" },
  { wikipedia: "Semaphore (programming)",                     category: "programming" },
  { wikipedia: "Deadlock",                                    category: "programming" },
  { wikipedia: "Race condition",                              category: "programming" },
  { wikipedia: "Coroutine",                                   category: "programming" },
  { wikipedia: "Async/await",                                 category: "programming" },
  { wikipedia: "Promise (programming)",                       category: "programming" },
  { wikipedia: "Callback (computer programming)",             category: "programming" },
  { wikipedia: "Event loop",                                  category: "programming" },
  { wikipedia: "Garbage collection (computer science)",       category: "programming" },
  { wikipedia: "Memory management",                           category: "programming" },
  { wikipedia: "Pointer (computer programming)",              category: "programming" },
  { wikipedia: "Reference (computer science)",                category: "programming" },
  { wikipedia: "Variable (computer science)",                 category: "programming" },
  { wikipedia: "Data type",                                   category: "programming" },
  { wikipedia: "Type system",                                 category: "programming" },
  { wikipedia: "Static typing",                               category: "programming" },
  { wikipedia: "Type inference",                              category: "programming" },
  { wikipedia: "Generic programming",                         category: "programming" },
  { wikipedia: "Reflection (computer programming)",           category: "programming" },
  { wikipedia: "Metaprogramming",                             category: "programming" },
  { wikipedia: "Compiler",                                    category: "programming" },
  { wikipedia: "Interpreter (computing)",                     category: "programming" },
  { wikipedia: "Just-in-time compilation",                    category: "programming" },
  { wikipedia: "Bytecode",                                    category: "programming" },
  { wikipedia: "Abstract syntax tree",                        category: "programming" },
  { wikipedia: "Lexical analysis",                            category: "programming" },
  { wikipedia: "Parsing",                                     category: "programming" },
  { wikipedia: "Transpiler",                                  category: "programming" },
  { wikipedia: "Namespace (computer science)",                category: "programming" },
  { wikipedia: "Scope (computer science)",                    category: "programming" },
  { wikipedia: "Exception handling",                          category: "programming" },
  { wikipedia: "Unit testing",                                category: "programming" },
  { wikipedia: "Integration testing",                         category: "programming" },
  { wikipedia: "Test-driven development",                     category: "programming" },
  { wikipedia: "Debugging",                                   category: "programming" },
  { wikipedia: "Profiling (computer programming)",            category: "programming" },
  { wikipedia: "Code refactoring",                            category: "programming" },
  { wikipedia: "Technical debt",                              category: "programming" },
  { wikipedia: "Code smell",                                  category: "programming" },
  { wikipedia: "Anti-pattern",                                category: "programming" },
  { wikipedia: "SOLID",                                       category: "programming" },
  { wikipedia: "Don't repeat yourself",                       category: "programming" },
  { wikipedia: "KISS principle",                              category: "programming" },
  { wikipedia: "Coupling (computer programming)",             category: "programming" },
  { wikipedia: "Cohesion (computer science)",                 category: "programming" },
  { wikipedia: "Asynchronous programming model",              category: "programming" },
  { wikipedia: "Event-driven programming",                    category: "programming" },
  { wikipedia: "Reactive programming",                        category: "programming" },
  { wikipedia: "Aspect-oriented programming",                 category: "programming" },
  { wikipedia: "Procedural programming",                      category: "programming" },
  { wikipedia: "Declarative programming",                     category: "programming" },
  { wikipedia: "Imperative programming",                      category: "programming" },
  { wikipedia: "Logic programming",                           category: "programming" },
  { wikipedia: "Continuation (computer science)",             category: "programming" },
  { wikipedia: "Dependency injection",                        category: "programming" },
  { wikipedia: "Inversion of control",                        category: "programming" },
  { wikipedia: "Code generation (compiler)",                  category: "programming" },
  { wikipedia: "Cross compiler",                              category: "programming" },
  { wikipedia: "Optimizing compiler",                         category: "programming" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  WEB DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "World Wide Web",                              category: "web-development" },
  { wikipedia: "Hypertext Transfer Protocol",                 category: "web-development" },
  { wikipedia: "HTTPS",                                       category: "web-development" },
  { wikipedia: "Representational state transfer",             category: "web-development" },
  { wikipedia: "WebSocket",                                   category: "web-development" },
  { wikipedia: "Uniform Resource Locator",                    category: "web-development" },
  { wikipedia: "Cookie (HTTP)",                               category: "web-development" },
  { wikipedia: "JSON Web Token",                              category: "web-development" },
  { wikipedia: "OAuth",                                       category: "web-development" },
  { wikipedia: "Cross-origin resource sharing",               category: "web-development" },
  { wikipedia: "Cross-site scripting",                        category: "web-development" },
  { wikipedia: "Cross-site request forgery",                  category: "web-development" },
  { wikipedia: "SQL injection",                               category: "web-development" },
  { wikipedia: "Document Object Model",                       category: "web-development" },
  { wikipedia: "Virtual DOM",                                 category: "web-development" },
  { wikipedia: "React (software)",                            category: "web-development" },
  { wikipedia: "Vue.js",                                      category: "web-development" },
  { wikipedia: "Angular (web framework)",                     category: "web-development" },
  { wikipedia: "Svelte",                                      category: "web-development" },
  { wikipedia: "Next.js",                                     category: "web-development" },
  { wikipedia: "Node.js",                                     category: "web-development" },
  { wikipedia: "Single-page application",                     category: "web-development" },
  { wikipedia: "Progressive web application",                 category: "web-development" },
  { wikipedia: "Server-side rendering",                       category: "web-development" },
  { wikipedia: "Static site generator",                       category: "web-development" },
  { wikipedia: "Content delivery network",                    category: "web-development" },
  { wikipedia: "Web cache",                                   category: "web-development" },
  { wikipedia: "Minification (programming)",                  category: "web-development" },
  { wikipedia: "Lazy loading",                                category: "web-development" },
  { wikipedia: "Responsive web design",                       category: "web-development" },
  { wikipedia: "Cascading Style Sheets",                      category: "web-development" },
  { wikipedia: "Sass (style sheet language)",                 category: "web-development" },
  { wikipedia: "Model–view–controller",                       category: "web-development" },
  { wikipedia: "Middleware",                                   category: "web-development" },
  { wikipedia: "Object-relational mapping",                   category: "web-development" },
  { wikipedia: "Web API",                                     category: "web-development" },
  { wikipedia: "Webhook",                                     category: "web-development" },
  { wikipedia: "Application programming interface",           category: "web-development" },
  { wikipedia: "Microservices",                               category: "web-development" },
  { wikipedia: "Serverless computing",                        category: "web-development" },
  { wikipedia: "Web scraping",                                category: "web-development" },
  { wikipedia: "WebRTC",                                      category: "web-development" },
  { wikipedia: "HTTP/2",                                      category: "web-development" },
  { wikipedia: "HTTP/3",                                      category: "web-development" },
  { wikipedia: "gRPC",                                        category: "web-development" },
  { wikipedia: "OpenAPI Specification",                       category: "web-development" },
  { wikipedia: "Web Components",                              category: "web-development" },
  { wikipedia: "Web storage",                                 category: "web-development" },
  { wikipedia: "IndexedDB",                                   category: "web-development" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  DATABASES
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Database",                                    category: "databases" },
  { wikipedia: "Relational database",                         category: "databases" },
  { wikipedia: "NoSQL",                                       category: "databases" },
  { wikipedia: "PostgreSQL",                                  category: "databases" },
  { wikipedia: "MySQL",                                       category: "databases" },
  { wikipedia: "SQLite",                                      category: "databases" },
  { wikipedia: "MongoDB",                                     category: "databases" },
  { wikipedia: "Redis",                                       category: "databases" },
  { wikipedia: "Cassandra (database)",                        category: "databases" },
  { wikipedia: "Elasticsearch",                               category: "databases" },
  { wikipedia: "Database normalization",                      category: "databases" },
  { wikipedia: "Database transaction",                        category: "databases" },
  { wikipedia: "ACID (atomicity, consistency, isolation, durability)", category: "databases" },
  { wikipedia: "CAP theorem",                                 category: "databases" },
  { wikipedia: "Database index",                              category: "databases" },
  { wikipedia: "Query optimization",                          category: "databases" },
  { wikipedia: "Stored procedure",                            category: "databases" },
  { wikipedia: "Database trigger",                            category: "databases" },
  { wikipedia: "View (SQL)",                                  category: "databases" },
  { wikipedia: "Foreign key",                                 category: "databases" },
  { wikipedia: "Primary key",                                 category: "databases" },
  { wikipedia: "Database schema",                             category: "databases" },
  { wikipedia: "Database migration",                          category: "databases" },
  { wikipedia: "Replication (computing)",                     category: "databases" },
  { wikipedia: "Shard (database architecture)",               category: "databases" },
  { wikipedia: "Connection pool",                             category: "databases" },
  { wikipedia: "Data warehouse",                              category: "databases" },
  { wikipedia: "Data lake",                                   category: "databases" },
  { wikipedia: "Extract, transform, load",                    category: "databases" },
  { wikipedia: "Online analytical processing",                category: "databases" },
  { wikipedia: "Online transaction processing",               category: "databases" },
  { wikipedia: "Graph database",                              category: "databases" },
  { wikipedia: "Time series database",                        category: "databases" },
  { wikipedia: "Column-oriented DBMS",                        category: "databases" },
  { wikipedia: "Optimistic concurrency control",              category: "databases" },
  { wikipedia: "Two-phase locking",                           category: "databases" },
  { wikipedia: "Multiversion concurrency control",            category: "databases" },
  { wikipedia: "NewSQL",                                      category: "databases" },
  { wikipedia: "Document-oriented database",                  category: "databases" },
  { wikipedia: "Key–value database",                          category: "databases" },
  { wikipedia: "Full-text search",                            category: "databases" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  NETWORKING & PROTOCOLS
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Computer network",                            category: "networking" },
  { wikipedia: "Transmission Control Protocol",               category: "networking" },
  { wikipedia: "User Datagram Protocol",                      category: "networking" },
  { wikipedia: "Internet Protocol",                           category: "networking" },
  { wikipedia: "Domain Name System",                          category: "networking" },
  { wikipedia: "Dynamic Host Configuration Protocol",         category: "networking" },
  { wikipedia: "File Transfer Protocol",                      category: "networking" },
  { wikipedia: "Secure Shell",                                category: "networking" },
  { wikipedia: "Transport Layer Security",                    category: "networking" },
  { wikipedia: "Virtual private network",                     category: "networking" },
  { wikipedia: "Firewall (computing)",                        category: "networking" },
  { wikipedia: "Network address translation",                 category: "networking" },
  { wikipedia: "Classless Inter-Domain Routing",              category: "networking" },
  { wikipedia: "IPv4",                                        category: "networking" },
  { wikipedia: "IPv6",                                        category: "networking" },
  { wikipedia: "MAC address",                                 category: "networking" },
  { wikipedia: "Address Resolution Protocol",                 category: "networking" },
  { wikipedia: "Internet Control Message Protocol",           category: "networking" },
  { wikipedia: "Border Gateway Protocol",                     category: "networking" },
  { wikipedia: "Open Shortest Path First",                    category: "networking" },
  { wikipedia: "Load balancing (computing)",                  category: "networking" },
  { wikipedia: "Reverse proxy",                               category: "networking" },
  { wikipedia: "Bandwidth (computing)",                       category: "networking" },
  { wikipedia: "Latency (engineering)",                       category: "networking" },
  { wikipedia: "Network packet",                              category: "networking" },
  { wikipedia: "Network socket",                              category: "networking" },
  { wikipedia: "OSI model",                                   category: "networking" },
  { wikipedia: "Router (computing)",                          category: "networking" },
  { wikipedia: "Network switch",                              category: "networking" },
  { wikipedia: "Local area network",                          category: "networking" },
  { wikipedia: "Wide area network",                           category: "networking" },
  { wikipedia: "Peer-to-peer",                                category: "networking" },
  { wikipedia: "Client–server model",                         category: "networking" },
  { wikipedia: "Internet of things",                          category: "networking" },
  { wikipedia: "5G",                                          category: "networking" },
  { wikipedia: "Wireless LAN",                                category: "networking" },
  { wikipedia: "Ethernet",                                    category: "networking" },
  { wikipedia: "Proxy server",                                category: "networking" },
  { wikipedia: "Simple Mail Transfer Protocol",               category: "networking" },
  { wikipedia: "Internet Message Access Protocol",            category: "networking" },
  { wikipedia: "Throughput",                                  category: "networking" },
  { wikipedia: "Packet switching",                            category: "networking" },
  { wikipedia: "Circuit switching",                           category: "networking" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  OPERATING SYSTEMS & COMPUTER ARCHITECTURE
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Operating system",                            category: "computer-science" },
  { wikipedia: "Kernel (operating system)",                   category: "computer-science" },
  { wikipedia: "System call",                                 category: "computer-science" },
  { wikipedia: "Interrupt",                                   category: "computer-science" },
  { wikipedia: "Context switch",                              category: "computer-science" },
  { wikipedia: "Scheduling (computing)",                      category: "computer-science" },
  { wikipedia: "Round-robin scheduling",                      category: "computer-science" },
  { wikipedia: "Virtual memory",                              category: "computer-science" },
  { wikipedia: "Paging",                                      category: "computer-science" },
  { wikipedia: "Memory segmentation",                         category: "computer-science" },
  { wikipedia: "Page fault",                                  category: "computer-science" },
  { wikipedia: "Swap space",                                  category: "computer-science" },
  { wikipedia: "File system",                                 category: "computer-science" },
  { wikipedia: "Inode",                                       category: "computer-science" },
  { wikipedia: "RAID",                                        category: "computer-science" },
  { wikipedia: "Device driver",                               category: "computer-science" },
  { wikipedia: "Daemon (computing)",                          category: "computer-science" },
  { wikipedia: "Inter-process communication",                 category: "computer-science" },
  { wikipedia: "Fork (system call)",                          category: "computer-science" },
  { wikipedia: "Zombie process",                              category: "computer-science" },
  { wikipedia: "Linux",                                       category: "computer-science" },
  { wikipedia: "Unix",                                        category: "computer-science" },
  { wikipedia: "Hypervisor",                                  category: "computer-science" },
  { wikipedia: "Virtual machine",                             category: "computer-science" },
  { wikipedia: "Container (virtualization)",                  category: "computer-science" },
  { wikipedia: "Central processing unit",                     category: "computer-science" },
  { wikipedia: "Graphics processing unit",                    category: "computer-science" },
  { wikipedia: "Arithmetic logic unit",                       category: "computer-science" },
  { wikipedia: "Processor register",                          category: "computer-science" },
  { wikipedia: "CPU cache",                                   category: "computer-science" },
  { wikipedia: "Random-access memory",                        category: "computer-science" },
  { wikipedia: "Read-only memory",                            category: "computer-science" },
  { wikipedia: "Flash memory",                                category: "computer-science" },
  { wikipedia: "Solid-state drive",                           category: "computer-science" },
  { wikipedia: "Hard disk drive",                             category: "computer-science" },
  { wikipedia: "Clock rate",                                  category: "computer-science" },
  { wikipedia: "Instruction pipelining",                      category: "computer-science" },
  { wikipedia: "Superscalar processor",                       category: "computer-science" },
  { wikipedia: "Reduced instruction set computer",            category: "computer-science" },
  { wikipedia: "Complex instruction set computer",            category: "computer-science" },
  { wikipedia: "Branch predictor",                            category: "computer-science" },
  { wikipedia: "Speculative execution",                       category: "computer-science" },
  { wikipedia: "Out-of-order execution",                      category: "computer-science" },
  { wikipedia: "Field-programmable gate array",               category: "computer-science" },
  { wikipedia: "Application-specific integrated circuit",     category: "computer-science" },
  { wikipedia: "Microcontroller",                             category: "computer-science" },
  { wikipedia: "Embedded system",                             category: "computer-science" },
  { wikipedia: "Von Neumann architecture",                    category: "computer-science" },
  { wikipedia: "Harvard architecture",                        category: "computer-science" },
  { wikipedia: "Instruction set architecture",                category: "computer-science" },
  { wikipedia: "x86",                                         category: "computer-science" },
  { wikipedia: "ARM architecture family",                     category: "computer-science" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Artificial intelligence",                     category: "ai-ml" },
  { wikipedia: "Machine learning",                            category: "ai-ml" },
  { wikipedia: "Deep learning",                               category: "ai-ml" },
  { wikipedia: "Neural network (machine learning)",           category: "ai-ml" },
  { wikipedia: "Convolutional neural network",                category: "ai-ml" },
  { wikipedia: "Recurrent neural network",                    category: "ai-ml" },
  { wikipedia: "Long short-term memory",                      category: "ai-ml" },
  { wikipedia: "Transformer (deep learning architecture)",    category: "ai-ml" },
  { wikipedia: "Attention (machine learning)",                category: "ai-ml" },
  { wikipedia: "Generative pre-trained transformer",          category: "ai-ml" },
  { wikipedia: "BERT (language model)",                       category: "ai-ml" },
  { wikipedia: "Reinforcement learning",                      category: "ai-ml" },
  { wikipedia: "Supervised learning",                         category: "ai-ml" },
  { wikipedia: "Unsupervised learning",                       category: "ai-ml" },
  { wikipedia: "Semi-supervised learning",                    category: "ai-ml" },
  { wikipedia: "Transfer learning",                           category: "ai-ml" },
  { wikipedia: "Federated learning",                          category: "ai-ml" },
  { wikipedia: "Overfitting",                                 category: "ai-ml" },
  { wikipedia: "Regularization (mathematics)",                category: "ai-ml" },
  { wikipedia: "Dropout (neural networks)",                   category: "ai-ml" },
  { wikipedia: "Batch normalization",                         category: "ai-ml" },
  { wikipedia: "Learning rate",                               category: "ai-ml" },
  { wikipedia: "Gradient descent",                            category: "ai-ml" },
  { wikipedia: "Stochastic gradient descent",                 category: "ai-ml" },
  { wikipedia: "Backpropagation",                             category: "ai-ml" },
  { wikipedia: "Loss function",                               category: "ai-ml" },
  { wikipedia: "Activation function",                         category: "ai-ml" },
  { wikipedia: "Sigmoid function",                            category: "ai-ml" },
  { wikipedia: "Rectifier (neural networks)",                 category: "ai-ml" },
  { wikipedia: "Softmax function",                            category: "ai-ml" },
  { wikipedia: "Word embedding",                              category: "ai-ml" },
  { wikipedia: "Fine-tuning (deep learning)",                 category: "ai-ml" },
  { wikipedia: "Prompt engineering",                          category: "ai-ml" },
  { wikipedia: "Computer vision",                             category: "ai-ml" },
  { wikipedia: "Object detection",                            category: "ai-ml" },
  { wikipedia: "Image segmentation",                          category: "ai-ml" },
  { wikipedia: "Natural language processing",                 category: "ai-ml" },
  { wikipedia: "Speech recognition",                          category: "ai-ml" },
  { wikipedia: "Text-to-speech",                              category: "ai-ml" },
  { wikipedia: "Recommender system",                          category: "ai-ml" },
  { wikipedia: "Anomaly detection",                           category: "ai-ml" },
  { wikipedia: "Cluster analysis",                            category: "ai-ml" },
  { wikipedia: "Linear regression",                           category: "ai-ml" },
  { wikipedia: "Logistic regression",                         category: "ai-ml" },
  { wikipedia: "Decision tree",                               category: "ai-ml" },
  { wikipedia: "Random forest",                               category: "ai-ml" },
  { wikipedia: "Support vector machine",                      category: "ai-ml" },
  { wikipedia: "K-nearest neighbors algorithm",               category: "ai-ml" },
  { wikipedia: "K-means clustering",                          category: "ai-ml" },
  { wikipedia: "Principal component analysis",                category: "ai-ml" },
  { wikipedia: "Generative adversarial network",              category: "ai-ml" },
  { wikipedia: "Variational autoencoder",                     category: "ai-ml" },
  { wikipedia: "Diffusion model",                             category: "ai-ml" },
  { wikipedia: "Large language model",                        category: "ai-ml" },
  { wikipedia: "Hallucination (artificial intelligence)",     category: "ai-ml" },
  { wikipedia: "Explainable artificial intelligence",         category: "ai-ml" },
  { wikipedia: "Naive Bayes classifier",                      category: "ai-ml" },
  { wikipedia: "Gradient boosting",                           category: "ai-ml" },
  { wikipedia: "XGBoost",                                     category: "ai-ml" },
  { wikipedia: "Autoencoder",                                 category: "ai-ml" },
  { wikipedia: "Epoch (machine learning)",                    category: "ai-ml" },
  { wikipedia: "Cross-validation (statistics)",               category: "ai-ml" },
  { wikipedia: "Confusion matrix",                            category: "ai-ml" },
  { wikipedia: "Precision and recall",                        category: "ai-ml" },
  { wikipedia: "F-score",                                     category: "ai-ml" },
  { wikipedia: "Hyperparameter (machine learning)",           category: "ai-ml" },
  { wikipedia: "Feature engineering",                         category: "ai-ml" },
  { wikipedia: "Data augmentation",                           category: "ai-ml" },
  { wikipedia: "Neural architecture search",                  category: "ai-ml" },
  { wikipedia: "Mixture of experts",                          category: "ai-ml" },
  { wikipedia: "RAG (retrieval-augmented generation)",        category: "ai-ml" },
  { wikipedia: "Multi-agent system",                          category: "ai-ml" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  SOFTWARE ENGINEERING
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Software engineering",                        category: "software-engineering" },
  { wikipedia: "Agile software development",                  category: "software-engineering" },
  { wikipedia: "Scrum (software development)",                category: "software-engineering" },
  { wikipedia: "Kanban (development)",                        category: "software-engineering" },
  { wikipedia: "Waterfall model",                             category: "software-engineering" },
  { wikipedia: "Behavior-driven development",                 category: "software-engineering" },
  { wikipedia: "Continuous integration",                      category: "software-engineering" },
  { wikipedia: "Continuous delivery",                         category: "software-engineering" },
  { wikipedia: "Code review",                                 category: "software-engineering" },
  { wikipedia: "Pair programming",                            category: "software-engineering" },
  { wikipedia: "Software architecture",                       category: "software-engineering" },
  { wikipedia: "Monolithic application",                      category: "software-engineering" },
  { wikipedia: "Event-driven architecture",                   category: "software-engineering" },
  { wikipedia: "Command–query responsibility segregation",    category: "software-engineering" },
  { wikipedia: "Event sourcing",                              category: "software-engineering" },
  { wikipedia: "Service-oriented architecture",               category: "software-engineering" },
  { wikipedia: "Domain-driven design",                        category: "software-engineering" },
  { wikipedia: "Version control",                             category: "software-engineering" },
  { wikipedia: "Git",                                         category: "software-engineering" },
  { wikipedia: "Software testing",                            category: "software-engineering" },
  { wikipedia: "Software deployment",                         category: "software-engineering" },
  { wikipedia: "Software maintenance",                        category: "software-engineering" },
  { wikipedia: "Unified Modeling Language",                   category: "software-engineering" },
  { wikipedia: "Open–closed principle",                       category: "software-engineering" },
  { wikipedia: "Liskov substitution principle",               category: "software-engineering" },
  { wikipedia: "Dependency inversion principle",              category: "software-engineering" },
  { wikipedia: "Extreme programming",                         category: "software-engineering" },
  { wikipedia: "Lean software development",                   category: "software-engineering" },
  { wikipedia: "Feature-driven development",                  category: "software-engineering" },
  { wikipedia: "Mob programming",                             category: "software-engineering" },
  { wikipedia: "Trunk-based development",                     category: "software-engineering" },
  { wikipedia: "Gitflow",                                     category: "software-engineering" },
  { wikipedia: "Software metric",                             category: "software-engineering" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  SECURITY & CRYPTOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Computer security",                           category: "security" },
  { wikipedia: "Encryption",                                  category: "security" },
  { wikipedia: "Public-key cryptography",                     category: "security" },
  { wikipedia: "Symmetric-key algorithm",                     category: "security" },
  { wikipedia: "Advanced Encryption Standard",                category: "security" },
  { wikipedia: "RSA (cryptosystem)",                          category: "security" },
  { wikipedia: "Elliptic-curve cryptography",                 category: "security" },
  { wikipedia: "SHA-2",                                       category: "security" },
  { wikipedia: "MD5",                                         category: "security" },
  { wikipedia: "Public key certificate",                      category: "security" },
  { wikipedia: "Public key infrastructure",                   category: "security" },
  { wikipedia: "Penetration test",                            category: "security" },
  { wikipedia: "Vulnerability (computer security)",           category: "security" },
  { wikipedia: "Exploit (computer security)",                 category: "security" },
  { wikipedia: "Zero-day vulnerability",                      category: "security" },
  { wikipedia: "Phishing",                                    category: "security" },
  { wikipedia: "Social engineering (security)",               category: "security" },
  { wikipedia: "Malware",                                     category: "security" },
  { wikipedia: "Ransomware",                                  category: "security" },
  { wikipedia: "Denial-of-service attack",                    category: "security" },
  { wikipedia: "OWASP",                                       category: "security" },
  { wikipedia: "Buffer overflow",                             category: "security" },
  { wikipedia: "Man-in-the-middle attack",                    category: "security" },
  { wikipedia: "Multi-factor authentication",                 category: "security" },
  { wikipedia: "Single sign-on",                              category: "security" },
  { wikipedia: "Role-based access control",                   category: "security" },
  { wikipedia: "Zero trust security model",                   category: "security" },
  { wikipedia: "Cryptographic hash function",                 category: "security" },
  { wikipedia: "Digital signature",                           category: "security" },
  { wikipedia: "Intrusion detection system",                  category: "security" },
  { wikipedia: "Honeypot (computing)",                        category: "security" },
  { wikipedia: "Blockchain",                                  category: "security" },
  { wikipedia: "Steganography",                               category: "security" },
  { wikipedia: "Side-channel attack",                         category: "security" },
  { wikipedia: "SQL injection",                               category: "security" },
  { wikipedia: "Rootkit",                                     category: "security" },
  { wikipedia: "Trojan horse (computing)",                    category: "security" },
  { wikipedia: "Botnets",                                     category: "security" },
  { wikipedia: "Cryptography",                                category: "security" },
  { wikipedia: "Key exchange",                                category: "security" },
  { wikipedia: "Salting (cryptography)",                      category: "security" },
  { wikipedia: "Two-factor authentication",                   category: "security" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CLOUD COMPUTING & DEVOPS
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Cloud computing",                             category: "cloud" },
  { wikipedia: "Infrastructure as a service",                 category: "cloud" },
  { wikipedia: "Platform as a service",                       category: "cloud" },
  { wikipedia: "Software as a service",                       category: "cloud" },
  { wikipedia: "Amazon Web Services",                         category: "cloud" },
  { wikipedia: "Microsoft Azure",                             category: "cloud" },
  { wikipedia: "Google Cloud Platform",                       category: "cloud" },
  { wikipedia: "Kubernetes",                                  category: "cloud" },
  { wikipedia: "Docker (software)",                           category: "cloud" },
  { wikipedia: "Containerization (computing)",                category: "cloud" },
  { wikipedia: "Function as a service",                       category: "cloud" },
  { wikipedia: "DevOps",                                      category: "cloud" },
  { wikipedia: "Infrastructure as code",                      category: "cloud" },
  { wikipedia: "Terraform (software)",                        category: "cloud" },
  { wikipedia: "Ansible (software)",                          category: "cloud" },
  { wikipedia: "Jenkins (software)",                          category: "cloud" },
  { wikipedia: "Feature flag",                                category: "cloud" },
  { wikipedia: "Site reliability engineering",                category: "cloud" },
  { wikipedia: "Service-level agreement",                     category: "cloud" },
  { wikipedia: "Service mesh",                                category: "cloud" },
  { wikipedia: "API gateway",                                 category: "cloud" },
  { wikipedia: "Message queue",                               category: "cloud" },
  { wikipedia: "Apache Kafka",                                category: "cloud" },
  { wikipedia: "RabbitMQ",                                    category: "cloud" },
  { wikipedia: "Observability (software)",                    category: "cloud" },
  { wikipedia: "Blue–green deployment",                       category: "cloud" },
  { wikipedia: "Helm (package manager)",                      category: "cloud" },
  { wikipedia: "Prometheus (software)",                       category: "cloud" },
  { wikipedia: "Grafana",                                     category: "cloud" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  DISTRIBUTED SYSTEMS
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Distributed computing",                       category: "computer-science" },
  { wikipedia: "Consistency (database systems)",              category: "computer-science" },
  { wikipedia: "Eventual consistency",                        category: "computer-science" },
  { wikipedia: "Consensus (computer science)",                category: "computer-science" },
  { wikipedia: "Paxos (computer science)",                    category: "computer-science" },
  { wikipedia: "Raft (algorithm)",                            category: "computer-science" },
  { wikipedia: "Two-phase commit protocol",                   category: "computer-science" },
  { wikipedia: "Circuit breaker (computing)",                 category: "computer-science" },
  { wikipedia: "Protocol Buffers",                            category: "computer-science" },
  { wikipedia: "Vector clock",                                category: "computer-science" },
  { wikipedia: "MapReduce",                                   category: "computer-science" },
  { wikipedia: "Apache Hadoop",                               category: "computer-science" },
  { wikipedia: "Apache Spark",                                category: "computer-science" },
  { wikipedia: "Conflict-free replicated data type",          category: "computer-science" },
  { wikipedia: "Consistent hashing",                          category: "computer-science" },
  { wikipedia: "Gossip protocol",                             category: "computer-science" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  MOBILE DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Mobile app development",                      category: "programming" },
  { wikipedia: "React Native",                                category: "programming" },
  { wikipedia: "Flutter (software)",                          category: "programming" },
  { wikipedia: "SwiftUI",                                     category: "programming" },
  { wikipedia: "Jetpack Compose",                             category: "programming" },
  { wikipedia: "Android (operating system)",                  category: "programming" },
  { wikipedia: "IOS",                                         category: "programming" },
  { wikipedia: "Push notification",                           category: "programming" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMPUTER GRAPHICS & GAME DEVELOPMENT
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Computer graphics",                           category: "computer-science" },
  { wikipedia: "Rendering (computer graphics)",               category: "computer-science" },
  { wikipedia: "Shader",                                      category: "computer-science" },
  { wikipedia: "Game engine",                                 category: "computer-science" },
  { wikipedia: "Unity (game engine)",                         category: "computer-science" },
  { wikipedia: "Unreal Engine",                               category: "computer-science" },
  { wikipedia: "OpenGL",                                      category: "computer-science" },
  { wikipedia: "Vulkan (API)",                                category: "computer-science" },
  { wikipedia: "Ray tracing (graphics)",                      category: "computer-science" },
  { wikipedia: "Texture mapping",                             category: "computer-science" },
  { wikipedia: "Rasterisation",                               category: "computer-science" },

  // ═══════════════════════════════════════════════════════════════════════════
  //  FOUNDATIONAL COMPUTER SCIENCE
  // ═══════════════════════════════════════════════════════════════════════════
  { wikipedia: "Binary number",                               category: "computer-science" },
  { wikipedia: "Bit",                                         category: "computer-science" },
  { wikipedia: "Byte",                                        category: "computer-science" },
  { wikipedia: "Boolean algebra",                             category: "computer-science" },
  { wikipedia: "Logic gate",                                  category: "computer-science" },
  { wikipedia: "Floating-point arithmetic",                   category: "computer-science" },
  { wikipedia: "Integer overflow",                            category: "computer-science" },
  { wikipedia: "Endianness",                                  category: "computer-science" },
  { wikipedia: "Checksum",                                    category: "computer-science" },
  { wikipedia: "Data compression",                            category: "computer-science" },
  { wikipedia: "Lossless compression",                        category: "computer-science" },
  { wikipedia: "Lossy compression",                           category: "computer-science" },
  { wikipedia: "Information theory",                          category: "computer-science" },
  { wikipedia: "Shannon entropy",                             category: "computer-science" },
  { wikipedia: "Unicode",                                     category: "computer-science" },
  { wikipedia: "UTF-8",                                       category: "computer-science" },
  { wikipedia: "ASCII",                                       category: "computer-science" },
  { wikipedia: "Base64",                                      category: "computer-science" },
  { wikipedia: "Moore's law",                                 category: "computer-science" },
  { wikipedia: "Quantum computing",                           category: "computer-science" },
  { wikipedia: "Qubit",                                       category: "computer-science" },
  { wikipedia: "Edge computing",                              category: "computer-science" },
  { wikipedia: "Augmented reality",                           category: "computer-science" },
  { wikipedia: "Virtual reality",                             category: "computer-science" },
  { wikipedia: "Open source",                                 category: "computer-science" },
  { wikipedia: "Search engine (computing)",                   category: "computer-science" },
  { wikipedia: "Web crawler",                                 category: "computer-science" },
  { wikipedia: "PageRank",                                    category: "computer-science" },
  { wikipedia: "Blockchain",                                  category: "computer-science" },
  { wikipedia: "Smart contract",                              category: "computer-science" },
  { wikipedia: "Cryptocurrency",                              category: "computer-science" },
  { wikipedia: "Digital twin",                                category: "computer-science" },
  { wikipedia: "User interface",                              category: "computer-science" },
  { wikipedia: "User experience design",                      category: "computer-science" },
  { wikipedia: "Accessibility",                               category: "computer-science" },
  { wikipedia: "Software",                                    category: "computer-science" },
  { wikipedia: "Hardware (computing)",                        category: "computer-science" },
  { wikipedia: "Interrupt handler",                           category: "computer-science" },
  { wikipedia: "Software patent",                             category: "computer-science" },
  { wikipedia: "Open-source software",                        category: "computer-science" },
  { wikipedia: "Free software",                               category: "computer-science" },
  { wikipedia: "API versioning",                              category: "computer-science" },
  { wikipedia: "Rate limiting",                               category: "computer-science" },
  { wikipedia: "Idempotence",                                 category: "computer-science" },
  { wikipedia: "Fault tolerance",                             category: "computer-science" },
  { wikipedia: "Graceful degradation",                        category: "computer-science" },
  { wikipedia: "Technical specification",                     category: "computer-science" },
  { wikipedia: "Software license",                            category: "computer-science" },
  { wikipedia: "MIT License",                                 category: "computer-science" },
  { wikipedia: "GNU General Public License",                  category: "computer-science" },
];

// ── helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

function truncate(text: string): string {
  if (text.length <= MAX_DEF_LEN) return text;
  const cut = text.lastIndexOf(" ", MAX_DEF_LEN);
  return text.substring(0, cut > 0 ? cut : MAX_DEF_LEN) + "…";
}

async function fetchWikiSummary(
  title: string
): Promise<{ title: string; extract: string } | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FutureHubDictionaryImporter/1.0 (student project)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      type?: string;
      title: string;
      extract?: string;
      description?: string;
    };
    // Skip disambiguation pages
    if (data.type === "disambiguation") return null;
    const extract = data.extract?.trim() || data.description?.trim() || "";
    if (!extract || extract.length < 30) return null;
    return { title: data.title, extract };
  } catch {
    return null;
  }
}

// ── progress tracking ─────────────────────────────────────────────────────────
function loadProgress(): Set<string> {
  if (!existsSync(PROGRESS_FILE)) return new Set();
  try {
    const raw = JSON.parse(readFileSync(PROGRESS_FILE, "utf8")) as string[];
    return new Set(raw);
  } catch {
    return new Set();
  }
}

function saveProgress(done: Set<string>) {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...done], null, 2));
}

// ── tag upsert cache ──────────────────────────────────────────────────────────
const tagIdCache = new Map<string, number>();

async function getOrCreateTagId(name: string): Promise<number | null> {
  if (tagIdCache.has(name)) return tagIdCache.get(name)!;
  const { data } = await supabase
    .from("tags")
    .upsert({ name }, { onConflict: "name" })
    .select("id")
    .single();
  if (!data) return null;
  tagIdCache.set(name, data.id);
  return data.id;
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀  FutureHub Dictionary Importer`);
  console.log(`   Terms planned : ${TERMS.length}`);
  console.log(`   Supabase URL  : ${SUPABASE_URL}`);
  console.log(`   Author UUID   : ${AUTHOR_UUID}\n`);

  const done = loadProgress();
  console.log(`   Skipping ${done.size} already-imported slugs (from previous run)\n`);

  // Deduplicate the TERMS list by wikipedia title
  const seen = new Set<string>();
  const uniqueTerms = TERMS.filter((t) => {
    if (seen.has(t.wikipedia)) return false;
    seen.add(t.wikipedia);
    return true;
  });

  let inserted = 0;
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < uniqueTerms.length; i++) {
    const { wikipedia, category } = uniqueTerms[i];
    const progressSlug = makeSlug(wikipedia);

    if (done.has(progressSlug)) {
      skipped++;
      continue;
    }

    process.stdout.write(
      `[${String(i + 1).padStart(4)}/${uniqueTerms.length}] ${wikipedia.padEnd(55, " ")} `
    );

    const wiki = await fetchWikiSummary(wikipedia);

    if (!wiki) {
      console.log("✗ not found");
      notFound++;
      done.add(progressSlug); // mark so we don't retry
      saveProgress(done);
      await sleep(RATE_MS);
      continue;
    }

    const slug = makeSlug(wiki.title);
    const definition = truncate(wiki.extract);

    // Check if slug already exists in DB
    const { data: existing } = await supabase
      .from("dictionary_entries")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      console.log("→ exists");
      done.add(progressSlug);
      saveProgress(done);
      skipped++;
      await sleep(RATE_MS);
      continue;
    }

    // Insert entry
    const { data: entry, error } = await supabase
      .from("dictionary_entries")
      .insert({
        term: wiki.title,
        slug,
        language_code: "en",
        definition,
        status: "approved",
        created_by: AUTHOR_UUID,
        views: Math.floor(Math.random() * 300) + 10,
        saves: Math.floor(Math.random() * 80),
      })
      .select("id")
      .single();

    if (error || !entry) {
      console.log(`✗ db error: ${error?.message}`);
      await sleep(RATE_MS);
      continue;
    }

    // Insert revision
    await supabase.from("dictionary_revisions").insert({
      entry_id: entry.id,
      revision_number: 1,
      term: wiki.title,
      reading: null,
      language_code: "en",
      definition,
      translations_snapshot: [],
      examples_snapshot: [],
      tags_snapshot: [],
      status: "approved",
      created_by: AUTHOR_UUID,
      change_summary: "Imported from Wikipedia",
    });

    // Update current_revision_id
    const { data: rev } = await supabase
      .from("dictionary_revisions")
      .select("id")
      .eq("entry_id", entry.id)
      .eq("revision_number", 1)
      .single();

    if (rev) {
      await supabase
        .from("dictionary_entries")
        .update({ current_revision_id: rev.id })
        .eq("id", entry.id);
    }

    // Link tags
    const tagNames = CATEGORY_TAGS[category] ?? ["computer-science"];
    for (const tagName of tagNames) {
      const tagId = await getOrCreateTagId(tagName);
      if (tagId) {
        await supabase
          .from("dictionary_entry_tags")
          .upsert({ entry_id: entry.id, tag_id: tagId }, { onConflict: "entry_id,tag_id" });
      }
    }

    console.log(`✓ inserted`);
    inserted++;
    done.add(progressSlug);
    saveProgress(done);

    await sleep(RATE_MS);
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`✓  Inserted  : ${inserted}`);
  console.log(`→  Skipped   : ${skipped}  (already existed)`);
  console.log(`✗  Not found : ${notFound}  (Wikipedia 404 / disambiguation)`);
  console.log(`─────────────────────────────────────────────\n`);

  if (inserted > 0) {
    console.log(`Open your dictionary at /dictionary to see the new entries.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
