"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  CalendarDays,
  BookOpenText,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type SlideType = "ad" | "event" | "word" | "tip";

interface CarouselSlide {
  id: string;
  type: SlideType;
  badge: string;
  title: string;
  description: string;
  cta?: string;
  accent: string;
  icon: React.ReactNode;
}

const slides: CarouselSlide[] = [
  {
    id: "1",
    type: "ad",
    badge: "Sponsored",
    title: "Master System Design",
    description:
      "Join 10,000+ developers in our comprehensive system design course. Limited early-bird pricing!",
    cta: "Learn More",
    accent: "from-blue-500/10 to-cyan-500/10",
    icon: <Megaphone className="h-5 w-5 text-blue-500" />,
  },
  {
    id: "2",
    type: "event",
    badge: "Event",
    title: "Hackathon 2026 🚀",
    description:
      "48-hour virtual hackathon starting March 15. Build, compete, and win prizes up to $5,000.",
    cta: "Register Now",
    accent: "from-purple-500/10 to-pink-500/10",
    icon: <CalendarDays className="h-5 w-5 text-purple-500" />,
  },
  {
    id: "3",
    type: "word",
    badge: "Word of the Day",
    title: "Idempotent",
    description:
      "An operation that produces the same result no matter how many times it is performed. Essential concept in distributed systems & API design.",
    accent: "from-amber-500/10 to-orange-500/10",
    icon: <BookOpenText className="h-5 w-5 text-amber-500" />,
  },
  {
    id: "4",
    type: "tip",
    badge: "Dev Tip",
    title: "Git Stash Pop vs Apply",
    description:
      "'git stash pop' removes the stash after applying, while 'git stash apply' keeps it. Use apply when you need the stash in multiple branches.",
    accent: "from-green-500/10 to-emerald-500/10",
    icon: <Lightbulb className="h-5 w-5 text-green-500" />,
  },
];

const AUTO_PLAY_INTERVAL = 5000;

export default function SidebarCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = slides[current];

  return (
    <Card
      className="border-border/40 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <CardContent className="p-0">
        {/* Gradient accent bar */}
  

        <div className="p-4 space-y-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slide.icon}
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-medium"
              >
                {slide.badge}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={prev}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={next}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold leading-tight">
              {slide.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {slide.description}
            </p>
          </div>

          {/* CTA */}
          {slide.cta && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs font-medium"
            >
              {slide.cta}
            </Button>
          )}

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-4 bg-foreground/60"
                    : "w-1.5 bg-foreground/15 hover:bg-foreground/30"
                }`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
