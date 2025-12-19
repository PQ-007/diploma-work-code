"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code2, 
  ExternalLink, 
  Github, 
  Globe, 
  Calendar,
  Users,
  Star,
  GitFork,
  Eye,
  Plus,
  Search,
  Folder,
  Clock,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  status: "planning" | "in-progress" | "completed" | "maintenance";
  visibility: "public" | "private";
  technologies: string[];
  startDate: string;
  lastUpdated: string;
  contributors: {
    name: string;
    avatar: string;
    role: string;
  }[];
  links: {
    github?: string;
    live?: string;
    demo?: string;
  };
  stats: {
    stars?: number;
    forks?: number;
    views?: number;
    commits?: number;
  };
  thumbnail?: string;
  featured: boolean;
  priority: "low" | "medium" | "high";
}

const projects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform",
    description: "A full-stack e-commerce solution with React, Node.js, and PostgreSQL",
    longDescription: "Modern e-commerce platform featuring user authentication, product catalog, shopping cart, payment integration, and admin dashboard. Built with scalability and performance in mind.",
    category: "Web Development",
    status: "in-progress",
    visibility: "public",
    technologies: ["React", "Node.js", "PostgreSQL", "Redux", "Stripe", "Docker"],
    startDate: "2024-10-01",
    lastUpdated: "2024-12-15",
    contributors: [
      { name: "You", avatar: "/api/placeholder/32/32", role: "Lead Developer" },
      { name: "Sarah Kim", avatar: "/api/placeholder/32/32", role: "UI/UX Designer" },
      { name: "Mike Chen", avatar: "/api/placeholder/32/32", role: "Backend Developer" }
    ],
    links: {
      github: "https://github.com/user/ecommerce-platform",
      demo: "https://ecommerce-demo.com"
    },
    stats: {
      stars: 124,
      forks: 23,
      commits: 487,
      views: 2341
    },
    thumbnail: "/api/placeholder/400/225",
    featured: true,
    priority: "high"
  },
  {
    id: "2",
    name: "Task Management App",
    description: "Collaborative task management tool with real-time updates",
    longDescription: "A comprehensive project management application featuring kanban boards, team collaboration, time tracking, and reporting capabilities.",
    category: "Web Development",
    status: "completed",
    visibility: "public",
    technologies: ["Vue.js", "Express", "MongoDB", "Socket.io", "Chart.js"],
    startDate: "2024-08-15",
    lastUpdated: "2024-11-30",
    contributors: [
      { name: "You", avatar: "/api/placeholder/32/32", role: "Full Stack Developer" }
    ],
    links: {
      github: "https://github.com/user/task-manager",
      live: "https://taskmanager-live.com"
    },
    stats: {
      stars: 89,
      forks: 15,
      commits: 234,
      views: 1567
    },
    thumbnail: "/api/placeholder/400/225",
    featured: false,
    priority: "medium"
  },
  {
    id: "3",
    name: "Weather Dashboard",
    description: "Real-time weather information with interactive maps and forecasts",
    category: "Web Development",
    status: "completed",
    visibility: "public",
    technologies: ["React", "TypeScript", "OpenWeather API", "Leaflet", "Tailwind"],
    startDate: "2024-09-01",
    lastUpdated: "2024-10-15",
    contributors: [
      { name: "You", avatar: "/api/placeholder/32/32", role: "Developer" }
    ],
    links: {
      github: "https://github.com/user/weather-dashboard",
      live: "https://weather-dashboard-demo.com"
    },
    stats: {
      stars: 45,
      forks: 8,
      commits: 156,
      views: 892
    },
    featured: false,
    priority: "low"
  },
  {
    id: "4",
    name: "AI Content Generator",
    description: "Machine learning powered content generation tool",
    category: "AI/ML",
    status: "planning",
    visibility: "private",
    technologies: ["Python", "OpenAI API", "FastAPI", "React", "PostgreSQL"],
    startDate: "2024-12-01",
    lastUpdated: "2024-12-10",
    contributors: [
      { name: "You", avatar: "/api/placeholder/32/32", role: "ML Engineer" },
      { name: "Alex Rodriguez", avatar: "/api/placeholder/32/32", role: "Data Scientist" }
    ],
    links: {},
    stats: {
      commits: 12,
      views: 0
    },
    featured: true,
    priority: "high"
  },
  {
    id: "5",
    name: "Mobile Fitness Tracker",
    description: "Cross-platform mobile app for fitness tracking and workout planning",
    category: "Mobile Development",
    status: "in-progress",
    visibility: "private",
    technologies: ["React Native", "Firebase", "Redux", "Expo", "Chart.js"],
    startDate: "2024-11-01",
    lastUpdated: "2024-12-14",
    contributors: [
      { name: "You", avatar: "/api/placeholder/32/32", role: "Mobile Developer" }
    ],
    links: {
      github: "https://github.com/user/fitness-tracker"
    },
    stats: {
      commits: 89,
      views: 234
    },
    featured: false,
    priority: "medium"
  }
];

