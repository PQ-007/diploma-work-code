"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  Target,
  Layers,
  Flame,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatsData {
  total: number;
  due_today: number;
  reviewed_today: number;
  mastered: number;
  learning: number;
  new: number;
  accuracy_7d: number | null;
  streak_days: number;
  heatmap: Record<string, number>;
  deck_breakdown: Array<{
    deck_id: number;
    deck_name: string;
    deck_slug: string;
    total: number;
    due: number;
    mastered: number;
  }>;
}

// ── Heatmap ────────────────────────────────────────────────────────────────────

function Heatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const DAYS = 91;
  const days: Array<{ date: string; count: number }> = [];

  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: data[key] ?? 0 });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const cellColor = (count: number) => {
    if (count === 0) return "#15171c";
    const a = 0.18 + (count / maxCount) * 0.7;
    return `rgba(34,197,94,${a.toFixed(2)})`;
  };

  const weeks = Math.ceil(DAYS / 7);

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto scrollbar-none">
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, d) => {
              const i = w * 7 + d;
              if (i >= DAYS) return <div key={d} className="hm-cell" style={{ background: "transparent" }} />;
              const { date, count } = days[i];
              return (
                <div
                  key={d}
                  className="hm-cell"
                  style={{ background: cellColor(count) }}
                  title={`${date}: ${count} review${count !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
        <span>13 weeks ago</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 2, 4, 6, 8].map((v) => (
            <div
              key={v}
              className="hm-cell"
              style={{ background: cellColor(v === 0 ? 0 : (v / 8) * maxCount) }}
            />
          ))}
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
}

// ── SVG Donut (circle stroke-dasharray technique) ─────────────────────────────

function DonutChart({
  newCards,
  learning,
  mastered,
}: {
  newCards: number;
  learning: number;
  mastered: number;
}) {
  const total = newCards + learning + mastered;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[140px] text-[11px] text-muted-foreground">
        No cards yet
      </div>
    );
  }

  const masteredPct = Math.round((mastered / total) * 100);
  const learningPct = Math.round((learning / total) * 100);
  const newPct = 100 - masteredPct - learningPct;

  // SVG circle donut — r=15.915 gives circumference ~100 so pct = stroke-dasharray first value
  // stroke-dashoffset shifts where the segment starts (negative = clockwise shift)
  const masteredOffset = 25;
  const learningOffset = -(masteredPct - 25);
  const newOffset = -(masteredPct + learningPct - 25);

  return (
    <div className="flex items-center gap-5">
      <svg
        width="140"
        height="140"
        viewBox="0 0 42 42"
        className="flex-shrink-0"
      >
        {/* Track */}
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#15171c" strokeWidth="6" />
        {/* Mastered */}
        <circle
          cx="21" cy="21" r="15.915"
          fill="transparent"
          stroke="#22c55e"
          strokeWidth="6"
          strokeDasharray={`${masteredPct} ${100 - masteredPct}`}
          strokeDashoffset={masteredOffset}
          transform="rotate(-90 21 21)"
        />
        {/* Learning */}
        <circle
          cx="21" cy="21" r="15.915"
          fill="transparent"
          stroke="#3b82f6"
          strokeWidth="6"
          strokeDasharray={`${learningPct} ${100 - learningPct}`}
          strokeDashoffset={learningOffset}
          transform="rotate(-90 21 21)"
        />
        {/* New */}
        <circle
          cx="21" cy="21" r="15.915"
          fill="transparent"
          stroke="#475569"
          strokeWidth="6"
          strokeDasharray={`${newPct} ${100 - newPct}`}
          strokeDashoffset={newOffset}
          transform="rotate(-90 21 21)"
        />
        <text x="21" y="20" textAnchor="middle" fontSize="6" fill="#f8fafc" fontWeight="700">
          {total}
        </text>
        <text x="21" y="25" textAnchor="middle" fontSize="2.5" fill="#8f959f">
          total
        </text>
      </svg>

      <div className="space-y-2 text-[11px]">
        {[
          { label: "Mastered", value: mastered, pct: masteredPct, color: "#22c55e" },
          { label: "Learning", value: learning, pct: learningPct, color: "#3b82f6" },
          { label: "New",      value: newCards, pct: newPct,      color: "#475569" },
        ].map(({ label, value, pct, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
            <span>{label}</span>
            <span className="text-muted-foreground ml-auto">
              {value} · {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/flashcards/stats");
      if (res.status === 401) { router.push("/signin"); return; }
      if (!res.ok) throw new Error("Failed");
      setStats(await res.json());
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(59,130,246,.1)", color: "#60a5fa" }}
            >
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Study Progress</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Last 90 days · all decks
              </p>
            </div>
          </div>
          {stats && stats.due_today > 0 && (
            <Button asChild size="sm" className="gap-1.5 h-8 text-[12px]">
              <Link href="/flashcards">
                Start review ·{" "}
                <span
                  className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: "rgba(255,255,255,.18)" }}
                >
                  {stats.due_today} due
                </span>
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-[200px] rounded-lg" />
            <Skeleton className="h-[200px] rounded-lg" />
          </div>
        ) : !stats ? null : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Due today", value: stats.due_today, sub: `across all decks`, icon: Target, color: "#3b82f6" },
                { label: "Total cards", value: stats.total, sub: `in all decks`, icon: Layers, color: "#a78bfa" },
                { label: "Mastered", value: stats.mastered, sub: `${stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0}% of total`, icon: CheckCircle2, color: "#22c55e" },
                { label: "Streak", value: `${stats.streak_days} day${stats.streak_days !== 1 ? "s" : ""}`, sub: `keep it going!`, icon: Flame, color: "#fb923c" },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="text-[26px] font-bold tracking-tight leading-none">{value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">{sub}</div>
                </div>
              ))}
            </div>

            {/* Donut + heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Donut */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
                }}
              >
                <div className="text-[12px] font-semibold mb-4">Card maturity</div>
                <DonutChart
                  newCards={stats.new}
                  learning={stats.learning}
                  mastered={stats.mastered}
                />
              </div>

              {/* Heatmap */}
              <div
                className="rounded-xl p-5 lg:col-span-2"
                style={{
                  background: "var(--card)",
                  border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[12px] font-semibold">Review activity</div>
                  <div className="text-[10px] text-muted-foreground">Past 90 days</div>
                </div>
                <Heatmap data={stats.heatmap} />
              </div>
            </div>

            {/* Per-deck table */}
            {stats.deck_breakdown.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid color-mix(in oklab, var(--border) 40%, transparent)",
                }}
              >
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ borderBottom: "1px solid color-mix(in oklab, var(--border) 40%, transparent)" }}
                >
                  <div className="text-[12px] font-semibold">Per-deck breakdown</div>
                </div>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr
                      className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground"
                      style={{ borderBottom: "1px solid color-mix(in oklab, var(--border) 40%, transparent)" }}
                    >
                      <th className="px-5 py-2.5 font-medium">Deck</th>
                      <th className="px-3 py-2.5 font-medium text-right">Cards</th>
                      <th className="px-3 py-2.5 font-medium text-right">Due</th>
                      <th className="px-3 py-2.5 font-medium">Mastered</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {stats.deck_breakdown.map((d) => {
                      const masteredPct = d.total > 0 ? Math.round((d.mastered / d.total) * 100) : 0;
                      return (
                        <tr
                          key={d.deck_id}
                          className="transition-colors hover:bg-muted/40"
                          style={{ borderBottom: "1px solid color-mix(in oklab, var(--border) 40%, transparent)" }}
                        >
                          <td className="px-5 py-3 font-medium">
                            <Link
                              href={`/flashcards/${encodeURIComponent(d.deck_slug)}`}
                              className="hover:text-primary transition-colors"
                            >
                              {d.deck_name}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-right text-muted-foreground">
                            {d.total}
                          </td>
                          <td className={`px-3 py-3 text-right ${d.due > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            {d.due > 0 ? d.due : "—"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 h-1 rounded-full overflow-hidden"
                                style={{ maxWidth: 120, background: "var(--secondary)" }}
                              >
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${masteredPct}%`, background: "#22c55e" }}
                                />
                              </div>
                              <span className="text-[10.5px] text-muted-foreground tabular-nums">
                                {masteredPct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px]"
                            >
                              <Link href={`/flashcards/${encodeURIComponent(d.deck_slug)}?mode=review`}>
                                Review
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
