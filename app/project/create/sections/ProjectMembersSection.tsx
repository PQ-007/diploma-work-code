"use client";

import type { Dispatch, SetStateAction } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, UserPlus, X } from "lucide-react";
import type { ProjectMemberRole } from "@/app/project/types";
import type { MemberEntry } from "../useProjectForm";

interface ProjectMembersSectionProps {
  members: MemberEntry[];
  memberError: string;
  memberUsername: string;
  setMemberUsername: Dispatch<SetStateAction<string>>;
  memberRole: ProjectMemberRole;
  setMemberRole: Dispatch<SetStateAction<ProjectMemberRole>>;
  addingMember: boolean;
  editSlug: string | null;
  handleAddMember: () => void;
  handleRemoveMember: (userId: string) => void;
  handleChangeRole: (userId: string, role: ProjectMemberRole) => void;
}

export function ProjectMembersSection({
  members,
  memberError,
  memberUsername,
  setMemberUsername,
  memberRole,
  setMemberRole,
  addingMember,
  editSlug,
  handleAddMember,
  handleRemoveMember,
  handleChangeRole,
}: ProjectMembersSectionProps) {
  return (
    <Card className="border-border/80 bg-card/90 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">Team Members</h3>
      </div>

      {/* Current members */}
      {members.length > 0 && (
        <div className="space-y-2 mb-4">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <Avatar className="h-7 w-7 border border-border flex-shrink-0">
                <AvatarImage src={m.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(m.profile?.display_name || m.profile?.user_name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {m.profile?.display_name || m.profile?.user_name || "Unknown"}
                </p>
                {m.profile?.user_name && (
                  <p className="text-xs text-muted-foreground">
                    @{m.profile.user_name}
                  </p>
                )}
              </div>
              <Select
                value={m.role}
                onValueChange={(v) =>
                  handleChangeRole(m.user_id, v as ProjectMemberRole)
                }
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => handleRemoveMember(m.user_id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add member */}
      {memberError && (
        <p className="text-xs text-destructive mb-2">{memberError}</p>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="@username"
          value={memberUsername}
          onChange={(e) => setMemberUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddMember();
            }
          }}
          className="h-8 text-xs flex-1"
        />
        <Select
          value={memberRole}
          onValueChange={(v) => setMemberRole(v as ProjectMemberRole)}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contributor">Contributor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3"
          onClick={handleAddMember}
          disabled={addingMember}
        >
          {addingMember ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      {!editSlug && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Save the project first to add team members.
        </p>
      )}
    </Card>
  );
}
