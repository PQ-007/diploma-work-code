"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormAlert } from "@/components/common/Form";
import { categoryLabel } from "@/components/competition/EntryList";
import { useCompetitionSignUp } from "@/lib/hooks/mutations/useCompetitionEntry";

interface MyProject {
  id: number;
  title: string;
  slug: string;
}

/** The caller's own contest projects (the API's "my" scope = projects they created). */
function useMyContestProjects(enabled: boolean) {
  return useQuery({
    queryKey: ["projects", "my", "contest"],
    queryFn: async () => {
      const res = await fetch("/api/projects?scope=my&type=contest&limit=50");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `projects → ${res.status}`);
      return (body.items ?? []) as MyProject[];
    },
    enabled,
  });
}

/**
 * Sign-up: pick a category, then one of my contest projects or a new team (which creates a contest project).
 * On success: "You're in" + a link to the project's edit form, where teammates are added.
 */
export function SignUpDialog({
  slug,
  categories,
  open,
  onOpenChange,
}: {
  slug: string;
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const signUp = useCompetitionSignUp(slug);
  const projects = useMyContestProjects(open);

  const [category, setCategory] = useState(categories[0] ?? "");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [doneSlug, setDoneSlug] = useState<string | null>(null);

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (open) {
      setCategory(categories[0] ?? "");
      setMode("existing");
      setProjectId("");
      setTitle("");
      setDescription("");
      setDoneSlug(null);
      signUp.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Nothing to pick from → go straight to "new team".
  const hasProjects = (projects.data?.length ?? 0) > 0;
  useEffect(() => {
    if (projects.isSuccess && !hasProjects) setMode("new");
  }, [projects.isSuccess, hasProjects]);

  const canSubmit =
    Boolean(category) && (mode === "existing" ? Boolean(projectId) : title.trim().length > 0) && !signUp.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const body =
      mode === "existing"
        ? { category, projectId: Number(projectId) }
        : { category, newProject: { title: title.trim(), description: description.trim() } };
    signUp.mutate(body, { onSuccess: (r) => setDoneSlug(r.project_slug) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {doneSlug ? (
          <>
            <DialogHeader className="items-center text-center">
              <CheckCircle2 className="mb-1 size-10 text-success" aria-hidden />
              <DialogTitle>{t("competition.dialog.successTitle")}</DialogTitle>
              <DialogDescription>{t("competition.dialog.successText")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("competition.dialog.done")}
              </Button>
              <Button asChild>
                <Link href={`/project/create?edit=${encodeURIComponent(doneSlug)}`}>{t("competition.dialog.addTeammates")}</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t("competition.dialog.title")}</DialogTitle>
              <DialogDescription>{t("competition.dialog.description")}</DialogDescription>
            </DialogHeader>

            {categories.length > 1 && (
              <Field label={t("competition.category")} htmlFor="signup-category" required>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="signup-category" className="w-full capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Tabs value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing" disabled={!hasProjects}>
                  {t("competition.dialog.existing")}
                </TabsTrigger>
                <TabsTrigger value="new">{t("competition.dialog.newTeam")}</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "existing" ? (
              <Field
                label={t("competition.dialog.project")}
                htmlFor="signup-project"
                required
                hint={projects.isSuccess && !hasProjects ? t("competition.dialog.noProjects") : undefined}
              >
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="signup-project" className="w-full">
                    <SelectValue placeholder={t("competition.dialog.chooseProject")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <>
                <Field label={t("competition.dialog.teamName")} htmlFor="signup-title" required hint={t("competition.dialog.teamNameHint")}>
                  <Input id="signup-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </Field>
                <Field label={t("competition.dialog.teamDescription")} htmlFor="signup-description">
                  <Textarea id="signup-description" value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />
                </Field>
              </>
            )}

            {signUp.isError && <FormAlert>{(signUp.error as Error).message}</FormAlert>}

            <DialogFooter>
              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                {signUp.isPending ? t("competition.dialog.submitting") : t("competition.dialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
