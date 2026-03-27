"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  BookOpenText,
  Lightbulb,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type SlideType = "competition" | "event" | "word" | "tip";

interface CarouselSlide {
  id: string;
  type: SlideType;
  badgeKey: string;
  title: string;
  description: string;
  ctaKey?: string | null;
  accent: string;
  icon: React.ReactNode;
}

function useSlides() {
  const { t } = useLanguage();

  const slides: CarouselSlide[] = [
    {
      id: "1",
      type: "competition",
      badgeKey: "carousel.competition",
      title: "Код бичлэгийн тэмцээн 2026",
      description:
        "Алгоритм, систем дизайн, UI сорилтой 36 цагийн марафон. Баг бүр 4 хүн, 2 шаттай үнэлгээ.",
      ctaKey: "carousel.registerNow",
      accent: "from-cyan-500/10 to-emerald-500/10",
      icon: <Trophy className="h-5 w-5 text-emerald-500" />,
    },
    {
      id: "2",
      type: "event",
      badgeKey: "carousel.event",
      title: "Hackathon 2026 🚀",
      description:
        "3-р сарын 15-наас эхлэх 48 цагийн онлайн хакатон. Барь, өрсөлд, $5,000 хүртэл шагнал аваарай.",
      ctaKey: "carousel.registerNow",
      accent: "from-purple-500/10 to-pink-500/10",
      icon: <CalendarDays className="h-5 w-5 text-purple-500" />,
    },
    {
      id: "3",
      type: "word",
      badgeKey: "carousel.wordOfDay",
      title: "Idempotent",
      description:
        "Хэд дахин ажиллуулсан ч ижил үр дүн өгдөг үйлдэл. Түгээмэл систем ба API загварт зайлшгүй ойлголт.",
      accent: "from-amber-500/10 to-orange-500/10",
      icon: <BookOpenText className="h-5 w-5 text-amber-500" />,
    },
    {
      id: "4",
      type: "tip",
      badgeKey: "carousel.devTip",
      title: "Git stash: pop vs apply",
      description:
        "'git stash pop' хэрэгжүүлээд хадгаламжийг устгана, 'git stash apply' хадгаламжийг үлдээнэ. Олон салбарт хэрэглэх бол apply-г сонго.",
      accent: "from-green-500/10 to-emerald-500/10",
      icon: <Lightbulb className="h-5 w-5 text-green-500" />,
    },
  ];

  return { slides, t };
}

const AUTO_PLAY_INTERVAL = 5000;

export default function SidebarCarousel() {
  const { slides, t } = useSlides();
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
    <div
      className="relative overflow-hidden border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 hover:-translate-y-1 rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.accent} opacity-70`}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"
        aria-hidden
      />
      <CardContent className="relative h-48 p-0">
        <div className="relative z-10 flex h-full flex-col gap-2 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-background/80 shadow-sm ring-1 ring-border/60">
                {slide.icon}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 font-medium"
              >
                {t(slide.badgeKey)}
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

        

          {/* Dots */}
          <div className="mt-auto flex items-center justify-center gap-1.5 pt-1">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                  i === current
                    ? "w-4 bg-foreground/70"
                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                }`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </div>
  );
}
