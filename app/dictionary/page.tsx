"use client";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search,
  Bookmark,
  ExternalLink,
  LayoutGrid,
  List,
  Clock,
  CircleHelp,
  Flame,
  Plus,
} from "lucide-react";

// --- Types ---
interface Term {
  id: string;
  name: string;
  description: string;
  category: string;
  letter: string;
}

interface TrendingArticle {
  id: string;
  title: string;
  author: string;
  avatar: string;
  readTime: string;
}

// --- Mock Data ---
const featuredTerm = {
  name: "Quantum Computing",
  description:
    "A type of computing that takes advantage of quantum phenomena like superposition and entanglement. Quantum computers can solve problems that are too complex for classical computers by using qubits instead of bits.",
  image:
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80",
};

const allTerms: Term[] = [
  {
    id: "1",
    name: "Artificial Intelligence",
    description:
      "Simulation of human intelligence processes by machines, especially computer systems, including learning...",
    category: "MACHINE LEARNING",
    letter: "A",
  },
  {
    id: "2",
    name: "Augmented Reality",
    description:
      "An interactive experience of a real-world environment where the objects that reside in the real world are...",
    category: "VIRTUAL SYSTEMS",
    letter: "A",
  },
  {
    id: "3",
    name: "Agile Development",
    description:
      "A set of practices intended to improve the effectiveness of software development professionals, tea...",
    category: "SOFTWARE ENGINEERING",
    letter: "A",
  },
  {
    id: "4",
    name: "Application Interface",
    description:
      "API is a set of definitions and protocols for building and integrating application software, allowing products to...",
    category: "WEB SERVICES",
    letter: "A",
  },
  {
    id: "5",
    name: "Autonomous Systems",
    description:
      "Technology that can perform a series of tasks without human intervention, using sensors and complex decision...",
    category: "ROBOTICS",
    letter: "A",
  },
  {
    id: "6",
    name: "Asymmetric Crypto",
    description:
      "Also known as public-key cryptography, it uses a pair — one public and one private — om...",
    category: "CYBERSECURITY",
    letter: "A",
  },
  {
    id: "7",
    name: "Binary Search",
    description:
      "A search algorithm that finds the position of a target value within a sorted array by repeatedly dividing the range...",
    category: "ALGORITHMS",
    letter: "B",
  },
  {
    id: "8",
    name: "Blockchain",
    description:
      "A decentralized, distributed ledger technology that records transactions across many computers in a verifiable way...",
    category: "DISTRIBUTED SYSTEMS",
    letter: "B",
  },
  {
    id: "9",
    name: "Big O Notation",
    description:
      "A mathematical notation that describes the limiting behavior of a function when the argument tends towards infinity...",
    category: "ALGORITHMS",
    letter: "B",
  },
  {
    id: "10",
    name: "Cloud Computing",
    description:
      "On-demand availability of computer system resources, especially data storage and computing power, without direct active management...",
    category: "INFRASTRUCTURE",
    letter: "C",
  },
  {
    id: "11",
    name: "Containerization",
    description:
      "A lightweight form of virtualization that packages an application and its dependencies together for consistent deployment...",
    category: "DEVOPS",
    letter: "C",
  },
  {
    id: "12",
    name: "CI/CD Pipeline",
    description:
      "Continuous Integration and Continuous Deployment — an automated process for building, testing, and deploying software...",
    category: "DEVOPS",
    letter: "C",
  },
  {
    id: "13",
    name: "Data Structure",
    description:
      "A specialized format for organizing, processing, retrieving and storing data so that it can be accessed efficiently...",
    category: "COMPUTER SCIENCE",
    letter: "D",
  },
  {
    id: "14",
    name: "Deep Learning",
    description:
      "A subset of machine learning based on artificial neural networks with representation learning at multiple levels of abstraction...",
    category: "MACHINE LEARNING",
    letter: "D",
  },
  {
    id: "15",
    name: "Edge Computing",
    description:
      "A distributed computing paradigm that brings computation and data storage closer to the sources of data...",
    category: "INFRASTRUCTURE",
    letter: "E",
  },
  {
    id: "16",
    name: "Encryption",
    description:
      "The process of converting information into a code to prevent unauthorized access, ensuring data confidentiality...",
    category: "CYBERSECURITY",
    letter: "E",
  },
];

const popularTopics = [
  "#machine-learning",
  "#artificial-intelligence",
  "#cybersecurity",
  "#blockchain",
  "#rust",
  "#web-development",
];

