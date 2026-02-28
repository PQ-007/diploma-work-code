// pages/DashboardPage.tsx (Updated excerpt showing i18n usage)
"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  Clock,
  Code2,
  Flame,
  Target,
  Trophy,
  TrendingUp,
  Zap,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const userName = user?.user_metadata?.name || 'Guest';

  const statsData = [
    {
      title: t('dashboard.totalProjects'),
      value: "12",
      icon: <Code2 className="h-4 w-4" />,
      change: "+2 this week",
      changeType: "positive"
    },
    {
      title: t('dashboard.blogPosts'),
      value: "8",
      icon: <BookOpen className="h-4 w-4" />,
      change: "+1 this week", 
      changeType: "positive"
    },
    {
      title: t('dashboard.activeContests'),
      value: "3",
      icon: <Trophy className="h-4 w-4" />,
      change: "2 ending soon",
      changeType: "neutral"
    },
    {
      title: t('dashboard.studyCards'),
      value: "247",
      icon: <Brain className="h-4 w-4" />,
      change: "+15 today",
      changeType: "positive"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t('dashboard.welcomeBack', { name: userName })}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects and learning today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('dashboard.quickActions')}
            </CardTitle>
            <CardDescription>Start something new or continue your work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.newProject')}
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.newBlog')}
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Brain className="mr-2 h-4 w-4" />
              {t('dashboard.createFlashcards')}
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="mr-2 h-4 w-4" />
              {t('dashboard.joinContest')}
            </Button>
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('dashboard.learningProgress')}
            </CardTitle>
            <CardDescription>Your learning journey this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {t('dashboard.learningStreak')}
                </span>
                <span className="font-medium">23 {t('dashboard.days')}</span>
              </div>
              <Progress value={76} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  {t('dashboard.weeklyGoal')}
                </span>
                <span className="font-medium">87% {t('dashboard.completion')}</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}