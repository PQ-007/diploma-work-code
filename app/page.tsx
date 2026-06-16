"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Anvil, ArrowRight, Blocks, MessagesSquare, Telescope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Home is a clean entry point into FutureHub's four cores
 * (FutureHub refocus — Phase 3). The previous mixed feed lives on in
 * @/app/pages/FeedPage and can be reused on a core page later.
 */
const cores = [
  {
    href: "/article",
    titleKey: "sidebar.articles",
    icon: Telescope,
    description: "Read & write technical knowledge, in mn / ja / en.",
  },
  {
    href: "/project",
    titleKey: "sidebar.projects",
    icon: Anvil,
    description: "Showcase what you've built — progress, files, team.",
  },
  {
    href: "/dictionary",
    titleKey: "sidebar.dictionary",
    icon: Blocks,
    description: "Define technical terms across languages.",
  },
  {
    href: "/discussions",
    titleKey: "sidebar.discussions",
    icon: MessagesSquare,
    description: "Ask questions and discuss topics with the community.",
  },
] as const;

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <header className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">FutureHub</h1>
        <p className="text-muted-foreground">Read, build, define, discuss.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {cores.map(({ href, titleKey, icon: Icon, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors hover:border-primary hover:bg-muted/40">
              <CardContent className="flex h-full flex-col gap-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="text-lg font-semibold capitalize">
                    {t(titleKey)}
                  </h2>
                </div>
                <p className="flex-1 text-sm text-muted-foreground">
                  {description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Open
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
