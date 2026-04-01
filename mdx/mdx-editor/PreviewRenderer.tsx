"use client";

import { useEffect, useState, useRef } from "react";
import { compileMdx } from "./MdxCompiler";
import { components } from "@/mdx/mdx-components";

const normalizeHeadingText = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[`*_~#>[\]()!]/g, "")
    .replace(/\s+/g, " ");

const slugifyLoose = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const findHeadingLineInSource = (
  source: string,
  headingText: string,
  headingId?: string,
): number | null => {
  const lines = source.split("\n");
  const normalizedTarget = normalizeHeadingText(headingText);
  const normalizedTargetId = headingId ? slugifyLoose(headingId) : "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (!match) continue;

    const candidateText = match[2].trim();
    const normalizedCandidate = normalizeHeadingText(candidateText);
    const candidateSlug = slugifyLoose(candidateText);

    const textMatch =
      normalizedCandidate === normalizedTarget ||
      normalizedCandidate.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedCandidate);

    const idMatch =
      !!normalizedTargetId &&
      (candidateSlug === normalizedTargetId ||
        candidateSlug.includes(normalizedTargetId) ||
        normalizedTargetId.includes(candidateSlug));

    if (textMatch || idMatch) {
      return index + 1;
    }
  }

  return null;
};

type MdxPreviewProps = {
  source: string;
  activeSourceLine?: number;
  autoFollowContext?: boolean;
  onSourceLineNavigate?: (line: number) => void;
};

export function MdxPreview({
  source,
  activeSourceLine,
  autoFollowContext = false,
  onSourceLineNavigate,
}: MdxPreviewProps) {
  const [Content, setContent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSourceRef = useRef<string>(source);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const autoFollowPausedUntilRef = useRef<number>(0);

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const pauseAutoFollow = () => {
      autoFollowPausedUntilRef.current = Date.now() + 900;
    };

    root.addEventListener("wheel", pauseAutoFollow, { passive: true });
    root.addEventListener("touchmove", pauseAutoFollow, { passive: true });

    return () => {
      root.removeEventListener("wheel", pauseAutoFollow);
      root.removeEventListener("touchmove", pauseAutoFollow);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !onSourceLineNavigate) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const heading = target.closest(
        "h1, h2, h3, h4, h5, h6",
      ) as HTMLElement | null;
      const headingAnchor = target.closest("a.anchor") as HTMLElement | null;

      // Only intercept heading or heading-anchor clicks to keep normal links working.
      if (!heading && !headingAnchor) return;

      const sourceNode =
        headingAnchor?.closest("[data-source-line]") ||
        heading?.closest("[data-source-line]") ||
        heading;

      const lineRaw = sourceNode?.getAttribute("data-source-line");
      let line = lineRaw ? Number(lineRaw) : NaN;

      if (!Number.isFinite(line) && heading) {
        const fallbackLine = findHeadingLineInSource(
          source,
          heading.textContent?.trim() || "",
          heading.id,
        );
        if (fallbackLine) {
          line = fallbackLine;
        }
      }

      if (!Number.isFinite(line)) return;

      event.preventDefault();
      event.stopPropagation();
      onSourceLineNavigate(line);

      // Keep URL hash behavior for heading anchors.
      if (heading?.id) {
        window.history.replaceState(null, "", `#${heading.id}`);
      }
    };

    root.addEventListener("click", handleClick);
    return () => root.removeEventListener("click", handleClick);
  }, [onSourceLineNavigate, source]);

  useEffect(() => {
    if (!autoFollowContext || !activeSourceLine || !Content) return;
    if (Date.now() < autoFollowPausedUntilRef.current) return;

    const root = rootRef.current;
    if (!root) return;

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-source-line]"),
    );
    if (!elements.length) return;

    let target: HTMLElement | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const element of elements) {
      const raw = element.getAttribute("data-source-line");
      const sourceLine = raw ? Number(raw) : NaN;
      if (!Number.isFinite(sourceLine)) continue;

      const distance = Math.abs(sourceLine - activeSourceLine);
      if (distance < bestDistance) {
        bestDistance = distance;
        target = element;
      }
    }

    if (!target) return;

    requestAnimationFrame(() => {
      const scrollContainer = root.parentElement;
      if (!scrollContainer) {
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const topPadding = 8;
      const delta = targetRect.top - containerRect.top;
      const nextTop = scrollContainer.scrollTop + delta - topPadding;

      scrollContainer.scrollTo({
        top: Math.max(0, nextTop),
        behavior: "smooth",
      });
    });
  }, [activeSourceLine, autoFollowContext, Content, source]);

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

  return (
    <div ref={rootRef}>
      <Content components={components} />
    </div>
  );
}
