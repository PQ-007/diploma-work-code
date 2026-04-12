"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  GripVertical,
  Languages,
  Loader2,
  Palette,
  Pin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════ constants ═══════════════════════ */

const BANNER_GRADIENTS = [
  "from-violet-600 via-purple-500 to-fuchsia-500",
  "from-blue-600 via-cyan-500 to-teal-400",
  "from-orange-500 via-rose-500 to-pink-500",
  "from-emerald-500 via-green-400 to-lime-400",
  "from-indigo-600 via-blue-500 to-sky-400",
  "from-rose-500 via-red-500 to-orange-400",
  "from-amber-500 via-yellow-400 to-lime-400",
  "from-slate-700 via-zinc-600 to-neutral-500",
];

const RING_GRADIENTS = [
  { label: "Gold", value: "from-amber-400 via-yellow-300 to-amber-500" },
  { label: "Rose", value: "from-rose-400 via-pink-300 to-rose-500" },
  { label: "Ocean", value: "from-blue-400 via-cyan-300 to-blue-500" },
  { label: "Emerald", value: "from-emerald-400 via-green-300 to-emerald-500" },
  { label: "Purple", value: "from-purple-400 via-violet-300 to-purple-500" },
  { label: "Sunset", value: "from-orange-400 via-red-300 to-orange-500" },
  { label: "Silver", value: "from-slate-300 via-gray-200 to-slate-400" },
  { label: "None", value: "" },
];

const PROFICIENCY_LEVELS = [
  { label: "Beginner", color: "bg-slate-400" },
  { label: "Elementary", color: "bg-blue-400" },
  { label: "Intermediate", color: "bg-cyan-500" },
  { label: "Upper Intermediate", color: "bg-amber-500" },
  { label: "Advanced", color: "bg-orange-500" },
  { label: "Native", color: "bg-emerald-500" },
];

const JLPT_LEVELS = [
  { label: "N5", color: "bg-slate-400", desc: "Basic" },
  { label: "N4", color: "bg-blue-400", desc: "Elementary" },
  { label: "N3", color: "bg-cyan-500", desc: "Intermediate" },
  { label: "N2", color: "bg-amber-500", desc: "Upper" },
  { label: "N1", color: "bg-rose-500", desc: "Fluent" },
  { label: "Native", color: "bg-emerald-500", desc: "Native" },
];

const LANGUAGE_PRESETS = [
  { name: "English" },
  { name: "Mongolian" },
  { name: "Korean" },
  { name: "Japanese" },
  { name: "Chinese" },
  { name: "Russian" },
  { name: "German" },
  { name: "French" },
  { name: "Spanish" },
  { name: "Turkish" },
];

const SKILL_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "React",
  "Next.js",
  "Node.js",
  "HTML/CSS",
  "SQL",
  "MongoDB",
  "Git",
  "Docker",
  "AWS",
  "Machine Learning",
  "Mobile Dev",
  "Rust",
  "Go",
  "Vue.js",
];

interface LanguageSkill {
  language_name: string;
  proficiency_level: string;
}

