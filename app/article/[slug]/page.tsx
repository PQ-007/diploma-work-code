"use client"

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
  Copy,
  Github,
  Hash,
  Heart,
  MessageCircle,
  PlayCircle,
  Share2,
  Terminal,
  Twitter
} from "lucide-react";
import { JSX, useEffect, useState } from "react";

// Import MDX components - you'll need to install these packages:
// npm install @mdx-js/react next-mdx-remote
// OR for client-side only:
// npm install @mdx-js/mdx
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

// --- Types & Mock Data ---

const articleData = {
  id: "1",
  title: "Building Scalable React Applications: A Complete Guide",
  subtitle: "Architecting for performance, maintainability, and developer experience in the modern web ecosystem.",
  author: {
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    role: "Staff Engineer @ Vercel",
    username: "@sarahchen",
    verified: true,
    bio: "Passionate about React performance, state management, and modern component architecture. Building the future of the web.",
    github: "sarahchen-dev",
    twitter: "sarahchen_tweets"
  },
  publishedAt: "Dec 15, 2024",
  readTime: 12,
  tags: ["React", "Architecture", "Performance", "TypeScript"],
  stats: {
    views: "15.4k",
    likes: 847,
    comments: 156,
  },
  coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80"
};

// Sample MDX content - in production, this would come from your API/filesystem
const sampleMDXContent = `
## Introduction

Building scalable  applications requires careful planning and architectural decisions from the start. In this guide, we explore the patterns that define modern web development.

### Why Architecture Matters
xdc
### o

A well-architected application provides several benefits: easier onboarding for new developers, reduced technical debt, and improved performance. It distinguishes a "weekend project" from a product that can sustain years of iteration.

## Core Principles

Before writing a single line of code, we must agree on the fundamental constraints that will guide our decisions.

### Separation of Concerns

Keep your business logic separate from your UI components. This makes testing easier and allows you to reuse logic across different interfaces, such as Mobile or CLI tools.

\`\`\`typescript
// Custom Hook: useIntersectionObserver
import { useEffect, useRef, useState } from 'react';

export function useOnScreen(ref) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { rootMargin: "0px" }
    );
    if (ref.current) observer.observe(ref.current);
    
    return () => observer.disconnect();
  }, [ref]);

  return isIntersecting;
}
\`\`\`

### Component Composition

Build complex UIs by composing smaller, reusable components. This pattern, often called "Atomic Design" in design circles, translates perfectly to React's component model.

<ProTip>
Avoid "God Components" that take 20+ props. If a component is doing too much, break it down using children props or slots.
</ProTip>

## Performance Optimization

Performance isn't just about loading speed; it's about runtime interaction.

### Code Splitting

Using \`React.lazy\` and Suspense allows us to ship only the JavaScript needed for the current route.

### Memoization Strategies

Proper use of \`useMemo\`, \`useCallback\`, and \`React.memo\` is crucial for preventing unnecessary re-renders in deeply nested component trees.
`;

const tocData = [
  {
    id: "introduction",
    text: "Introduction",
    level: 2,
    children: [
      { id: "why-architecture-matters", text: "Why Architecture Matters", level: 3 }
    ]
  },
  {
    id: "core-principles",
    text: "Core Principles",
    level: 2,
    children: [
      { id: "separation-of-concerns", text: "Separation of Concerns", level: 3 },
      { id: "component-composition", text: "Component Composition", level: 3 }
    ]
  },
  {
    id: "performance-optimization",
    text: "Performance Optimization",
    level: 2,
    children: [
      { id: "code-splitting", text: "Code Splitting", level: 3 },
      { id: "memoization-strategies", text: "Memoization Strategies", level: 3 }
    ]
  },
];

// --- Sub-Components ---

