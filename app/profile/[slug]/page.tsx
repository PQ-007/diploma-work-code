"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  Bell,
  Calendar,
  Camera,
  Code,
  Edit,
  Eye,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Save,
  Shield,
  Target,
  Trophy,
  Twitter
} from "lucide-react";
import { useState } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  joinDate: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  skills: string[];
  interests: string[];
  stats: {
    projectsCompleted: number;
    coursesCompleted: number;
    blogPosts: number;
    contestsParticipated: number;
    totalPoints: number;
    currentStreak: number;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedDate: string;
    category: string;
  }[];
  preferences: {
    emailNotifications: boolean;
    publicProfile: boolean;
    showActivity: boolean;
    darkMode: boolean;
    weeklyDigest: boolean;
    contestReminders: boolean;
  };
}

const userProfile: UserProfile = {
  id: "1",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  username: "alexj_dev",
  avatar: "/api/placeholder/120/120",
  bio: "Full-stack developer passionate about creating amazing user experiences. Love working with React, Node.js, and exploring new technologies. Always learning, always building.",
  location: "San Francisco, CA",
  website: "https://alexjohnson.dev",
  joinDate: "2023-03-15",
  socialLinks: {
    github: "https://github.com/alexj-dev",
    linkedin: "https://linkedin.com/in/alexjohnson",
    twitter: "https://twitter.com/alexj_dev",
  },
  skills: [
    "JavaScript",
    "React",
    "Node.js",
    "TypeScript",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "GraphQL",
  ],
  interests: [
    "Web Development",
    "Machine Learning",
    "Open Source",
    "UI/UX Design",
    "DevOps",
    "Mobile Development",
  ],
  stats: {
    projectsCompleted: 23,
    coursesCompleted: 12,
    blogPosts: 8,
    contestsParticipated: 15,
    totalPoints: 2847,
    currentStreak: 7,
  },
  achievements: [
    {
      id: "1",
      name: "First Steps",
      description: "Completed your first project",
      icon: "🎯",
      earnedDate: "2023-03-20",
      category: "Projects",
    },
    {
      id: "2",
      name: "Knowledge Seeker",
      description: "Completed 10 courses",
      icon: "📚",
      earnedDate: "2024-01-15",
      category: "Learning",
    },
    {
      id: "3",
      name: "Community Contributor",
      description: "Published 5 blog posts",
      icon: "✍️",
      earnedDate: "2024-06-10",
      category: "Content",
    },
    {
      id: "4",
      name: "Code Warrior",
      description: "Participated in 10 coding contests",
      icon: "⚔️",
      earnedDate: "2024-08-22",
      category: "Competition",
    },
    {
      id: "5",
      name: "Streak Master",
      description: "Maintained a 7-day learning streak",
      icon: "🔥",
      earnedDate: "2024-12-10",
      category: "Consistency",
    },
  ],
  preferences: {
    emailNotifications: true,
    publicProfile: true,
    showActivity: true,
    darkMode: true,
    weeklyDigest: true,
    contestReminders: true,
  },
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(userProfile);
  const [activeTab, setActiveTab] = useState("overview");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  };

  const handleSaveProfile = () => {
    // In a real app, this would save to backend
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="text-lg">
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">{profile.name}</h2>
                      <p className="text-muted-foreground">
                        @{profile.username}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                        <Calendar className="h-4 w-4 ml-2" />
                        <span>Joined {formatJoinDate(profile.joinDate)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {profile.socialLinks.github && (
                        <Button variant="outline" size="sm">
                          <Github className="h-4 w-4" />
                        </Button>
                      )}
                      {profile.socialLinks.linkedin && (
                        <Button variant="outline" size="sm">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      )}
                      {profile.socialLinks.twitter && (
                        <Button variant="outline" size="sm">
                          <Twitter className="h-4 w-4" />
                        </Button>
                      )}
                      {profile.website && (
                        <Button variant="outline" size="sm">
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.stats.projectsCompleted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {profile.stats.coursesCompleted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {profile.stats.blogPosts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Blog Posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {profile.stats.contestsParticipated}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Contests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {profile.stats.totalPoints}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {profile.stats.currentStreak}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
              </CardContent>
            </Card>
          </div>

          {/* Skills and Interests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.achievements.slice(0, 3).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(achievement.earnedDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) =>
                      setProfile({ ...profile, username: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Connect your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={profile.socialLinks.github || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      socialLinks: {
                        ...profile.socialLinks,
                        github: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={profile.socialLinks.linkedin || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      socialLinks: {
                        ...profile.socialLinks,
                        linkedin: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={profile.socialLinks.twitter || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      socialLinks: {
                        ...profile.socialLinks,
                        twitter: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                All Achievements
              </CardTitle>
              <CardDescription>
                Track your progress and accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {achievement.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(achievement.earnedDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        emailNotifications: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Get weekly summary of your activity
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        weeklyDigest: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Contest Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Remind me about upcoming contests
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.contestReminders}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        contestReminders: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>Control your profile visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to others
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.publicProfile}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        publicProfile: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Activity</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your recent activity publicly
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.showActivity}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: {
                        ...profile.preferences,
                        showActivity: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Account Data
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full justify-start">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
