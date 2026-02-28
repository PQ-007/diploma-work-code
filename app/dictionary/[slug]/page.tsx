"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen,
  Pencil,
  Share2,
  Bookmark,
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  FileText,
  Clock,
  LinkIcon,
  ArrowLeft,
} from "lucide-react";

// --- Types ---
interface RelatedArticle {
  id: string;
  title: string;
  author: string;
  avatar: string;
  readTime: string;
  slug: string;
}

interface RelatedTerm {
  id: string;
  name: string;
  slug: string;
}

interface Resource {
  id: string;
  title: string;
  source: string;
  url: string;
}

interface TermDefinition {
  slug: string;
  name: string;
  verified: boolean;
  lastUpdated: string;
  tags: string[];
  definition: string;
  keyPoints: string[];
  exampleCode: {
    filename: string;
    language: string;
    code: string;
  } | null;
  relatedArticles: RelatedArticle[];
  relatedTerms: RelatedTerm[];
  resources: Resource[];
}

// --- Mock Data ---
const mockTerms: Record<string, TermDefinition> = {
  "quantum-computing": {
    slug: "quantum-computing",
    name: "Quantum Computing",
    verified: true,
    lastUpdated: "Oct 24, 2023",
    tags: ["#machine-learning", "#physics", "#advanced", "#research"],
    definition:
      "A type of computing that takes advantage of quantum phenomena like superposition and entanglement. Quantum computers can solve problems that are too complex for classical computers by using qubits instead of bits.",
    keyPoints: [
      "Highly scalable",
      "Based on qubits",
      "Enables parallel computation",
    ],
    exampleCode: {
      filename: "example.js",
      language: "Node.js",
      code: `const express = require('express');
const app = express();
const port = 3000;

app.get('/quantum', (req, res) => {
  res.json({
    status: 'entangled',
    qubits: 128,
    coherenceTime: '100μs'
  });
});

app.listen(port, () => {
  console.log(\`Quantum API running on port \${port}\`);
});`,
    },
    relatedArticles: [
      {
        id: "1",
        title: "Introduction to Quantum Computing Fundamentals",
        author: "Sarah Jenkins",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        readTime: "8 min",
        slug: "intro-quantum-computing",
      },
      {
        id: "2",
        title: "Qubits vs Classical Bits: A Deep Dive",
        author: "Mike Ross",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        readTime: "12 min",
        slug: "qubits-vs-classical-bits",
      },
      {
        id: "3",
        title: "Quantum Entanglement in Practice",
        author: "James Li",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        readTime: "10 min",
        slug: "quantum-entanglement-practice",
      },
    ],
    relatedTerms: [
      {
        id: "1",
        name: "Monolithic Architecture",
        slug: "monolithic-architecture",
      },
      { id: "2", name: "Containerization", slug: "containerization" },
      { id: "3", name: "API Gateway", slug: "api-gateway" },
    ],
    resources: [
      {
        id: "1",
        title: "Martin Fowler's Microservices Guide",
        source: "martinfowler.com",
        url: "#",
      },
      {
        id: "2",
        title: "Pattern: Microservice Architecture",
        source: "microservices.io",
        url: "#",
      },
    ],
  },
  "artificial-intelligence": {
    slug: "artificial-intelligence",
    name: "Artificial Intelligence",
    verified: true,
    lastUpdated: "Nov 15, 2023",
    tags: ["#machine-learning", "#deep-learning", "#neural-networks"],
    definition:
      "Simulation of human intelligence processes by machines, especially computer systems, including learning, reasoning, and self-correction. AI encompasses various approaches from rule-based systems to modern deep learning.",
    keyPoints: [
      "Mimics human cognitive functions",
      "Includes machine learning and deep learning",
      "Powers autonomous decision-making",
    ],
    exampleCode: {
      filename: "model.py",
      language: "Python",
      code: `import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)`,
    },
    relatedArticles: [
      {
        id: "1",
        title: "Getting Started with Artificial Intelligence",
        author: "Sarah Jenkins",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        readTime: "10 min",
        slug: "getting-started-ai",
      },
      {
        id: "2",
        title: "Machine Learning vs Deep Learning Explained",
        author: "Alex Turner",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        readTime: "7 min",
        slug: "ml-vs-dl-explained",
      },
    ],
    relatedTerms: [
      { id: "1", name: "Deep Learning", slug: "deep-learning" },
      { id: "2", name: "Neural Networks", slug: "neural-networks" },
    ],
    resources: [
      {
        id: "1",
        title: "Deep Learning by Ian Goodfellow",
        source: "deeplearningbook.org",
        url: "#",
      },
    ],
  },
};

// Fallback for unknown slugs
function getTermBySlug(slug: string): TermDefinition | null {
  return mockTerms[slug] ?? null;
}

// --- Page Component ---
export default function DictionaryTermPage() {
  const { t } = useLanguage();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  const slug = params?.slug ?? "";
  const term = getTermBySlug(slug);

  // Not found state
  if (!term) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto py-6 lg:py-3 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">Term Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">
              The term you&apos;re looking for doesn&apos;t exist in the
              dictionary yet.
            </p>
            <Button size="sm" onClick={() => router.push("/dictionary")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dictionary
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BookOpen className="h-4 w-4" />
          <Link
            href="/dictionary"
            className="hover:text-foreground transition-colors"
          >
            Dictionary
          </Link>
        </div>

        <div className="flex gap-8 xl:gap-12 justify-center">
          {/* Main Content */}
          <div className="flex-1 max-w-3xl space-y-6">
            {/* Title + Meta */}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">
                  {term.name}
                </h1>
                {term.verified && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                    <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                    VERIFIED
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Last updated: {term.lastUpdated}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-xs">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setIsSaved(!isSaved)}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 mr-1.5 ${isSaved ? "fill-current" : ""}`}
                />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {term.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator />

            {/* Definition Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Definition
              </h2>
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                {term.definition}
              </p>

              {/* Key Points */}
              {term.keyPoints.length > 0 && (
                <ul className="space-y-2 ml-1">
                  {term.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[15px] text-muted-foreground"
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Example Implementation */}
            {term.exampleCode && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Example Implementation
                </h2>
                <Card className="border-border/40 overflow-hidden">
                  {/* Code header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/40">
                    <span className="text-xs text-muted-foreground font-mono">
                      {term.exampleCode.filename}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      {term.exampleCode.language}
                    </Badge>
                  </div>
                  {/* Code body */}
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm font-mono leading-relaxed text-foreground/90">
                      <code>{term.exampleCode.code}</code>
                    </pre>
                  </div>
                </Card>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[320px] space-y-6 sticky top-8 h-fit">
            {/* Related Articles */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                <FileText className="h-4 w-4" />
                Related Articles
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  {term.relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors group"
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                        <AvatarImage src={article.avatar} />
                        <AvatarFallback className="text-xs">
                          {article.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{article.author}</span>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{article.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Related Terms */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                <LinkIcon className="h-4 w-4" />
                Related Terms
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  {term.relatedTerms.map((related) => (
                    <Link
                      key={related.id}
                      href={`/dictionary/${related.slug}`}
                      className="flex items-center justify-between px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                        {related.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2 mb-3 uppercase text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Resources
              </h3>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  {term.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/50 transition-colors group"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium group-hover:text-foreground transition-colors leading-snug">
                          {resource.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {resource.source}
                        </p>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
