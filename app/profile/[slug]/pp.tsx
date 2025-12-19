"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";
import { Edit, Loader2, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaFacebook, FaInstagram, FaYoutube, FaGithub } from "react-icons/fa";
import { Profile, SocialLink } from "@/components/profile/type";
import { Avatar as CustomAvatar } from "@/components/profile/Avatar";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { BioSection } from "@/components/profile/BioSection";
import { SkillsSection } from "@/components/profile/SkillSection";
import { StatsSection } from "@/components/profile/StatsSection";
import { InterestsSection } from "@/components/profile/InterestSection";
import { ContentTabs } from "@/components/profile/ContentTabs";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  // const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // User data extraction
  // const userData = {
  //   name: user?.user_metadata?.name || "Guest",
  //   email: user?.email || "Not provided",
  //   avatar: user?.user_metadata?.avatar_url || "",
  // };

  // // Fetch profile data based on user ID
  // useEffect(() => {
  //   const fetchProfileData = async () => {
  //     setError(null);

  //     // try {
  //     //   if (!user?.id) {
  //     //     throw new Error("User ID is undefined");
  //     //   }
  //     //   const result = await profileService.getProfile(user.id);
  //     //   setProfile(result);
  //     // } catch (err) {
  //     //   console.error("Error fetching profile:", err);
  //     //   setError("Failed to load profile data. Please try again later.");
  //     // } 
  //   };

  //   if (user) {
  //     fetchProfileData();
  //   } else {
  //     setIsLoading(false);
  //     router.push("/signin");
  //   }
  // }, [user, router]);

  const profile : Profile = {
  avatar: "https://example.com/images/profile-photo.jpg",
  type: "Student",
  name: "Bilguun Tushig",
  email: "bilguun.tushig@example.com",
  departure: "Computer Science",
  year: 2025,
  bio: "Enthusiastic developer passionate about AI, biological computing, and game development. Loves building community-driven platforms.",
  following: 152,
  followers: 1_024,
  programming_skills: ["JavaScript", "TypeScript", "Python", "C++", "Flutter"],
  language_skills: ["English", "Japanese", "Mongolian"],
  achievements: [
    "Winner - National Programming Contest 2024",
    "Published research on biological computation",
    "Built an award-winning flashcard app"
  ],
  posts: ["post-001", "post-002", "post-003"],
  pinned: ["post-002"],
  projects: ["project-001", "project-002"],
  courses: ["Algorithms", "Machine Learning", "UI/UX Design"],
  badges: ["Early Adopter", "Top Contributor", "Hackathon Winner"],
  portfolio: "https://bilguun-portfolio.com",
  currentFocus: "Building FutureHub platform and Flashcard integration",
  interests_hobby: ["Gundam model building", "Hiking", "Reading sci-fi novels"],
  certifications: [
    "AWS Certified Developer",
    "Google Cloud Professional",
    "Japanese Language Proficiency Test N3"
  ],
  socialLinks: {
    facebook: "https://facebook.com/bilguun.tushig",
    instagram: "https://instagram.com/bilguun.tushig",
    youtube: "https://youtube.com/@bilguun_tushig",
    github: "https://github.com/bilguun-tushig"
  },
  joinedDate: "2023-05-20",
  photoUrl: "https://example.com/images/profile-photo.jpg"
};

const userData = profile;
  // Handle sign-out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Sign-out failed:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  // // Loading state
  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen bg-background">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading profile" />
  //     </div>
  //   );
  // }

  // // Error state
  // if (error) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="bg-red-900/30 text-red-200 p-6 rounded-lg max-w-md">
  //         <h2 className="text-xl font-bold mb-2">Error</h2>
  //         <p>{error}</p>
  //         <p className="mt-4 text-sm">User ID: {user?.id}</p>
  //       </div>
  //     </div>
  //   );
  // }

  // No profile data
  // if (!profile) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="bg-gray-800 p-6 rounded-lg max-w-md text-center">
  //         <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
  //         <p className="text-gray-400">
  //           Could not find a profile for user ID: {user?.id}
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  // Social links
  const socialLinks: SocialLink[] = [
    profile.socialLinks?.facebook
      ? {
          icon: <FaFacebook />,
          color: "text-blue-600",
          name: "Facebook",
          link: profile.socialLinks.facebook,
        }
      : undefined,
    profile.socialLinks?.instagram
      ? {
          icon: <FaInstagram />,
          color: "text-pink-500",
          name: "Instagram",
          link: profile.socialLinks.instagram,
        }
      : undefined,
    profile.socialLinks?.youtube
      ? {
          icon: <FaYoutube />,
          color: "text-red-500",
          name: "YouTube",
          link: profile.socialLinks.youtube,
        }
      : undefined,
    profile.socialLinks?.github
      ? {
          icon: <FaGithub />,
          color: "text-gray-300",
          name: "GitHub",
          link: profile.socialLinks.github,
        }
      : undefined,
  ].filter((link): link is SocialLink => link !== undefined);

  // Stats
  const statCards = [
    { label: "Posts", count: profile.posts?.length || 0 },
    { label: "Projects", count: profile.projects?.length || 0 },
    { label: "Courses", count: profile.courses?.length || 0 },
    { label: "Badges", count: profile.badges?.length || 0 },
  ];

  // Tabs
  const tabs = [
    { key: "pinned", label: "Pinned", items: profile.pinned || [] },
    { key: "posts", label: "Posts", items: profile.posts || [] },
    { key: "projects", label: "Projects", items: profile.projects || [] },
    { key: "certifications", label: "Certifications", items: profile.certifications || [] },
  ];

  return (
    <div className="container mx-auto p-6">
      <Card className="shadow-lg border-none bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white">
       
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <CustomAvatar profile={profile} />
            <ProfileInfo
              profile={profile}
              toggleFollow={toggleFollow}
              socialLinks={socialLinks}
              isFollowing={isFollowing}
              myProfile={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <BioSection profile={profile} />
              <SkillsSection profile={profile} />
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
              <StatsSection statCards={statCards} />
              <InterestsSection profile={profile} />
              <ContentTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
              />
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2 hover:bg-muted transition-colors"
              onClick={() => router.push("/profile/edit")}
              aria-label="Edit profile"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              className="flex items-center gap-2 hover:bg-destructive/90 transition-colors"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label="Sign out"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}