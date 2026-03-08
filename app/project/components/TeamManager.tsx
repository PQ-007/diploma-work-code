"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Crown, Pencil, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ProjectMember, ProjectMemberRole } from "@/app/project/types";

interface TeamManagerProps {
  slug: string;
  members: ProjectMember[];
  isOwner: boolean;
  onMembersChange: (members: ProjectMember[]) => void;
}

const roleIcons: Record<ProjectMemberRole, typeof Crown> = {
  owner: Crown,
  contributor: Pencil,
  viewer: Eye,
};

const roleColors: Record<ProjectMemberRole, string> = {
  owner: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  contributor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  viewer: "bg-muted text-muted-foreground",
};

export default function TeamManager({
  slug,
  members,
  isOwner,
  onMembersChange,
}: TeamManagerProps) {
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"contributor" | "viewer">("contributor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!userId.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      if (res.ok) {
        // Refresh members
        const membersRes = await fetch(`/api/projects/${slug}/members`);
        if (membersRes.ok) {
          const data = await membersRes.json();
          onMembersChange(data.members);
        }
        setUserId("");
        setAdding(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add member");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    const updated = members.filter((m) => m.user_id !== memberId);
    onMembersChange(updated);

    await fetch(`/api/projects/${slug}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: memberId }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t("project.team") || "Team"} ({members.length})
        </h3>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role];
          return (
            <div
              key={member.user_id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(
                    member.profile?.display_name ||
                    member.profile?.user_name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.profile?.display_name ||
                    member.profile?.user_name ||
                    "User"}
                </p>
                {member.profile?.user_name && (
                  <p className="text-xs text-muted-foreground">
                    @{member.profile.user_name}
                  </p>
                )}
              </div>

              <Badge
                variant="outline"
                className={`text-[10px] ${roleColors[member.role]}`}
              >
                <RoleIcon className="h-3 w-3 mr-1" />
                {member.role}
              </Badge>

              {isOwner && member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(member.user_id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add member */}
      {isOwner && !adding && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("project.addMember") || "Add Member"}
        </Button>
      )}

      {isOwner && adding && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <Input
            placeholder={t("project.userIdPlaceholder") || "Enter user ID"}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "contributor" | "viewer")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contributor">
                {t("project.contributor") || "Contributor"}
              </SelectItem>
              <SelectItem value="viewer">
                {t("project.viewer") || "Viewer"}
              </SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving
                ? t("common.adding") || "Adding..."
                : t("common.add") || "Add"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setError("");
              }}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