const trendingArticles: TrendingArticle[] = [
  {
    id: "1",
    title: "Supabase: Building Modern Backends",
    author: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    readTime: "8 min",
  },
  {
    id: "2",
    title: "Understanding LLMs & the Future of AI",
    author: "dev_master",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DevMaster",
    readTime: "12 min",
  },
  {
    id: "3",
    title: "Rust vs. Go: Performance & Safety Comparison",
    author: "Mike Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    readTime: "10 min",
  },
];

const letterTabs = ["A", "B", "C", "D", "E", "AI", "ML", "#"];

// --- End of Data ---

export default function DictionaryPage() {
  const { t } = useLanguage();
  const [activeLetter, setActiveLetter] = useState("A");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = useMemo(() => {
    let terms = allTerms;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      terms = terms.filter(
        (term) =>
          term.name.toLowerCase().includes(q) ||
          term.description.toLowerCase().includes(q) ||
          term.category.toLowerCase().includes(q),
      );
    } else {
      // Letter/category filter only when not searching
      if (activeLetter === "AI") {
        terms = terms.filter(
          (t) =>
            t.category.toLowerCase().includes("machine learning") ||
            t.category.toLowerCase().includes("computer science"),
        );
      } else if (activeLetter === "ML") {
        terms = terms.filter((t) =>
          t.category.toLowerCase().includes("machine learning"),
        );
      } else if (activeLetter === "#") {
        terms = terms; // show all
      } else {
        terms = terms.filter((t) => t.letter === activeLetter);
      }
    }

    return terms;
  }, [activeLetter, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">
            Welcome to the Dictionary
          </h1>
          <p className="text-sm text-muted-foreground">
            Learn key concepts and terminologies.
          </p>
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-7xl space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search terms, definitions, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Featured Term of the Day */}
            <Card className="border-border/40 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-[280px] h-[200px] md:h-auto overflow-hidden flex-shrink-0">
                  <img
                    src={featuredTerm.image}
                    alt={featuredTerm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-5 flex flex-col justify-center flex-1">
                  <Badge
                    variant="secondary"
                    className="w-fit mb-3 text-xs font-semibold tracking-wide uppercase"
                  >
                    Featured Term of the Day
                  </Badge>
                  <h2 className="text-xl font-bold mb-2">
                    {featuredTerm.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {featuredTerm.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button size="sm" className="text-xs">
                      Full Definition
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                    >
                      <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                      Save Term
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Browse Glossary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Browse Glossary</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-3.5 w-3.5 mr-1" />
                    List
                  </Button>
                </div>
              </div>

              {/* Letter Tabs */}
              <Tabs
                value={activeLetter}
                onValueChange={(val) => {
                  setActiveLetter(val);
                  setSearchQuery("");
                }}
                className="mb-5"
              >
                <TabsList className="h-9 bg-muted/40 backdrop-blur-sm flex-wrap gap-1">
                  {letterTabs.map((letter) => (
                    <TabsTrigger
                      key={letter}
                      value={letter}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1 text-xs font-medium"
                    >
                      {letter}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Terms Grid / List */}
              {filteredTerms.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No terms found
                  {searchQuery ? ` for "${searchQuery}"` : " for this letter"}.
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTerms.map((term) => (
                    <Card
                      key={term.id}
                      className="border-border/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-semibold group-hover:text-foreground/90 transition-colors">
                            {term.name}
                          </h3>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {term.description}
                        </p>
                        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {term.category}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTerms.map((term) => (
                    <Card
                      key={term.id}
                      className="border-border/40 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                    >
                      <CardContent className="p-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold group-hover:text-foreground/90 transition-colors truncate">
                              {term.name}
                            </h3>
                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase flex-shrink-0">
                              {term.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
                            {term.description}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            {/* Popular Topics */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                Popular Topics
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {popularTopics.map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trending Articles */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                Trending Articles
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  {trendingArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-start gap-3 px-3 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                        <AvatarImage src={article.avatar} />
                        <AvatarFallback className="text-xs">
                          {article.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-snug line-clamp-2">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <span>{article.author}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Can't find the term? */}
            <Card className="border-border/40">
              <CardContent className="p-4 text-center space-y-2">
                <CircleHelp className="h-6 w-6 mx-auto text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Can&apos;t find the term?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Feel free to add new terms to the dictionary that you think
                  can help the community!
                </p>
                <Button size="sm" className="text-xs mt-1">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add New Term
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
