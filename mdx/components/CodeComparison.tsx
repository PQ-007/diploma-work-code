"use client";

import { Code } from "./Code";
import { Minus, Plus } from "lucide-react";

interface CodeComparisonProps {
  before: string;
  after: string;
  language?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function CodeComparison({
  before,
  after,
  language = "typescript",
  beforeLabel = "Before",
  afterLabel = "After",
}: CodeComparisonProps) {
  return (
    <div className="my-8 grid md:grid-cols-2 gap-4">
      {/* Before */}
      <div className="rounded-xl border border-red-500/30 overflow-hidden bg-card">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/30">
          <Minus className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            {beforeLabel}
          </span>
        </div>
        <div className="p-4">
          <Code className={`language-${language}`}>{before}</Code>
        </div>
      </div>

      {/* After */}
      <div className="rounded-xl border border-green-500/30 overflow-hidden bg-card">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-b border-green-500/30">
          <Plus className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {afterLabel}
          </span>
        </div>
        <div className="p-4">
          <Code className={`language-${language}`}>{after}</Code>
        </div>
      </div>
    </div>
  );
}
