"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  User,
  Palette,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

const BANNER_COLORS = [
  "from-violet-600 via-purple-500 to-fuchsia-500",
  "from-blue-600 via-cyan-500 to-teal-400",
  "from-orange-500 via-rose-500 to-pink-500",
  "from-emerald-500 via-green-400 to-lime-400",
  "from-indigo-600 via-blue-500 to-sky-400",
  "from-rose-500 via-red-500 to-orange-400",
  "from-amber-500 via-yellow-400 to-lime-400",
  "from-slate-700 via-zinc-600 to-neutral-500",
];

const AVATAR_STYLES = [
  "adventurer",
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "micah",
  "miniavs",
  "notionists",
];

const SKILL_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
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
];

export default function SetupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerGradient, setBannerGradient] = useState(BANNER_COLORS[0]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [authLoading, user, router]);

  // Pre-fill from profile table + user_metadata
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_name, display_name, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (data) {
        if (data.display_name) setDisplayName(data.display_name);
        if (data.user_name) setUsername(data.user_name);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.bio) setBio(data.bio);
      }

      // Banner & skills are only in user_metadata
      const m = user.user_metadata;
      if (m?.bannerGradient) setBannerGradient(m.bannerGradient);
      if (m?.skills) setSelectedSkills(m.skills);
    };

    loadProfile();
  }, [user, supabase]);

  const totalSteps = 4;
  

  const generateDiceBearAvatar = (style: string) => {
    const seed = username || displayName || user?.id || "default";
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const result = await uploadImageToCloudinary(file);
      setAvatarUrl(result.secureUrl);
    } catch {
      // Silently fall back
    } finally {
      setAvatarUploading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 8
          ? [...prev, skill]
          : prev,
    );
  };

  const [error, setError] = useState("");

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          avatarUrl,
          bio,
          bannerGradient,
          skills: selectedSkills,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        return;
      }

      router.push("/");
    } catch (err) {
      console.error("Setup error:", err);
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return displayName.trim().length >= 2 && username.trim().length >= 3;
      case 1:
        return true; // avatar is optional
      case 2:
        return true; // banner is optional
      case 3:
        return true; // skills optional
      default:
        return false;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-start justify-center px-4 ">
      <div className="w-full max-w-xl space-y-6">
        {/* Header & Progress */}
        <div className="text-center space-y-4">
          
          <div className="flex gap-1.5 max-w-xs mx-auto">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Live Preview Card — compact */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card/60 backdrop-blur-sm shadow-lg">
          <div className={`h-20 bg-gradient-to-r ${bannerGradient} relative`} />
          <div className="relative px-5 pb-4">
            <div className="-mt-8 flex items-end gap-3">
              <Avatar className="h-16 w-16 border-[3px] border-card shadow-xl ring-2 ring-background">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-lg bg-muted text-muted-foreground font-bold">
                  {displayName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="pb-0.5 min-w-0">
                <h3 className="font-bold text-base text-foreground leading-tight truncate">
                  {displayName || "Your Name"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  @{username || "username"}
                </p>
              </div>
            </div>
            {bio && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                {bio}
              </p>
            )}
            {selectedSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedSkills.slice(0, 5).map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="text-[10px] px-2 py-0"
                  >
                    {skill}
                  </Badge>
                ))}
                {selectedSkills.length > 5 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0">
                    +{selectedSkills.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
          {/* Step 0: Name & Username */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    What should we call you?
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a display name and a unique username.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Bat-Erdene"
                    maxLength={40}
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      @
                    </span>
                    <Input
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_-]/g, ""),
                        )
                      }
                      placeholder="bat_erdene"
                      className="h-11 pl-8"
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Bio{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={2}
                    maxLength={160}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/160
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Avatar */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Pick your avatar
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a photo or choose a generated style.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="gap-2"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Upload Photo
                </Button>
                {avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl("")}
                    className="text-muted-foreground text-xs"
                  >
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Or choose a style:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_STYLES.map((style) => {
                    const url = generateDiceBearAvatar(style);
                    const isSelected = avatarUrl === url;
                    return (
                      <button
                        key={style}
                        onClick={() => setAvatarUrl(url)}
                        className={`group relative rounded-xl border-2 p-2.5 transition-all duration-200 hover:scale-105 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <Avatar className="h-14 w-14 mx-auto">
                          <AvatarImage src={url} />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <p className="text-[10px] text-center mt-1.5 text-muted-foreground capitalize truncate">
                          {style.replace("-", " ")}
                        </p>
                        {isSelected && (
                          <CheckCircle2 className="absolute top-1 right-1 h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Banner Color */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Choose your banner
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pick a gradient for your profile header.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {BANNER_COLORS.map((gradient) => {
                  const isSelected = bannerGradient === gradient;
                  return (
                    <button
                      key={gradient}
                      onClick={() => setBannerGradient(gradient)}
                      className={`relative h-16 rounded-xl bg-gradient-to-r ${gradient} transition-all duration-200 hover:scale-[1.02] ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
                          : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    What are you into?
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select up to 8 skills or interests.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isSelected && "✓ "}
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSkills.length}/8 selected
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                size="sm"
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving || !canAdvance()}
                size="sm"
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Finish Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