export default function ProjectPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const categories = Array.from(new Set(projects.map(project => project.category)));
  const statuses = ["planning", "in-progress", "completed", "maintenance"];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "" || project.category === selectedCategory;
    const matchesStatus = selectedStatus === "" || project.status === selectedStatus;
    
    if (activeTab === "all") return matchesSearch && matchesCategory && matchesStatus;
    if (activeTab === "featured") return matchesSearch && matchesCategory && matchesStatus && project.featured;
    if (activeTab === "public") return matchesSearch && matchesCategory && matchesStatus && project.visibility === "public";
    if (activeTab === "private") return matchesSearch && matchesCategory && matchesStatus && project.visibility === "private";
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "planning": return "bg-blue-500";
      case "in-progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      case "maintenance": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "low": return "bg-gray-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const inProgressProjects = projects.filter(p => p.status === "in-progress").length;
  const totalStars = projects.reduce((acc, project) => acc + (project.stats.stars || 0), 0);

  return (
    <div className="space-y-6">
      
     
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
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
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="private">Private</TabsTrigger>
        </TabsList>

        {/* All Projects Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {project.status}
                          </Badge>
                          <Badge variant={project.visibility === "public" ? "default" : "secondary"}>
                            {project.visibility}
                          </Badge>
                          {project.featured && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {project.longDescription || project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Started {formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated {formatDate(project.lastUpdated)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{project.contributors.length} contributor{project.contributors.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                        {project.priority} priority
                      </Badge>
                    </div>
                  </div>

                  {/* Contributors */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Contributors:</span>
                    <div className="flex -space-x-2">
                      {project.contributors.slice(0, 3).map((contributor, index) => (
                        <Avatar key={index} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={contributor.avatar} alt={contributor.name} />
                          <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.contributors.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{project.contributors.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Stats */}
                  {(project.stats.stars || project.stats.forks || project.stats.views || project.stats.commits) && (
                    <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {project.stats.stars && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{project.stats.stars} stars</span>
                        </div>
                      )}
                      {project.stats.forks && (
                        <div className="flex items-center gap-1">
                          <GitFork className="h-4 w-4" />
                          <span>{project.stats.forks} forks</span>
                        </div>
                      )}
                      {project.stats.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{project.stats.views} views</span>
                        </div>
                      )}
                      {project.stats.commits && (
                        <div className="flex items-center gap-1">
                          <Code2 className="h-4 w-4" />
                          <span>{project.stats.commits} commits</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {project.links.github && (
                        <Button variant="outline" size="sm">
                          <Github className="h-4 w-4 mr-1" />
                          Code
                        </Button>
                      )}
                      {project.links.live && (
                        <Button variant="outline" size="sm">
                          <Globe className="h-4 w-4 mr-1" />
                          Live
                        </Button>
                      )}
                      {project.links.demo && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Demo
                        </Button>
                      )}
                    </div>
                    <Button size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No projects found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Featured Projects Tab */}
        <TabsContent value="featured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Featured Projects
              </CardTitle>
              <CardDescription>Highlighted projects you're most proud of</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProjects.filter(p => p.featured).map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{project.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(project.status)} text-white`}>
                                {project.status}
                              </Badge>
                              <Badge variant={project.visibility === "public" ? "default" : "secondary"}>
                                {project.visibility}
                              </Badge>
                            </div>
                          </div>
                          <CardDescription className="text-base mb-3">
                            {project.longDescription || project.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Technologies */}
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>

                      {/* Project Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Started {formatDate(project.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Updated {formatDate(project.lastUpdated)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.contributors.length} contributor{project.contributors.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                            {project.priority} priority
                          </Badge>
                        </div>
                      </div>

                      {/* Contributors */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">Contributors:</span>
                        <div className="flex -space-x-2">
                          {project.contributors.slice(0, 3).map((contributor, index) => (
                            <Avatar key={index} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={contributor.avatar} alt={contributor.name} />
                              <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.contributors.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                              +{project.contributors.length - 3}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Project Stats */}
                      {(project.stats.stars || project.stats.forks || project.stats.views || project.stats.commits) && (
                        <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          {project.stats.stars && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              <span>{project.stats.stars} stars</span>
                            </div>
                          )}
                          {project.stats.forks && (
                            <div className="flex items-center gap-1">
                              <GitFork className="h-4 w-4" />
                              <span>{project.stats.forks} forks</span>
                            </div>
                          )}
                          {project.stats.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{project.stats.views} views</span>
                            </div>
                          )}
                          {project.stats.commits && (
                            <div className="flex items-center gap-1">
                              <Code2 className="h-4 w-4" />
                              <span>{project.stats.commits} commits</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {project.links.github && (
                            <Button variant="outline" size="sm">
                              <Github className="h-4 w-4 mr-1" />
                              Code
                            </Button>
                          )}
                          {project.links.live && (
                            <Button variant="outline" size="sm">
                              <Globe className="h-4 w-4 mr-1" />
                              Live
                            </Button>
                          )}
                          {project.links.demo && (
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Demo
                            </Button>
                          )}
                        </div>
                        <Button size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredProjects.filter(p => p.featured).length === 0 && (
                  <div className="text-center py-12">
                    <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No featured projects found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Projects Tab */}
        <TabsContent value="public" className="space-y-4">
          <div className="grid gap-6">
            {filteredProjects.filter(p => p.visibility === "public").map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {project.status}
                          </Badge>
                          {project.featured && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {project.longDescription || project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Started {formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated {formatDate(project.lastUpdated)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{project.contributors.length} contributor{project.contributors.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                        {project.priority} priority
                      </Badge>
                    </div>
                  </div>

                  {/* Contributors */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Contributors:</span>
                    <div className="flex -space-x-2">
                      {project.contributors.slice(0, 3).map((contributor, index) => (
                        <Avatar key={index} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={contributor.avatar} alt={contributor.name} />
                          <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.contributors.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{project.contributors.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Stats */}
                  {(project.stats.stars || project.stats.forks || project.stats.views || project.stats.commits) && (
                    <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {project.stats.stars && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{project.stats.stars} stars</span>
                        </div>
                      )}
                      {project.stats.forks && (
                        <div className="flex items-center gap-1">
                          <GitFork className="h-4 w-4" />
                          <span>{project.stats.forks} forks</span>
                        </div>
                      )}
                      {project.stats.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{project.stats.views} views</span>
                        </div>
                      )}
                      {project.stats.commits && (
                        <div className="flex items-center gap-1">
                          <Code2 className="h-4 w-4" />
                          <span>{project.stats.commits} commits</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {project.links.github && (
                        <Button variant="outline" size="sm">
                          <Github className="h-4 w-4 mr-1" />
                          Code
                        </Button>
                      )}
                      {project.links.live && (
                        <Button variant="outline" size="sm">
                          <Globe className="h-4 w-4 mr-1" />
                          Live
                        </Button>
                      )}
                      {project.links.demo && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Demo
                        </Button>
                      )}
                    </div>
                    <Button size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProjects.filter(p => p.visibility === "public").length === 0 && (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No public projects found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Private Projects Tab */}
        <TabsContent value="private" className="space-y-4">
          <div className="grid gap-6">
            {filteredProjects.filter(p => p.visibility === "private").map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(project.status)} text-white`}>
                            {project.status}
                          </Badge>
                          {project.featured && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {project.longDescription || project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Started {formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Updated {formatDate(project.lastUpdated)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{project.contributors.length} contributor{project.contributors.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(project.priority)} text-white text-xs`}>
                        {project.priority} priority
                      </Badge>
                    </div>
                  </div>

                  {/* Contributors */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Contributors:</span>
                    <div className="flex -space-x-2">
                      {project.contributors.slice(0, 3).map((contributor, index) => (
                        <Avatar key={index} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={contributor.avatar} alt={contributor.name} />
                          <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.contributors.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{project.contributors.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Stats */}
                  {(project.stats.stars || project.stats.forks || project.stats.views || project.stats.commits) && (
                    <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {project.stats.stars && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          <span>{project.stats.stars} stars</span>
                        </div>
                      )}
                      {project.stats.forks && (
                        <div className="flex items-center gap-1">
                          <GitFork className="h-4 w-4" />
                          <span>{project.stats.forks} forks</span>
                        </div>
                      )}
                      {project.stats.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{project.stats.views} views</span>
                        </div>
                      )}
                      {project.stats.commits && (
                        <div className="flex items-center gap-1">
                          <Code2 className="h-4 w-4" />
                          <span>{project.stats.commits} commits</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {project.links.github && (
                        <Button variant="outline" size="sm">
                          <Github className="h-4 w-4 mr-1" />
                          Code
                        </Button>
                      )}
                      {project.links.live && (
                        <Button variant="outline" size="sm">
                          <Globe className="h-4 w-4 mr-1" />
                          Live
                        </Button>
                      )}
                      {project.links.demo && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Demo
                        </Button>
                      )}
                    </div>
                    <Button size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProjects.filter(p => p.visibility === "private").length === 0 && (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No private projects found matching your criteria.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Project Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Project Insights
          </CardTitle>
          <CardDescription>Overview of your project activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {categories.length}
              </div>
              <p className="text-sm text-muted-foreground">Technology Areas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {projects.reduce((acc, project) => acc + (project.stats.commits || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Commits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}