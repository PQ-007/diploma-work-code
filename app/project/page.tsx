"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Folder } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Difficulty = "beginner" | "intermediate" | "advanced";

interface Tutorial {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  language: string;
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
  category?: string;
}

interface CuratedSection {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const filterTags = [
  "HTML",
  "JavaScript",
  "React",
  "Lua",
  "AI",
  "Data Science",
  "Python",
  "Java",
  "Beginner",
  "Intermediate",
  "Advanced",
];

const curatedSections: CuratedSection[] = [
  {
    id: "beginner",
    emoji: "🌟",
    title: "Beginner-friendly picks",
    description:
      "Starting your very first project? Explore some of these project ideas designed to complement just taking one of our HTML, Python, JS courses.",
  },
  {
    id: "ai",
    emoji: "🤖",
    title: "Get AI-ready",
    description:
      "Curious about AI? Dive into projects that'll help you explore the latest tools and see what all the buzz is about.",
  },
  {
    id: "hackathon",
    emoji: "🚀",
    title: "Hackathon starter pack",
    description:
      "Get your next project off the ground with practical guides to setting up your code environment and deploying your app.",
  },
];

const tutorials: Tutorial[] = [
  // ── Beginner-friendly picks ──
  {
    id: "1",
    slug: "create-a-gif-with-python",
    title: "Create a GIF with Python",
    thumbnail: "/images/tutorials/gif-python.png",
    language: "Python",
    difficulty: "beginner",
    tags: ["Python", "Beginner"],
    createdAt: "2025-06-01",
    category: "beginner",
  },
  {
    id: "2",
    slug: "build-a-word-guessing-game",
    title: "Build a Word Guessing Game",
    thumbnail: "/images/tutorials/word-game.png",
    language: "Python",
    difficulty: "beginner",
    tags: ["Python", "Beginner"],
    createdAt: "2025-05-20",
    category: "beginner",
  },
  {
    id: "3",
    slug: "set-up-a-gui-with-java",
    title: "Set up a GUI with Java",
    thumbnail: "/images/tutorials/gui-java.png",
    language: "Java",
    difficulty: "beginner",
    tags: ["Java", "Beginner"],
    createdAt: "2025-05-15",
    category: "beginner",
  },
  {
    id: "4",
    slug: "animate-images-with-css-keyframes",
    title: "Animate Images with CSS Keyframes",
    thumbnail: "/images/tutorials/css-keyframes.png",
    language: "HTML",
    difficulty: "beginner",
    tags: ["HTML", "Beginner"],
    createdAt: "2025-05-10",
    category: "beginner",
  },

  // ── Get AI-ready ──
  {
    id: "5",
    slug: "generate-a-blog-with-openai",
    title: "Generate a Blog with OpenAI",
    thumbnail: "/images/tutorials/openai-blog.png",
    language: "AI",
    difficulty: "intermediate",
    tags: ["AI", "Intermediate"],
    createdAt: "2025-07-10",
    category: "ai",
  },
  {
    id: "6",
    slug: "build-a-search-engine-with-exa",
    title: "Build a Search Engine with Exa",
    thumbnail: "/images/tutorials/exa-search.png",
    language: "Python",
    difficulty: "advanced",
    tags: ["Python", "Advanced"],
    createdAt: "2025-07-05",
    category: "ai",
  },
  {
    id: "7",
    slug: "create-a-voice-virtual-assistant",
    title: "Create a Voice Virtual Assistant",
    thumbnail: "/images/tutorials/voice-assistant.png",
    language: "Python",
    difficulty: "intermediate",
    tags: ["Python", "Intermediate"],
    createdAt: "2025-06-28",
    category: "ai",
  },
  {
    id: "8",
    slug: "generate-a-poem-with-google-gemini",
    title: "Generate a Poem with Google Gemini",
    thumbnail: "/images/tutorials/gemini-poem.png",
    language: "JavaScript",
    difficulty: "intermediate",
    tags: ["JavaScript", "Intermediate"],
    createdAt: "2025-06-20",
    category: "ai",
  },

  // ── Hackathon starter pack ──
  {
    id: "9",
    slug: "run-a-website-locally-with-html",
    title: "Run a Website Locally with HTML",
    thumbnail: "/images/tutorials/localhost-html.png",
    language: "HTML",
    difficulty: "beginner",
    tags: ["HTML", "Beginner"],
    createdAt: "2025-08-01",
    category: "hackathon",
  },
  {
    id: "10",
    slug: "create-a-react-app-with-vite",
    title: "Create a React App with Vite",
    thumbnail: "/images/tutorials/react-vite.png",
    language: "React",
    difficulty: "intermediate",
    tags: ["React", "Intermediate"],
    createdAt: "2025-07-25",
    category: "hackathon",
  },
  {
    id: "11",
    slug: "deploy-a-website-with-vercel",
    title: "Deploy a Website with Vercel",
    thumbnail: "/images/tutorials/vercel-deploy.png",
    language: "JavaScript",
    difficulty: "intermediate",
    tags: ["JavaScript", "Intermediate"],
    createdAt: "2025-07-20",
    category: "hackathon",
  },
  {
    id: "12",
    slug: "debug-your-web-app-in-vs-code",
    title: "Debug Your Web App in VS Code",
    thumbnail: "/images/tutorials/vscode-debug.png",
    language: "JavaScript",
    difficulty: "intermediate",
    tags: ["JavaScript", "Intermediate"],
    createdAt: "2025-07-15",
    category: "hackathon",
  },

  // ── Extra tutorials (appear only in "All project tutorials") ──
  {
    id: "13",
    slug: "analyze-baseball-stats-with-pandas",
    title: "Analyze Baseball Stats with Pandas and…",
    thumbnail: "/images/tutorials/baseball-stats.png",
    language: "Python",
    difficulty: "intermediate",
    tags: ["Python", "Data Science", "Intermediate"],
    createdAt: "2025-09-01",
  },
  {
    id: "14",
    slug: "create-a-minecraft-mod-with-java",
    title: "Create a Minecraft Mod with Java",
    thumbnail: "/images/tutorials/minecraft-mod.png",
    language: "Java",
    difficulty: "intermediate",
    tags: ["Java", "Intermediate"],
    createdAt: "2025-08-20",
  },
  {
    id: "15",
    slug: "create-an-rpg-map-with-love-and-lua",
    title: "Create an RPG Map with LÖVE and Lua",
    thumbnail: "/images/tutorials/rpg-map.png",
    language: "Lua",
    difficulty: "intermediate",
    tags: ["Lua", "Intermediate"],
    createdAt: "2025-08-15",
  },
  {
    id: "16",
    slug: "analyze-twitch-data-with-sqlite",
    title: "Analyze Twitch Data with SQLite",
    thumbnail: "/images/tutorials/twitch-data.png",
    language: "Data Science",
    difficulty: "beginner",
    tags: ["Data Science", "Beginner"],
    createdAt: "2025-08-10",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const difficultyMeta: Record<Difficulty, { label: string; bars: number }> = {
  beginner: { label: "BEGINNER", bars: 1 },
  intermediate: { label: "INTERMEDIATE", bars: 2 },
  advanced: { label: "ADVANCED", bars: 3 },
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, bars } = difficultyMeta[difficulty];
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted/60 text-muted-foreground"
    >
      {/* tiny signal-strength bars */}
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

/* ------------------------------------------------------------------ */
/*  Tutorial card (horizontal scroll variant)                          */
/* ------------------------------------------------------------------ */

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link
      href={`/project/${tutorial.slug}`}
      className="group flex-shrink-0 w-[220px] sm:w-[240px] snap-start"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg h-full">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
          <Image
            src={tutorial.thumbnail}
            alt={tutorial.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="240px"
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="space-y-2 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Tutorial
          </span>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">
            {tutorial.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            >
              {tutorial.language}
            </Badge>
            <DifficultyBadge difficulty={tutorial.difficulty} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Tutorial card (grid variant – for "All project tutorials")         */
/* ------------------------------------------------------------------ */

function TutorialGridCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link href={`/project/${tutorial.slug}`} className="group">
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg h-full">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex items-center justify-center">
          <Image
            src={tutorial.thumbnail}
            alt={tutorial.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="space-y-2 p-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Tutorial
          </span>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">
            {tutorial.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            >
              {tutorial.language}
            </Badge>
            <DifficultyBadge difficulty={tutorial.difficulty} />
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
  items: Tutorial[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>{section.emoji}</span>
          {section.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {section.description}
        </p>
      </div>

      {/* Scrollable row */}
      <div className="relative group/row">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 shadow-md backdrop-blur opacity-0 transition-opacity group-hover/row:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-2"
        >
          {items.map((t) => (
            <TutorialCard key={t.id} tutorial={t} />
          ))}
        </div>

        {/* Right arrow */}
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
  activeTags,
  onToggle,
}: {
  tags: string[];
  activeTags: Set<string>;
  onToggle: (tag: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -200 : 200,
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
          const isActive = activeTags.has(tag);
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

export default function ProjectPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "a-z" | "z-a">(
    "latest",
  );

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const matchesFilter = (tutorial: Tutorial) => {
    if (
      searchQuery &&
      !tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tutorial.language.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (activeTags.size > 0) {
      const tutorialTags = new Set(tutorial.tags.map((t) => t.toLowerCase()));
      for (const tag of activeTags) {
        if (!tutorialTags.has(tag.toLowerCase())) return false;
      }
    }
    return true;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const curatedItems = useMemo(
    () =>
      curatedSections.map((section) => ({
        section,
        items: tutorials
          .filter((t) => t.category === section.id)
          .filter(matchesFilter),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, activeTags],
  );

  const allTutorials = useMemo(() => {
    const filtered = tutorials.filter(matchesFilter);
    switch (sortBy) {
      case "latest":
        return [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "oldest":
        return [...filtered].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case "a-z":
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return [...filtered].sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filtered;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTags, sortBy]);

  return (
    <div className="space-y-10 pb-16">
      {/* ── Search + Filter Tags ── */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <TagBar
          tags={filterTags}
          activeTags={activeTags}
          onToggle={toggleTag}
        />
      </div>

      {/* ── Curated Sections ── */}
      {curatedItems.map(({ section, items }) => (
        <CuratedRow key={section.id} section={section} items={items} />
      ))}

      {/* ── All project tutorials ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📚</span> All project tutorials
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Explore our full collection of project tutorials written by expert
              developers, educators and community members.
            </p>
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="a-z">A → Z</SelectItem>
              <SelectItem value="z-a">Z → A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {allTutorials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {allTutorials.map((t) => (
              <TutorialGridCard key={t.id} tutorial={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No tutorials found matching your criteria.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
