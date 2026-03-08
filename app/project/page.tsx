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
import { Search, Plus, Folder, Layers } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import ProjectCard from "@/app/project/components/ProjectCard";
import type { ProjectPayload } from "@/app/project/types";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"public" | "my">("public");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("scope", activeTab);
      if (searchQuery) params.set("search", searchQuery);
      if (sortBy) params.set("sort", sortBy);
      if (difficultyFilter && difficultyFilter !== "all")
        params.set("difficulty", difficultyFilter);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.items || []);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, sortBy, difficultyFilter, typeFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("project.showcase") || "Project Showcase"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("project.showcaseDescription") ||
              "Discover and share academic projects built by students"}
          </p>
        </div>
        {user && (
          <Button onClick={() => router.push("/project/create")}>
            <Plus className="h-4 w-4 mr-1" />
            {t("project.newProject") || "New Project"}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "public" | "my")}
      >
        <TabsList>
          <TabsTrigger value="public">
            {t("project.publicProjects") || "Public Projects"}
          </TabsTrigger>
          {user && (
            <TabsTrigger value="my">
              {t("project.myProjects") || "My Projects"}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

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
            <SelectItem value="coding">
              {t("project.type.coding") || "Coding"}
            </SelectItem>
            <SelectItem value="research">
              {t("project.type.research") || "Research"}
            </SelectItem>
            <SelectItem value="design">
              {t("project.type.design") || "Design"}
            </SelectItem>
            <SelectItem value="other">
              {t("project.type.other") || "Other"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map((project) => (
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
              ? t("project.noMyProjectsDesc") || "Start building your portfolio by creating your first project."
              : t("project.noProjectsFoundDesc") || "Try adjusting your filters or search query."}
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
