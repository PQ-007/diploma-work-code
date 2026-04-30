"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Layers, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ProjectCard from "@/app/project/components/ProjectCard";
import type { ProjectPayload } from "@/app/project/types";

const PROJECT_TYPE_OPTIONS = [
  { value: "diploma", labelKey: "project.typeValue.diploma" },
  { value: "contest", labelKey: "project.typeValue.contest" },
  { value: "intership", labelKey: "project.typeValue.intership" },
  { value: "private", labelKey: "project.typeValue.private" },
];

const PROJECT_CATEGORY_OPTIONS = [
  {
    value: "creative_design",
    labelKey: "project.categoryValue.creative_design",
  },
  { value: "mobile_dev", labelKey: "project.categoryValue.mobile_dev" },
  { value: "game_dev", labelKey: "project.categoryValue.game_dev" },
  { value: "web_dev", labelKey: "project.categoryValue.web_dev" },
  { value: "hardware_iot", labelKey: "project.categoryValue.hardware_iot" },
  { value: "ai", labelKey: "project.categoryValue.ai" },
  { value: "other", labelKey: "project.categoryValue.other" },
];

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [projects, setProjects] = useState<ProjectPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"public" | "my">("public");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchProjects = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("scope", activeTab);
        if (searchQuery) params.set("search", searchQuery);
        if (sortBy) params.set("sort", sortBy);
        if (difficultyFilter && difficultyFilter !== "all")
          params.set("difficulty", difficultyFilter);
        if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);

        const res = await fetch(`/api/projects?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await res.json();
        setProjects(data.items || []);
      } catch {
        setError(t("project.failedToLoad") || "Failed to load projects");
        setProjects([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, searchQuery, sortBy, difficultyFilter, typeFilter, t],
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const onFocus = () => {
      void fetchProjects(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchProjects(true);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchProjects]);

  const hasFilters =
    Boolean(searchQuery.trim()) ||
    sortBy !== "newest" ||
    yearFilter !== "all" ||
    courseFilter !== "all" ||
    (difficultyFilter && difficultyFilter !== "all") ||
    (typeFilter && typeFilter !== "all");

  const availableYears = Array.from(
    new Set(
      projects
        .map((project) =>
          project.created_at
            ? new Date(project.created_at).getFullYear()
            : null,
        )
        .filter((year): year is number => Number.isFinite(year)),
    ),
  )
    .sort((a, b) => b - a)
    .map(String);

  const displayedProjects = projects.filter((project) => {
    const projectYear = project.created_at
      ? String(new Date(project.created_at).getFullYear())
      : "";
    const projectCourse = (project.category || "").trim();

    const matchesYear = yearFilter === "all" || projectYear === yearFilter;
    const matchesCourse =
      courseFilter === "all" || projectCourse === courseFilter;

    return matchesYear && matchesCourse;
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl items-center mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("project.showcase") || "Project Showcase"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("project.showcaseDescription") ||
              "Browse student-built projects, share your work, and get feedback from the community."}
            
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => void fetchProjects(true)}
            disabled={refreshing || loading}
            title={t("common.refresh") || "Refresh"}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          {user && (
            <Button onClick={() => router.push("/project/create")}>
              <Plus className="h-4 w-4 mr-1" />
              {t("project.newProject") || "New Project"}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("project.searchProjects") || "Search projects..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("project.sortBy") || "Sort by"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              {t("project.newest") || "Newest"}
            </SelectItem>
            <SelectItem value="oldest">
              {t("project.oldest") || "Oldest"}
            </SelectItem>
            <SelectItem value="most_liked">
              {t("project.mostLiked") || "Most Liked"}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t("project.year") || "Year"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("project.allYears") || "All years"}
            </SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("project.course") || "Course"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("project.allCategories") || "All categories"}
            </SelectItem>
            {PROJECT_CATEGORY_OPTIONS.map((course) => (
              <SelectItem key={course.value} value={course.value}>
                {t(course.labelKey) || course.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue
              placeholder={t("project.difficulty") || "Difficulty"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("project.allDifficulties") || "All"}
            </SelectItem>
            <SelectItem value="beginner">
              {t("project.difficulty.beginner") || "Beginner"}
            </SelectItem>
            <SelectItem value="intermediate">
              {t("project.difficulty.intermediate") || "Intermediate"}
            </SelectItem>
            <SelectItem value="advanced">
              {t("project.difficulty.advanced") || "Advanced"}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("project.type") || "Type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("project.allTypes") || "All"}
            </SelectItem>
            {PROJECT_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {t(type.labelKey) || type.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && !loading && !error && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {displayedProjects.length} {t("common.results") || "results"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setSearchQuery("");
              setSortBy("newest");
              setYearFilter("all");
              setCourseFilter("all");
              setDifficultyFilter("");
              setTypeFilter("");
            }}
          >
            {t("common.clearFilters") || "Clear filters"}
          </Button>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Layers className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {activeTab === "my"
              ? t("project.noMyProjects") || "No projects yet"
              : t("project.noProjectsFound") || "No projects found"}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            {activeTab === "my"
              ? t("project.noMyProjectsDesc") ||
                "Start building your portfolio by creating your first project."
              : t("project.noProjectsFoundDesc") ||
                "Try adjusting your filters or search query."}
          </p>
          {activeTab === "my" && user && (
            <Button onClick={() => router.push("/project/create")}>
              <Plus className="h-4 w-4 mr-1" />
              {t("project.createFirst") || "Create Your First Project"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
