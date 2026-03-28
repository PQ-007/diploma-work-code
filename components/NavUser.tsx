"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { createBrowserClient } from "@supabase/ssr";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Omega,
  Pi,
  Route,
  Sigma,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

// --- Shared Types and Constants ---

const languages = [
  { code: "en", name: "English", icon: Omega },
  { code: "mn", name: "Монгол", icon: Sigma },
  { code: "ja", name: "日本語", icon: Pi },
] as const;


type ProfileData = {
  user_name: string | null;
  display_name?: string | null; // Optional, can be derived from user_name if not provided
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  email: string | null;
};

// --- User Dropdown Component ---

export function NavUser() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const currentLanguage = languages.find((lang) => lang.code === language);

  // Fetch profile data from profiles table
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          console.log("No authenticated user");
          setLoading(false);
          return;
        }

       

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_name, avatar_url, bio, role, email, display_name")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          console.warn("Profile fetch failed:", profileError.message);
          setProfileData(null);
        } else if (profile) {
          
          setProfileData({
            user_name: profile.user_name,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            role: profile.role,
            email: profile.email,
          });
        }
      } catch (err) {
        console.error("Error in profile fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Use only profile data
  const userName = profileData?.user_name || "User";
  const displayName = profileData?.display_name || "User";
  const displayAvatar = profileData?.avatar_url || "";
  const displayEmail = profileData?.email || "";

  

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success("Signed Out", {
        description: "You have been successfully signed out.",
      });
      router.push("/");
    } catch (error) {
      console.error("Sign-out failed:", error);
      toast.error("Sign-out failed", {
        description: "An error occurred during sign-out. Please try again.",
      });
    }
  };

  const handleLanguageChange = (code: "en" | "mn" | "ja") => {
    setLanguage(code);
    const selectedLang =
      languages.find((lang) => lang.code === code)?.name || code;
    toast.success("Language Changed", {
      description: `Language set to ${selectedLang}.`,
    });
    // Closing only the language collapsible, not the entire dropdown
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  // User is logged in, show the dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label={`User menu for ${displayName }`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56"
        side="bottom"
        align="end"
        forceMount
      >
        {/* User Info Block */}
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex items-center gap-2 px-3 py-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {displayEmail}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* Static Links */}
          <DropdownMenuItem
            onClick={() => router.push("/profile/" + userName)}
            className="cursor-pointer"
          >
            <div className="flex">
              <UserRound className="mr-2 h-4 w-4" />
              <span>{t("nav_user.profile")}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/library")}
            className="cursor-pointer"
          >
            <div className="flex">
              <UserRound className="mr-2 h-4 w-4" />
              <span>{t("nav_user.library")}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/roadmap")}
            className="cursor-pointer"
          >
            <div className="flex">
              <Route className="mr-2 h-4 w-4" />
              <span>{t("nav_user.roadmap")}</span>
            </div>
          </DropdownMenuItem>

          {/* 🌟 THEME TOGGLE 🌟 */}
          <DropdownMenuItem
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              {resolvedTheme === "dark" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : (
                <Sun className="mr-2 h-4 w-4" />
              )}
              <span>{t("nav_user.theme")}</span>
            </div>
            <div className="ml-auto flex items-center">
              <div
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  resolvedTheme === "dark"
                    ? "bg-primary/80"
                    : "bg-muted-foreground/60",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform",
                    resolvedTheme === "dark"
                      ? "translate-x-4"
                      : "translate-x-0.5",
                  )}
                />
              </div>
            </div>
          </DropdownMenuItem>

          {/* 🌟 COLLAPSIBLE - LANGUAGE SELECTION 🌟 */}
          <Collapsible open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
            <CollapsibleTrigger asChild>
              <DropdownMenuItem
                className="cursor-pointer flex items-center justify-between w-full"
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4" />
                  <span>
                    {t("nav_user.language")} (
                    {currentLanguage?.name || "English"})
                  </span>
                </div>
                {isLanguageOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                )}
              </DropdownMenuItem>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col space-y-1 py-1 pl-8 pr-2">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <lang.icon className="h-4 w-4" />
                      <span>{lang.name}</span>
                    </div>
                    {language === lang.code && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </DropdownMenuGroup>

        {/* Sign Out */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("nav_user.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
