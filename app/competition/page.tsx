"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// --- Types ---
interface Competition {
  id: string;
  name: string;
  description: string;
  prize: number;
  status: "active" | "upcoming" | "past";
  image: string;
  hot?: boolean;
  endsAt: string; // ISO date string
}

// --- Mock Data ---
const competitions: Competition[] = [
  {
    id: "1",
    name: "Winter Code Jam",
    description:
      "Build a sustainable energy dashboard using real-time IoT dat...",
    prize: 5000,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    hot: true,
    endsAt: "2026-03-02T00:00:00Z",
  },
  {
    id: "2",
    name: "AI Optimization",
    description:
      "Optimize large language models for edge devices. Prizes include...",
    prize: 2500,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
    endsAt: "2026-03-05T08:00:00Z",
  },
  {
    id: "3",
    name: "Cyber Sentinel",
    description: "Penetration testing and vulnerability assessment of a...",
    prize: 10000,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    endsAt: "2026-02-28T00:45:00Z",
  },
  {
    id: "4",
    name: "GreenTech Hack",
    description:
      "Creating digital solutions for reducing urban carbon footprints...",
    prize: 3000,
    status: "active",
    image:
      "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&q=80",
    endsAt: "2026-03-08T20:00:00Z",
  },
  {
    id: "5",
    name: "DevOps Challenge",
    description:
      "Design and implement a CI/CD pipeline for a complex microservices...",
    prize: 4000,
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80",
    endsAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Data Viz Sprint",
    description:
      "Create compelling data visualizations from complex datasets to tell...",
    prize: 2000,
    status: "upcoming",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    endsAt: "2026-04-10T00:00:00Z",
  },
  {
    id: "7",
    name: "Blockchain Buildathon",
    description:
      "Build a decentralized application that solves a real-world problem...",
    prize: 8000,
    status: "past",
    image:
      "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=600&q=80",
    endsAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "8",
    name: "ML Model Arena",
    description:
      "Train the most accurate machine learning model on a mystery dataset...",
    prize: 6000,
    status: "past",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
    endsAt: "2026-02-01T00:00:00Z",
  },
];

// --- Countdown Hook ---
function useCountdown(endsAt: string) {
  const { t } = useLanguage();
  const calcTimeLeft = useCallback(() => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return t("competitions.ended");
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    if (d > 0)
      return `${d}${t("competitions.days")} ${h}${t("competitions.hours")} ${t("competitions.left")}`;
    if (h > 0)
      return `${h}${t("competitions.hours")} ${m}${t("competitions.minutes")} ${t("competitions.left")}`;
    return `${m}${t("competitions.minutes")} ${t("competitions.left")}`;
  }, [endsAt, t]);

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, [calcTimeLeft]);

  return timeLeft;
}

// --- Competition Card ---
function CompetitionCard({ comp }: { comp: Competition }) {
  const timeLeft = useCountdown(comp.endsAt);
  const { t } = useLanguage();

  return (
    <Card className="border-border/40 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={comp.image}
          alt={comp.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        {comp.hot && (
          <Badge className="absolute top-3 right-3 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider border-0">
            {t("competitions.hot")}
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title + Prize */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold leading-tight">{comp.name}</h3>
          <Badge
            variant="outline"
            className="flex-shrink-0 border-primary/40 text-primary text-xs font-semibold gap-1"
          >
            <DollarSign className="h-3 w-3" />${comp.prize.toLocaleString()}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4 flex-1">
          {comp.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeLeft}</span>
          </div>
          <Button size="sm" className="text-xs font-semibold px-4">
            {comp.status === "past"
              ? t("competitions.viewResults")
              : t("competitions.joinChallenge")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Tabs ---
type TabValue = "active" | "upcoming" | "past";

const tabKeys: { value: TabValue; labelKey: string }[] = [
  { value: "active", labelKey: "competitions.tabs.active" },
  { value: "upcoming", labelKey: "competitions.tabs.upcoming" },
  { value: "past", labelKey: "competitions.tabs.pastResults" },
];

// --- Page ---
export default function CompetitionPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("active");
  const { t } = useLanguage();

  const filtered = competitions.filter((c) => c.status === activeTab);
  const activeCount = competitions.filter((c) => c.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6 lg:py-3 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t("competitions.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("competitions.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-border/40 mb-6">
          {tabKeys.map((tab) => {
            const isActive = activeTab === tab.value;
            const count = tab.value === "active" ? activeCount : undefined;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {t(tab.labelKey)}
                {count !== undefined && (
                  <span className="ml-1 text-muted-foreground">({count})</span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Competition Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((comp) => (
              <CompetitionCard key={comp.id} comp={comp} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("competitions.noCompetitions")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
