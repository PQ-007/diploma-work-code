"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUp,
  Bookmark,
  Calendar,
  Check,
  Github,
  Hash,
  Heart,
  MessageCircle,
  Share2,
  Terminal,
  Twitter,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { components as mdxComponents } from "@/mdx/mdx-components";

// Import MDX components - you'll need to install these packages:
// npm install @mdx-js/react next-mdx-remote
// OR for client-side only:
// npm install @mdx-js/mdx
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

// --- Types & Mock Data ---

const articleData = {
  id: "1",
  title: "Building Scalable React Applications: A Complete Guide",
  subtitle:
    "Architecting for performance, maintainability, and developer experience in the modern web ecosystem.",
  author: {
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: "Staff Engineer @ Vercel",
    username: "@sarahchen",
    verified: true,
    bio: "Passionate about React performance, state management, and modern component architecture. Building the future of the web.",
    github: "sarahchen-dev",
    twitter: "sarahchen_tweets",
  },
  publishedAt: "Dec 15, 2024",
  readTime: 12,
  tags: ["React", "Architecture", "Performance", "TypeScript"],
  stats: {
    views: "15.4k",
    likes: 847,
    comments: 156,
  },
  coverImage:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80",
};

type TocEntry = { id: string; text: string; level: number };

// --- Sub-Components ---

// Custom ProTip component for MDX
const ProTip = ({ children }: { children: React.ReactNode }) => (
  <div className="not-prose my-10 bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <Terminal className="w-24 h-24 text-primary" />
    </div>
    <h4 className="flex items-center gap-2 font-bold text-primary mb-2">
      <Check className="w-5 h-5" />
      Pro Tip
    </h4>
    <div className="text-muted-foreground relative z-10">{children}</div>
  </div>
);

// 3. Polished Table of Contents
const TocItem = ({ item, activeId }: { item: TocEntry; activeId: string }) => {
  const isActive = activeId === item.id;
  const indentPx = Math.max(0, (item.level - 1) * 12);

  return (
    <div className="relative">
      <a
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          document
            .getElementById(item.id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `#${item.id}`);
          }
        }}
        className={`flex items-center gap-2 py-1 text-sm transition-colors duration-150 ${
          isActive
            ? "text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        style={{ paddingLeft: `${indentPx}px` }}
      >
        {item.text}
      </a>
    </div>
  );
};

// 4. Floating Interaction Bar
const FloatingActionBar = ({
  likes,
  isLiked,
  onLike,
  onBookmark,
  isBookmarked,
}: any) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border shadow-2xl rounded-full ring-1 ring-black/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLike}
          className={`rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ${
            isLiked ? "text-red-500 bg-red-50" : "text-muted-foreground"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBookmark}
          className={`rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors ${
            isBookmarked ? "text-blue-500" : "text-muted-foreground"
          }`}
        >
          <Bookmark
            className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
          />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// 5. Back to Top Button
const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-24 right-4 z-50 rounded-full shadow-lg h-12 w-12 bg-primary hover:bg-primary/90 transition-opacity duration-300"
    >
      <ArrowUp className="w-5 h-5" />
      <span className="sr-only">Scroll to top</span>
    </Button>
  );
};