/* ═══════════════════════ component ═══════════════════════ */

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t],
  );

  // loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // editable fields
  const [displayName, setDisplayName] = useState("");
  const [userName, setUserName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerGradient, setBannerGradient] = useState(BANNER_GRADIENTS[0]);
  const [avatarRingColor, setAvatarRingColor] = useState(
    RING_GRADIENTS[0].value,
  );
  const [skills, setSkills] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([]);
  const [pinnedArticleIds, setPinnedArticleIds] = useState<string[]>([]);
  const [pinnedProjectIds, setPinnedProjectIds] = useState<number[]>([]);

  // profile data for pin selection
  const [articles, setArticles] = useState<
    { id: string; title: string; views: number }[]
  >([]);
  const [projects, setProjects] = useState<
    { id: number; title: string; slug: string }[]
  >([]);

  /* ─── fetch current data ─── */
  const fetchProfile = useCallback(async () => {
    setPageLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        router.replace(`/profile/${slug}`);
        return;
      }
      const json = await res.json();

      if (!json.isOwner) {
        router.replace(`/profile/${slug}`);
        return;
      }

      const p = json.profile;
      setDisplayName(p.display_name || "");
      setUserName(p.user_name || "");
      setBio(p.bio || "");
      setAvatarUrl(p.avatar_url || "");
      setBannerGradient(
        p.banner_gradient || "from-violet-600 via-purple-500 to-fuchsia-500",
      );
      setAvatarRingColor(
        p.avatar_ring_color || "from-amber-400 via-yellow-300 to-amber-500",
      );
      setSkills(p.skills || "");
      setPinnedArticleIds(p.pinned_article_ids || []);
      setPinnedProjectIds(p.pinned_project_ids || []);

      // language skills from dedicated table
      if (json.languageSkills?.length > 0) {
        setLanguageSkills(
          json.languageSkills.map(
            (ls: { language_name: string; proficiency_level: string }) => ({
              language_name: ls.language_name,
              proficiency_level: ls.proficiency_level || "Beginner",
            }),
          ),
        );
      }

      // articles & projects for pin selection
      setArticles(
        (json.articles || []).map(
          (a: { id: string; title: string; views: number }) => ({
            id: a.id,
            title: a.title,
            views: a.views,
          }),
        ),
      );
      setProjects(
        (json.projects || []).map(
          (p: { id: number; title: string; slug: string }) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
          }),
        ),
      );
    } catch {
      router.replace(`/profile/${slug}`);
    } finally {
      setPageLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (!authLoading && user) fetchProfile();
    else if (!authLoading && !user) router.replace("/signin");
  }, [authLoading, user, fetchProfile, router]);

  /* ─── avatar upload ─── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await uploadImageToCloudinary(file);
      setAvatarUrl(result.secureUrl);
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ─── skills helpers ─── */
  const skillsList = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || skillsList.includes(trimmed)) return;
    const newList = [...skillsList, trimmed];
    setSkills(newList.join(", "));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    const newList = skillsList.filter((s) => s !== skill);
    setSkills(newList.join(", "));
  };

  /* ─── language skills helpers ─── */
  const addLanguageSkill = () => {
    setLanguageSkills((prev) => [
      ...prev,
      { language_name: "", proficiency_level: "Beginner" },
    ]);
  };

  const updateLanguageSkill = (
    idx: number,
    field: keyof LanguageSkill,
    value: string,
  ) => {
    setLanguageSkills((prev) =>
      prev.map((ls, i) => (i === idx ? { ...ls, [field]: value } : ls)),
    );
  };

  const removeLanguageSkill = (idx: number) => {
    setLanguageSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ─── pinned toggles ─── */
  const togglePinnedArticle = (id: string) => {
    setPinnedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const togglePinnedProject = (id: number) => {
    setPinnedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /* ─── save ─── */
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          user_name: userName,
          bio,
          avatar_url: avatarUrl,
          skills,
          banner_gradient: bannerGradient,
          avatar_ring_color: avatarRingColor,
          pinned_article_ids: pinnedArticleIds,
          pinned_project_ids: pinnedProjectIds,
          language_skills: languageSkills.filter((ls) =>
            ls.language_name.trim(),
          ),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(
          result.error ||
            tr("profile.edit.genericError", "Something went wrong"),
        );
        return;
      }
      setSuccess(true);
      // If username changed, redirect to new slug
      const newSlug = userName.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (newSlug !== slug) {
        router.replace(`/profile/${newSlug}/edit`);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(
        tr("profile.edit.networkError", "Network error - please try again"),
      );
    } finally {
      setSaving(false);
    }
  };

  /* ─── loading / guard ─── */
  if (pageLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 max-w-6xl mx-auto">
      {/* ═══════ Top Bar ═══════ */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href={`/profile/${slug}`}>
            <ChevronLeft className="h-4 w-4" />
            {tr("profile.edit.backToProfile", "Back to Profile")}
          </Link>
        </Button>
      </div>

      {/* ═══════ Error ═══════ */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ═══════ Header: Banner + Avatar ═══════ */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Banner — clickable to pick gradient */}
        <div
          className={`h-32 sm:h-40 bg-gradient-to-r ${bannerGradient} relative group cursor-pointer`}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Palette className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="relative bg-card border border-border border-t-0 rounded-b-2xl px-6 pb-5 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar — editable */}
            <div className="-mt-8 relative shrink-0 group">
              <div
                className={`rounded-full p-[3px] ${avatarRingColor ? `bg-gradient-to-br ${avatarRingColor}` : "bg-border"} shadow-[0_0_18px_rgba(251,191,36,0.3)]`}
              >
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground font-bold">
                    {displayName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/30 transition-colors"
              >
                {avatarUploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {avatarUrl && (
                <button
                  onClick={() => setAvatarUrl("")}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              )}
            </div>

            {/* Name / Username / Bio inputs */}
            <div className="flex-1 min-w-0 pt-3 sm:pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {tr("profile.edit.displayName", "Display Name")}
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={tr(
                      "profile.edit.displayNamePlaceholder",
                      "Your display name",
                    )}
                    maxLength={40}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {tr("profile.edit.username", "Username")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      @
                    </span>
                    <Input
                      value={userName}
                      onChange={(e) =>
                        setUserName(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_-]/g, ""),
                        )
                      }
                      placeholder={tr(
                        "profile.edit.usernamePlaceholder",
                        "username",
                      )}
                      maxLength={20}
                      className="h-9 pl-8"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {tr("profile.bio", "Bio")}
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={tr(
                    "profile.edit.bioPlaceholder",
                    "Tell people about yourself...",
                  )}
                  rows={2}
                  maxLength={200}
                  className="resize-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {bio.length}/200
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Banner Gradient Picker ═══════ */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {tr("profile.edit.bannerGradient", "Banner Gradient")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {BANNER_GRADIENTS.map((gradient) => (
              <button
                key={gradient}
                onClick={() => setBannerGradient(gradient)}
                className={`h-10 rounded-lg bg-gradient-to-r ${gradient} transition-all ${
                  bannerGradient === gradient
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {bannerGradient === gradient && (
                  <CheckCircle2 className="h-4 w-4 text-white mx-auto drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ Avatar Ring Color Picker ═══════ */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {tr("profile.edit.avatarRingColor", "Avatar Ring Color")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {RING_GRADIENTS.map((ring) => (
              <button
                key={ring.label}
                onClick={() => setAvatarRingColor(ring.value)}
                className={`relative h-10 rounded-lg transition-all ${
                  ring.value
                    ? `bg-gradient-to-r ${ring.value}`
                    : "bg-muted border border-dashed border-border"
                } ${
                  avatarRingColor === ring.value
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <span className="text-[9px] font-medium text-white drop-shadow-sm">
                  {ring.label}
                </span>
                {avatarRingColor === ring.value && (
                  <CheckCircle2 className="absolute top-0.5 right-0.5 h-3 w-3 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════ Two-Column Layout ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Skills */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                {tr("profile.skills", "Skills")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="rounded-full px-2.5 py-0.5 text-[11px] gap-1 cursor-pointer hover:bg-destructive/10"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill}
                    <X className="h-2.5 w-2.5" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder={tr(
                    "profile.edit.addSkillPlaceholder",
                    "Add a skill...",
                  )}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addSkill(skillInput)}
                  className="h-8 px-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* suggestions */}
              <div className="flex flex-wrap gap-1">
                {SKILL_SUGGESTIONS.filter((s) => !skillsList.includes(s))
                  .slice(0, 8)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Language Skills */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Languages className="h-4 w-4" />
                  {tr("profile.languageSkills", "Language Skills")}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs gap-1"
                  onClick={addLanguageSkill}
                >
                  <Plus className="h-3 w-3" />
                  {tr("common.add", "Add")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Quick-add presets */}
              {LANGUAGE_PRESETS.filter(
                (lp) =>
                  !languageSkills.some(
                    (ls) =>
                      ls.language_name.toLowerCase() === lp.name.toLowerCase(),
                  ),
              ).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {tr("profile.edit.quickAdd", "Quick add")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGE_PRESETS.filter(
                      (lp) =>
                        !languageSkills.some(
                          (ls) =>
                            ls.language_name.toLowerCase() ===
                            lp.name.toLowerCase(),
                        ),
                    )
                      .slice(0, 6)
                      .map((lp) => (
                        <button
                          key={lp.name}
                          onClick={() =>
                            setLanguageSkills((prev) => [
                              ...prev,
                              {
                                language_name: lp.name,
                                proficiency_level: "Beginner",
                              },
                            ])
                          }
                          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          {lp.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Language entries */}
              {languageSkills.length > 0 ? (
                <div className="space-y-2">
                  {languageSkills.map((ls, idx) => (
                    <div
                      key={idx}
                      className="group rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2.5 hover:border-border transition-colors"
                    >
                      {/* Top row: name + delete */}
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        <Input
                          value={ls.language_name}
                          onChange={(e) =>
                            updateLanguageSkill(
                              idx,
                              "language_name",
                              e.target.value,
                            )
                          }
                          placeholder="Language name"
                          placeholder={tr(
                            "profile.edit.languageName",
                            "Language name",
                          )}
                          className="h-8 text-sm flex-1 bg-background"
                        />
                        <button
                          onClick={() => removeLanguageSkill(idx)}
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {/* Proficiency level pills */}
                      {(() => {
                        const isJapanese =
                          ls.language_name.toLowerCase() === "japanese" ||
                          ls.language_name === "日本語";
                        const levels = isJapanese
                          ? JLPT_LEVELS
                          : PROFICIENCY_LEVELS;
                        return (
                          <div className="space-y-1 pl-6">
                            {isJapanese && (
                              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {tr("profile.edit.jlptLevel", "JLPT Level")}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {levels.map((lvl) => {
                                const isActive =
                                  ls.proficiency_level === lvl.label;
                                return (
                                  <button
                                    key={lvl.label}
                                    title={
                                      isJapanese
                                        ? (lvl as (typeof JLPT_LEVELS)[0]).desc
                                        : undefined
                                    }
                                    onClick={() =>
                                      updateLanguageSkill(
                                        idx,
                                        "proficiency_level",
                                        lvl.label,
                                      )
                                    }
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${
                                      isActive
                                        ? `${lvl.color} text-white shadow-sm scale-105`
                                        : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                                    }`}
                                  >
                                    {lvl.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border py-6 text-center">
                  <Languages className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    {tr(
                      "profile.edit.addLanguagesYouSpeak",
                      "Add languages you speak",
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {tr(
                      "profile.edit.addLanguagesHint",
                      "Click a preset above or the Add button",
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement — read-only display */}
          <Card className="border-border/60 opacity-60">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {tr("profile.engagement", "Engagement")}
                <span className="text-[10px] font-normal ml-2">
                  ({tr("profile.edit.readOnly", "read-only")})
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Pinned Articles */}
          {articles.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Pin className="h-3.5 w-3.5 -rotate-45" />
                  {tr("profile.edit.pinArticles", "Pin Articles")}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    ({pinnedArticleIds.length}{" "}
                    {tr("profile.edit.pinned", "pinned")})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {articles.map((article) => {
                    const isPinned = pinnedArticleIds.includes(article.id);
                    return (
                      <button
                        key={article.id}
                        onClick={() => togglePinnedArticle(article.id)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                          isPinned
                            ? "bg-amber-500/10 border border-amber-500/30"
                            : "border border-transparent hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            isPinned
                              ? "bg-amber-500 border-amber-500"
                              : "border-border"
                          }`}
                        >
                          {isPinned && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-xs text-foreground line-clamp-1 flex-1">
                          {article.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pinned Projects */}
          {projects.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Pin className="h-3.5 w-3.5 -rotate-45" />
                  {tr("profile.edit.pinProjects", "Pin Projects")}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    ({pinnedProjectIds.length}{" "}
                    {tr("profile.edit.pinned", "pinned")})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {projects.map((project) => {
                    const isPinned = pinnedProjectIds.includes(project.id);
                    return (
                      <button
                        key={project.id}
                        onClick={() => togglePinnedProject(project.id)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                          isPinned
                            ? "bg-amber-500/10 border border-amber-500/30"
                            : "border border-transparent hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            isPinned
                              ? "bg-amber-500 border-amber-500"
                              : "border-border"
                          }`}
                        >
                          {isPinned && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-xs text-foreground line-clamp-1 flex-1">
                          {project.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══════ Bottom Save Bar ═══════ */}
      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="gap-2 shadow-lg"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving
            ? tr("common.saving", "Saving...")
            : tr("common.saveChanges", "Save Changes")}
        </Button>
      </div>
    </div>
  );
}
