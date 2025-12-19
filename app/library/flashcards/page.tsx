"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  RotateCcw,
  Plus,
  Search,
  Filter,
  Play,
  Edit,
  Trash2,
  Star,
  Target
} from "lucide-react";
import { useState } from "react";

interface FlashcardDeck {
  id: string;
  name: string;
  description: string;
  category: string;
  totalCards: number;
  studiedCards: number;
  masteredCards: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lastStudied: string;
  createdAt: string;
  tags: string[];
  isPublic: boolean;
  rating: number;
  timesStudied: number;
}

interface StudySession {
  id: string;
  deckName: string;
  date: string;
  cardsStudied: number;
  accuracy: number;
  duration: number; // in minutes
}

const flashcardDecks: FlashcardDeck[] = [
  {
    id: "1",
    name: "JavaScript Fundamentals",
    description: "Core concepts of JavaScript including variables, functions, and closures",
    category: "Programming",
    totalCards: 45,
    studiedCards: 32,
    masteredCards: 18,
    difficulty: "Beginner",
    lastStudied: "2024-12-15",
    createdAt: "2024-11-20",
    tags: ["JavaScript", "Web Development", "Fundamentals"],
    isPublic: true,
    rating: 4.8,
    timesStudied: 23
  },
  {
    id: "2",
    name: "React Hooks",
    description: "Master useState, useEffect, useContext and other React hooks",
    category: "Programming",
    totalCards: 28,
    studiedCards: 28,
    masteredCards: 25,
    difficulty: "Intermediate",
    lastStudied: "2024-12-14",
    createdAt: "2024-11-15",
    tags: ["React", "Hooks", "Frontend"],
    isPublic: true,
    rating: 4.9,
    timesStudied: 18
  },
  {
    id: "3",
    name: "Data Structures & Algorithms",
    description: "Arrays, linked lists, trees, sorting algorithms and complexity analysis",
    category: "Computer Science",
    totalCards: 67,
    studiedCards: 42,
    masteredCards: 15,
    difficulty: "Advanced",
    lastStudied: "2024-12-13",
    createdAt: "2024-10-30",
    tags: ["Algorithms", "Data Structures", "Interview Prep"],
    isPublic: false,
    rating: 4.7,
    timesStudied: 31
  },
  {
    id: "4",
    name: "System Design Basics",
    description: "Scalability patterns, load balancing, caching, and database design",
    category: "System Design",
    totalCards: 35,
    studiedCards: 12,
    masteredCards: 5,
    difficulty: "Advanced",
    lastStudied: "2024-12-10",
    createdAt: "2024-12-01",
    tags: ["System Design", "Scalability", "Architecture"],
    isPublic: true,
    rating: 4.6,
    timesStudied: 8
  }
];

const studySessions: StudySession[] = [
  { id: "1", deckName: "JavaScript Fundamentals", date: "2024-12-15", cardsStudied: 15, accuracy: 87, duration: 25 },
  { id: "2", deckName: "React Hooks", date: "2024-12-14", cardsStudied: 12, accuracy: 92, duration: 18 },
  { id: "3", deckName: "Data Structures & Algorithms", date: "2024-12-13", cardsStudied: 20, accuracy: 78, duration: 35 },
  { id: "4", deckName: "System Design Basics", date: "2024-12-10", cardsStudied: 8, accuracy: 75, duration: 15 }
];

export default function FlashcardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Get unique categories
  const categories = Array.from(new Set(flashcardDecks.map(deck => deck.category)));

  // Filter decks
  const filteredDecks = flashcardDecks.filter(deck => {
    const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "" || deck.category === selectedCategory;
    
    if (activeTab === "all") return matchesSearch && matchesCategory;
    if (activeTab === "studying") return matchesSearch && matchesCategory && deck.studiedCards > 0 && deck.studiedCards < deck.totalCards;
    if (activeTab === "mastered") return matchesSearch && matchesCategory && deck.masteredCards === deck.totalCards;
    if (activeTab === "new") return matchesSearch && matchesCategory && deck.studiedCards === 0;
    
    return matchesSearch && matchesCategory;
  });

  const getProgressPercentage = (deck: FlashcardDeck) => {
    return Math.round((deck.studiedCards / deck.totalCards) * 100);
  };

  const getMasteryPercentage = (deck: FlashcardDeck) => {
    return Math.round((deck.masteredCards / deck.totalCards) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: FlashcardDeck["difficulty"]) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-500";
      case "Intermediate": return "bg-yellow-500";
      case "Advanced": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const totalCards = flashcardDecks.reduce((acc, deck) => acc + deck.totalCards, 0);
  const totalStudied = flashcardDecks.reduce((acc, deck) => acc + deck.studiedCards, 0);
  const totalMastered = flashcardDecks.reduce((acc, deck) => acc + deck.masteredCards, 0);
  const averageAccuracy = studySessions.length > 0 
    ? Math.round(studySessions.reduce((acc, session) => acc + session.accuracy, 0) / studySessions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground mt-1">
            Study and memorize concepts with spaced repetition
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Deck
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCards}</div>
                <p className="text-xs text-muted-foreground">Total Cards</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStudied}</div>
                <p className="text-xs text-muted-foreground">Cards Studied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMastered}</div>
                <p className="text-xs text-muted-foreground">Cards Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{averageAccuracy}%</div>
                <p className="text-xs text-muted-foreground">Avg Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search flashcard decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Decks</TabsTrigger>
          <TabsTrigger value="studying">Studying</TabsTrigger>
          <TabsTrigger value="mastered">Mastered</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Flashcard Decks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => (
              <Card key={deck.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg leading-tight">{deck.name}</CardTitle>
                    <Badge className={`${getDifficultyColor(deck.difficulty)} text-white text-xs`}>
                      {deck.difficulty}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {deck.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Indicators */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Study Progress</span>
                        <span>{deck.studiedCards}/{deck.totalCards}</span>
                      </div>
                      <Progress value={getProgressPercentage(deck)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mastery</span>
                        <span>{deck.masteredCards}/{deck.totalCards}</span>
                      </div>
                      <Progress value={getMasteryPercentage(deck)} className="h-2 bg-green-100" />
                    </div>
                  </div>

                  {/* Deck Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Last: {formatDate(deck.lastStudied)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      <span>{deck.timesStudied} sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>{deck.rating} rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{deck.category}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {deck.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Study
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDecks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No flashcard decks found matching your criteria.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Study Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Study Sessions
          </CardTitle>
          <CardDescription>
            Track your recent study activity and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studySessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{session.deckName}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(session.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{session.cardsStudied}</p>
                    <p className="text-muted-foreground">Cards</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{session.accuracy}%</p>
                    <p className="text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{session.duration}m</p>
                    <p className="text-muted-foreground">Duration</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}