// 6. Author Box Component
const AuthorBox = ({ author }: { author: typeof articleData.author }) => (
  <Card className="p-6 mt-12 bg-muted/30 border-primary/20">
    <div className="flex items-center gap-4 mb-4">
      <Avatar className="h-16 w-16 border-2 border-primary">
        <AvatarImage src={author.avatar} />
        <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {author.name}
          {author.verified && (
            <Check className="w-4 h-4 text-primary fill-primary/20" />
          )}
        </h3>
        <p className="text-sm text-primary font-medium">{author.role}</p>
        <p className="text-xs text-muted-foreground">{author.username}</p>
      </div>
    </div>
    <p className="text-sm text-muted-foreground mb-4">{author.bio}</p>
    <div className="flex gap-3">
      {author.twitter && (
        <a
          href={`https://twitter.com/${author.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-blue-400 border-blue-400 hover:bg-blue-50/50"
          >
            <Twitter className="w-4 h-4" />
            Follow
          </Button>
        </a>
      )}
      {author.github && (
        <a
          href={`https://github.com/${author.github}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-foreground/80 hover:bg-muted"
          >
            <Github className="w-4 h-4" />
            GitHub
          </Button>
        </a>
      )}
    </div>
  </Card>
);

// --- Main Page Component ---

export default function ModernArticlePage() {
  const [activeSection, setActiveSection] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tocItems, setTocItems] = useState<TocEntry[]>([]);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  // Load and serialize MDX content
  useEffect(() => {
    const loadMDX = async () => {
      try {
        if (!slug) return;

        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          throw new Error(`Failed to load article: ${response.statusText}`);
        }

        const { content } = await response.json();
        const body = content.replace(/^---[\s\S]*?---\s*/, "");
        const serialized = await serialize(body);
        setMdxSource(serialized);
      } catch (error) {
        console.error("Error loading MDX:", error);
        setError("Failed to load article content.");
      } finally {
        setLoading(false);
      }
    };

    loadMDX();
  }, [slug]);

  const headingSelector = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]";

  // Build TOC from rendered headings (h1–h6) once MDX is available, scoped to article content
  useEffect(() => {
    if (!mdxSource || !articleRef.current) return;

    const headings = Array.from(
      articleRef.current.querySelectorAll<HTMLElement>(headingSelector)
    );

    const items = headings.map((h, index) => {
      const level = Number(h.tagName.replace("H", ""));
      const text = h.textContent?.trim() || "";
      const rawId = h.id || text || `heading-${index}`;
      const id = encodeURIComponent(rawId);

      if (!h.id) h.id = id;

      return { id, text, level } as TocEntry;
    });

    setTocItems(items);
  }, [mdxSource]);

  // Intersection Observer for TOC (scoped to article content)
  useEffect(() => {
    if (!mdxSource || !articleRef.current) return;

    const headings = Array.from(
      articleRef.current.querySelectorAll<HTMLElement>(headingSelector)
    );

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find((entry) => entry.isIntersecting);
        if (intersectingEntry) {
          setActiveSection(intersectingEntry.target.id);
          return;
        }

        const topVisibleSection = headings
          .map((section) => ({
            id: section.id,
            top: section.getBoundingClientRect().top,
          }))
          .filter((section) => section.top < 200)
          .sort((a, b) => b.top - a.top)[0];

        if (topVisibleSection) setActiveSection(topVisibleSection.id);
      },
      { rootMargin: "-100px 0% -80% 0%" }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [mdxSource]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary">
      <div className="container mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[72px_minmax(0,1fr)_240px] gap-8">
        {/* --- Left Reaction Column (Qiita-like) --- */}
        <aside className="hidden lg:flex flex-col items-center gap-5 sticky top-28 h-fit text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full border ${
              isLiked
                ? "text-red-500 border-red-200 bg-red-50"
                : "border-border hover:bg-muted"
            }`}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          <span className="text-xs font-medium">
            {articleData.stats.likes + (isLiked ? 1 : 0)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border hover:bg-muted"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border hover:bg-muted"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="min-w-0">
          <Card className="bg-card/50 border-border/60 shadow-sm">
            <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-6">
              {error && <div className="text-sm text-red-500">{error}</div>}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {articleData.publishedAt}
                </span>
                <span>•</span>
                <span>{articleData.readTime} min read</span>
                <span>•</span>
                <span>{articleData.stats.views} views</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground">
                {articleData.title}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {articleData.subtitle}
              </p>

              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={articleData.author.avatar} />
                  <AvatarFallback>
                    {articleData.author.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {articleData.author.name}
                    </span>
                    {articleData.author.verified && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] uppercase tracking-wide"
                      >
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {articleData.author.role}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {articleData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="px-6 py-6 sm:px-8 sm:py-8" ref={articleRef}>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : mdxSource ? (
                <article
                  className="prose dark:prose-invert prose-headings:font-semibold prose-h2:mt-10 prose-h3:mt-8
                  prose-p:text-[15px] prose-p:leading-7 prose-li:text-[15px] prose-li:leading-7 max-w-none"
                >
                  <MDXRemote
                    {...mdxSource}
                    components={{ ...mdxComponents, ProTip }}
                  />
                </article>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  Failed to load article content
                </div>
              )}
            </div>
          </Card>

          <div className="mt-8">
            <AuthorBox author={articleData.author} />
          </div>
        </main>

        {/* --- Right Sidebar (TOC) --- */}
        <aside className="hidden xl:block">
          <div className="sticky top-24 p-4 border border-border/60 rounded-xl bg-card/50 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Table of Contents
              </h3>
              <nav className="flex flex-col gap-1">
                {tocItems.map((item) => (
                  <TocItem key={item.id} item={item} activeId={activeSection} />
                ))}
              </nav>
            </div>
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <FloatingActionBar
          likes={articleData.stats.likes}
          isLiked={isLiked}
          onLike={() => setIsLiked(!isLiked)}
          isBookmarked={isBookmarked}
          onBookmark={() => setIsBookmarked(!isBookmarked)}
        />
      </div>

      <BackToTopButton />
    </div>
  );
}