// 1. Reading Progress Bar
const ScrollProgress = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setWidth(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 h-1 bg-muted z-50 w-full">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

// 2. High-Fidelity Code Block Component for MDX
const CodeWindow = ({ children, className, title }: any) => {
  const [copied, setCopied] = useState(false);
  
  // Extract language from className (e.g., "language-typescript")
  const language = className?.replace(/language-/, '') || 'text';
  const code = children?.trim() || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-10 rounded-xl overflow-hidden border bg-[#0d1117] shadow-2xl ring-1 ring-white/10">
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-3 text-xs text-muted-foreground font-mono">
            {title || `example.${language}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">{language}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-zinc-400 hover:text-white hover:bg-white/10"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="p-5 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-zinc-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

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
    <div className="text-muted-foreground relative z-10">
      {children}
    </div>
  </div>
);

// 3. Polished Table of Contents
const TocItem = ({ item, activeId, level = 2 }: any) => {
  const isActive = activeId === item.id;
  const isChild = level > 2;

  return (
    <div className="relative">
      <a
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className={`
          group flex items-center py-2 transition-colors duration-200
          ${isChild ? 'pl-6 text-xs' : 'text-sm'}
          ${isActive 
            ? 'text-primary font-medium' 
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        {!isChild && isActive && (
          <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
        )}
        
        {isChild && (
          <div className={`
            absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-colors
            ${isActive ? 'bg-primary' : 'bg-border'}
          `} />
        )}

        {item.text}
      </a>
      
      {item.children?.map((child: any) => (
        <TocItem key={child.id} item={child} activeId={activeId} level={level + 1} />
      ))}
    </div>
  );
};

// 4. Floating Interaction Bar
const FloatingActionBar = ({ likes, isLiked, onLike, onBookmark, isBookmarked }: any) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-1 p-1.5 bg-background/80 backdrop-blur-md border shadow-2xl rounded-full ring-1 ring-black/5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onLike}
          className={`rounded-full hover:bg-red-50 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500 bg-red-50' : 'text-muted-foreground'}`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
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
          className={`rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors ${isBookmarked ? 'text-blue-500' : 'text-muted-foreground'}`}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
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
      behavior: "smooth"
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
          {author.verified && <Check className="w-4 h-4 text-primary fill-primary/20" />}
        </h3>
        <p className="text-sm text-primary font-medium">{author.role}</p>
        <p className="text-xs text-muted-foreground">{author.username}</p>
      </div>
    </div>
    <p className="text-sm text-muted-foreground mb-4">{author.bio}</p>
    <div className="flex gap-3">
      {author.twitter && (
        <a href={`https://twitter.com/${author.twitter}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2 text-blue-400 border-blue-400 hover:bg-blue-50/50">
            <Twitter className="w-4 h-4" />
            Follow
          </Button>
        </a>
      )}
      {author.github && (
        <a href={`https://github.com/${author.github}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2 text-foreground/80 hover:bg-muted">
            <Github className="w-4 h-4" />
            GitHub
          </Button>
        </a>
      )}
    </div>
  </Card>
);

// Custom heading components with IDs for TOC navigation
const createHeading = (level: number) => {
  const Heading = ({ children, ...props }: any) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    return (
      <Tag id={id} className="scroll-mt-24" {...props}>
        {children}
      </Tag>
    );
  };
  return Heading;
};

// MDX Components mapping
const mdxComponents = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  code: CodeWindow,
  pre: ({ children }: any) => <>{children}</>, // Wrapper handled by CodeWindow
  ProTip,
};

// --- Main Page Component ---

export default function ModernArticlePage() {
  const [activeSection, setActiveSection] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load and serialize MDX content
  useEffect(() => {
    const loadMDX = async () => {
      try {
        // In production, fetch from your API:
        // const response = await fetch(`/api/articles/${articleId}`);
        // const { content } = await response.json();
        
        const serialized = await serialize(sampleMDXContent);
        setMdxSource(serialized);
      } catch (error) {
        console.error('Error loading MDX:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMDX();
  }, []);

  // Intersection Observer for TOC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
          setActiveSection(intersectingEntry.target.id);
        } else {
          const topVisibleSection = Array.from(document.querySelectorAll("h2[id], h3[id]"))
            .map(section => ({
              id: section.id,
              top: section.getBoundingClientRect().top,
            }))
            .filter(section => section.top < 200)
            .sort((a, b) => b.top - a.top)[0];

          if (topVisibleSection) setActiveSection(topVisibleSection.id);
        }
      },
      { rootMargin: "-100px 0% -80% 0%" } 
    );

    const headings = document.querySelectorAll("h2[id], h3[id]");
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [mdxSource]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary">
      
      <ScrollProgress />

      <div className="container mx-auto max-w-7xl px-4 py-6 flex flex-col lg:flex-row gap-6 xl:gap-20">
        
        {/* --- Left Sidebar --- */}
        <aside className="hidden lg:flex flex-col gap-8 w-16 sticky top-32 h-fit items-center">
            <div className="flex flex-col gap-6 items-center">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-full hover:bg-muted ${isLiked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-muted-foreground'}`}
                    onClick={() => setIsLiked(!isLiked)}
                >
                    <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <span className="text-sm font-medium text-muted-foreground -mt-3">{articleData.stats.likes + (isLiked ? 1 : 0)}</span>
                
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
                    <MessageCircle className="h-6 w-6" />
                </Button>
                
                <Separator className="w-8" />
                
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-muted">
                    <Share2 className="h-6 w-6" />
                </Button>
            </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 min-w-0 xl:max-w-4xl">
          
          {/* Article Header */}
          <div className="space-y-8 mb-12">
             <div className="space-y-4">
               <div className="flex items-center gap-2">
                 {articleData.tags.slice(0, 1).map(tag => (
                   <Badge key={tag} className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                     <Hash className="w-3 h-3 mr-1" />
                     {tag}
                   </Badge>
                 ))}
                 <span className="text-xs text-muted-foreground flex items-center gap-1">
                   <Calendar className="w-3 h-3" />
                   {articleData.publishedAt}
                 </span>
               </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                    {articleData.title}
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                    {articleData.subtitle}
                </p>
             </div>

             <div className="flex items-center justify-between py-6 border-y border-border/40">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src={articleData.author.avatar} />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{articleData.author.name}</span>
                            {articleData.author.verified && <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase tracking-wider">Verified</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{articleData.author.role}</span>
                            <span>•</span>
                            <span>{articleData.readTime} min read</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex rounded-full gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Listen
                    </Button>
                </div>
             </div>
          </div>

          {/* Cover Image */}
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl mb-16 shadow-2xl bg-muted">
            <img 
                src={articleData.coverImage} 
                alt="Cover" 
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-700 ease-in-out" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>

          {/* MDX Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : mdxSource ? (
            <article className="prose prose-lg dark:prose-invert max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
              prose-h2:mt-12 prose-h2:pt-4 prose-h2:border-t prose-h2:border-border/50
              prose-p:text-lg prose-p:leading-8 prose-p:text-muted-foreground/90
              prose-strong:text-foreground prose-strong:font-semibold
              prose-li:text-muted-foreground
              prose-img:rounded-xl prose-img:shadow-lg
            ">
              <MDXRemote {...mdxSource} components={mdxComponents} />
            </article>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              Failed to load article content
            </div>
          )}
          
          <Separator className="my-12" />
          
          <AuthorBox author={articleData.author} />

          {/* Subscription CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/30 p-8 rounded-2xl border border-border/50 mt-12">
             <div className="flex flex-col gap-2 text-center sm:text-left">
                <h3 className="font-bold text-lg">Enjoyed this article?</h3>
                <p className="text-muted-foreground text-sm">Join 15,000+ developers getting the latest updates.</p>
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-64"
                />
                <Button>Subscribe</Button>
             </div>
          </div>
        </main>

        {/* --- Right Sidebar (TOC) --- */}
        <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-20 space-y-10 p-4 border border-border/50 rounded-xl bg-card/50 backdrop-blur-sm">
                <div>
                    <h3 className="font-bold text-lg tracking-tight text-foreground mb-4">Table of Contents</h3>
                    <nav className="border-l border-border/50 ml-4 relative">
                        <div className="flex flex-col">
                           {tocData.map((item) => (
                                <TocItem key={item.id} item={item} activeId={activeSection} />
                           ))}
                        </div>
                    </nav>
                </div>

                <Separator />

                <div>
                    <h3 className="font-semibold text-sm tracking-wider text-muted-foreground uppercase mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {articleData.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs bg-accent/30 hover:bg-accent cursor-pointer transition-colors px-2 py-1 font-normal">
                                <Hash className="w-3 h-3 mr-1 text-primary/70" />
                                {tag}
                            </Badge>
                        ))}
                    </div>
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