"use client";

import { useEffect, useState, type ComponentType } from "react";
import { components as mdxComponents } from "@/mdx/mdx-components";
import { compileMdx } from "@/mdx/mdx-editor/MdxCompiler";
import { Skeleton } from "@/components/ui/skeleton";

type MdxComponent = ComponentType<{ components?: Record<string, unknown> }>;

/**
 * Competition rules (markdown/MDX), rendered exactly like an article body. Falls back to plain text if it doesn't compile.
 * Render with `key={source}` so a new text starts from a fresh state.
 */
export function RulesContent({ source }: { source: string }) {
  const [Content, setContent] = useState<MdxComponent | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    compileMdx(source)
      .then((compiled) => {
        if (!cancelled) setContent(() => compiled.default as MdxComponent);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (failed) return <p className="whitespace-pre-wrap text-sm leading-relaxed">{source}</p>;
  if (!Content) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  return (
    <article className="max-w-none overflow-hidden text-foreground [overflow-wrap:anywhere] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <Content components={{ ...mdxComponents }} />
    </article>
  );
}
