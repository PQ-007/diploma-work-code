"use client";

import KanbanBoard from "@/app/project/components/KanbanBoard";
import ProjectGanttChart from "@/app/project/components/ProjectGanttChart";
import ProjectUpdatesPanel from "@/app/project/components/ProjectUpdatesPanel";
import TeamManager from "@/app/project/components/TeamManager";
import type {
  ProjectMember,
  ProjectMilestone,
  ProjectPayload,
  ProjectUpdate,
} from "@/app/project/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  Calendar,
  ScrollText,
  Settings,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen pb-16 -mx-4 lg:-mx-8">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectDevWorkspacePage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const router = useRouter();
  const { t } = useLanguage();

  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("milestones");
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        if (!res.ok) {
          router.replace(`/project/${slug}`);
          return;
        }
        const data = await res.json();
        const owner = data.isOwner || false;
        const member = data.isMember || false;

        if (!owner && !member) {
          router.replace(`/project/${slug}`);
          return;
        }

        setProject(data);
        setIsOwner(owner);
        setIsMember(member);
      } catch {
        router.replace(`/project/${slug}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  const handleMilestonesChange = useCallback(
    (milestones: ProjectMilestone[]) => {
      if (!project) return;
      const completed = milestones.filter((m) => m.completed).length;
      const progress =
        milestones.length === 0
          ? 0
          : Math.round((completed / milestones.length) * 100);
      setProject({ ...project, milestones, progress });
    },
    [project],
  );

  const handleMembersChange = useCallback(
    (members: ProjectMember[]) => {
      if (!project) return;
      setProject({ ...project, members });
    },
    [project],
  );

  const handleUpdatesChange = useCallback(
    (updates: ProjectUpdate[]) => {
      if (!project) return;
      setProject({ ...project, updates });
    },
    [project],
  );

  if (loading) return <WorkspaceSkeleton />;
  if (!project) return null;

  const canEdit = isOwner || isMember;
  const milestonesCount = (project.milestones || []).length;
  const membersCount = (project.members || []).length;

  return (
    <div className="relative min-h-screen pb-16 -mx-4 lg:-mx-8 bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Card className="border-border/80 bg-card/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t("project.workspace") || "Workspace"}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">
                {project.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {isOwner
                  ? t("project.owner") || "Owner"
                  : t("project.member") || "Member"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/project/dev/${slug}/config`)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {t("project.configPage") || "Config"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/project/dev/${slug}/uploads`)}
              >
                <Upload className="h-4 w-4 mr-1" />
                {t("project.uploadsPage") || "Uploads"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/project/${slug}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("common.back") || "Back"}
              </Button>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="milestones" className="gap-1.5">
              <Target className="h-4 w-4" />
              {t("project.kanban") || "Tasks"}
              <span className="text-xs">{milestonesCount}</span>
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              {t("project.gantt") || "Gantt"}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5">
              <Users className="h-4 w-4" />
              {t("project.team") || "Team"}
              <span className="text-xs">{membersCount}</span>
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-1.5">
              <ScrollText className="h-4 w-4" />
              {t("project.projectLog") || "Updates"}
            </TabsTrigger>
          </TabsList>

          <Card className="mt-4 border-border/80 bg-card/90 p-4 sm:p-5">
            <TabsContent value="milestones" className="mt-0">
              <KanbanBoard
                slug={slug}
                milestones={project.milestones || []}
                progress={project.progress}
                canEdit={canEdit}
                onMilestonesChange={handleMilestonesChange}
              />
            </TabsContent>

            <TabsContent value="gantt" className="mt-0">
              <ProjectGanttChart milestones={project.milestones || []} />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <TeamManager
                slug={slug}
                members={project.members || []}
                isOwner={isOwner}
                onMembersChange={handleMembersChange}
              />
            </TabsContent>

            <TabsContent value="updates" className="mt-0">
              <ProjectUpdatesPanel
                slug={slug}
                updates={project.updates || []}
                canEdit={canEdit}
                milestones={project.milestones || []}
                members={project.members || []}
                createdAt={project.created_at}
                projectTitle={project.title}
                heroImageUrl={project.thumbnail_url}
                onUpdatesChange={handleUpdatesChange}
              />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
