"use client";

import { useEffect, useState, useRef } from "react";
import { compileMdx } from "./MdxCompiler";
import { components } from "@/mdx/mdx-components";

export function MdxPreview({ source }: { source: string }) {
  const [Content, setContent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSourceRef = useRef<string>(source);

  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Store the current source to check if it's still relevant when compilation finishes
    lastSourceRef.current = source;

    // Don't show loading state immediately to avoid flicker on fast typing
    const showLoadingTimer = setTimeout(() => {
      if (lastSourceRef.current === source) {
        setIsCompiling(true);
      }
    }, 150);

    // Debounce the compilation to avoid excessive re-renders when typing or pasting
    debounceRef.current = setTimeout(async () => {
      try {
        const mod = await compileMdx(source);
        // Only update if this is still the most recent source
        if (lastSourceRef.current === source) {
          setContent(() => mod.default);
          setError(null);
        }
      } catch (e) {
        // Only update if this is still the most recent source
        if (lastSourceRef.current === source) {
          setError(e instanceof Error ? e.message : String(e));
          setContent(null);
        }
      } finally {
        if (lastSourceRef.current === source) {
          setIsCompiling(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(showLoadingTimer);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [source]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
        <strong>MDX Compile Error:</strong>
        <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
      </div>
    );
  }

  if (isCompiling && !Content) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Compiling MDX...
      </div>
    );
  }

  if (!Content) return null;

  return <Content components={components} />;
}
