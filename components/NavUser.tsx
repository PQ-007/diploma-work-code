"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

type ProfileData = {
  user_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

/** Roles allowed by the dictionary moderation RLS policies. */
const MODERATOR_ROLES = ["admin", "teacher"];

export function NavUser() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("user_name, display_name, avatar_url, role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null));
  }, [supabase, user]);

  // Ignore a profile fetched for a previous session once signed out.
  const profile_ = user ? profile : null;
  const name = profile_?.display_name || profile_?.user_name || "User";
  const isModerator = MODERATOR_ROLES.includes(profile_?.role ?? "");

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t("nav_user.signOutFailed"));
      return;
    }
    toast.success(t("nav_user.signedOut"));
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`User menu for ${name}`}
          className="rounded-full outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9 border">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
            <AvatarFallback className="text-sm font-medium">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar className="size-10">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
            <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{name}</span>
            {profile?.user_name && <span className="truncate text-xs text-muted-foreground">@{profile.user_name}</span>}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile?.user_name && (
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 py-2">
            <Link href={`/profile/${profile.user_name}`}>
              <UserRound className="size-4" />
              {t("nav_user.profile")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer gap-2.5 py-2">
          <Link href="/settings">
            <Settings className="size-4" />
            {t("nav_user.settings")}
          </Link>
        </DropdownMenuItem>
        {isModerator && (
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 py-2">
            <Link href="/dictionary/moderation">
              <ShieldCheck className="size-4" />
              {t("dictionary.moderation.open")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer gap-2.5 py-2 text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          {t("nav_user.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
