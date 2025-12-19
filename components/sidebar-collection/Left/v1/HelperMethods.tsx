import {
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Code,
  FileVideo,
  Music,
} from "lucide-react";
import { EnhancedTreeNode } from "./type";

// File type icon mapping
const getFileIcon = (
  fileType?: string,
  isFolder?: boolean,
  isOpen?: boolean
) => {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen className="h-4 w-4 text-blue-500" />
    ) : (
      <Folder className="h-4 w-4 text-blue-400" />
    );
  }

  switch (fileType) {
    case "text":
      return <FileText className="h-4 w-4 text-green-500" />;
    case "image":
      return <Image className="h-4 w-4 text-purple-500" />;
    case "code":
      return <Code className="h-4 w-4 text-orange-500" />;
    case "video":
      return <FileVideo className="h-4 w-4 text-red-500" />;
    case "audio":
      return <Music className="h-4 w-4 text-pink-500" />;
    default:
      return <File className="h-4 w-4 text-gray-400" />;
  }
};

// Generate different tree data based on active section
const generateTreeDataBySectionPage = (section: string): EnhancedTreeNode[] => {
  switch (section) {
    case "/blog":
      return [
        {
          title: "Published",
          key: "published",
          type: "folder",
          children: [
            {
              title: "Getting Started with React.md",
              key: "blog-1",
              type: "file",
              fileType: "text",
            },
            {
              title: "Advanced TypeScript Tips.md",
              key: "blog-2",
              type: "file",
              fileType: "text",
            },
            {
              title: "Building REST APIs.md",
              key: "blog-3",
              type: "file",
              fileType: "text",
            },
          ],
        },
        {
          title: "Drafts",
          key: "drafts",
          type: "folder",
          children: [
            {
              title: "Next.js 15 Features.md",
              key: "draft-1",
              type: "file",
              fileType: "text",
            },
            {
              title: "Database Design Patterns.md",
              key: "draft-2",
              type: "file",
              fileType: "text",
            },
          ],
        },
        {
          title: "Templates",
          key: "templates",
          type: "folder",
          children: [
            {
              title: "Blog Post Template.md",
              key: "template-1",
              type: "file",
              fileType: "text",
            },
            {
              title: "Tutorial Template.md",
              key: "template-2",
              type: "file",
              fileType: "text",
            },
          ],
        },
      ];

    case "/project":
      return [
        {
          title: "Web Development",
          key: "web-dev",
          type: "folder",
          children: [
            {
              title: "E-commerce Platform",
              key: "project-1",
              type: "file",
              fileType: "code",
            },
            {
              title: "Social Media Dashboard",
              key: "project-2",
              type: "file",
              fileType: "code",
            },
            {
              title: "Task Management App",
              key: "project-3",
              type: "file",
              fileType: "code",
            },
          ],
        },
        {
          title: "Mobile Apps",
          key: "mobile",
          type: "folder",
          children: [
            {
              title: "Fitness Tracker",
              key: "mobile-1",
              type: "file",
              fileType: "code",
            },
            {
              title: "Recipe Finder",
              key: "mobile-2",
              type: "file",
              fileType: "code",
            },
          ],
        },
        {
          title: "Open Source",
          key: "opensource",
          type: "folder",
          children: [
            {
              title: "UI Component Library",
              key: "os-1",
              type: "file",
              fileType: "code",
            },
            {
              title: "API Client Generator",
              key: "os-2",
              type: "file",
              fileType: "code",
            },
          ],
        },
      ];

    case "/flashcard":
      return [
        {
          title: "Programming",
          key: "programming",
          type: "folder",
          children: [
            {
              title: "JavaScript Fundamentals",
              key: "js-cards",
              type: "file",
              fileType: "text",
            },
            {
              title: "React Hooks",
              key: "react-cards",
              type: "file",
              fileType: "text",
            },
            {
              title: "TypeScript Basics",
              key: "ts-cards",
              type: "file",
              fileType: "text",
            },
          ],
        },
        {
          title: "Data Structures",
          key: "data-structures",
          type: "folder",
          children: [
            {
              title: "Arrays & Lists",
              key: "arrays-cards",
              type: "file",
              fileType: "text",
            },
            {
              title: "Trees & Graphs",
              key: "trees-cards",
              type: "file",
              fileType: "text",
            },
          ],
        },
        {
          title: "System Design",
          key: "system-design",
          type: "folder",
          children: [
            {
              title: "Scalability Patterns",
              key: "scale-cards",
              type: "file",
              fileType: "text",
            },
            {
              title: "Database Design",
              key: "db-cards",
              type: "file",
              fileType: "text",
            },
          ],
        },
      ];

    case "/competition":
      return [
        {
          title: "Coding Contests",
          key: "coding-contests",
          type: "folder",
          children: [
            {
              title: "LeetCode Weekly 380",
              key: "lc-380",
              type: "file",
              fileType: "code",
            },
            {
              title: "CodeForces Round 912",
              key: "cf-912",
              type: "file",
              fileType: "code",
            },
            {
              title: "AtCoder Beginner 332",
              key: "abc-332",
              type: "file",
              fileType: "code",
            },
          ],
        },
        {
          title: "Hackathons",
          key: "hackathons",
          type: "folder",
          children: [
            {
              title: "TechCrunch Disrupt 2024",
              key: "tc-2024",
              type: "file",
              fileType: "code",
            },
            {
              title: "Local Dev Meetup",
              key: "local-hack",
              type: "file",
              fileType: "code",
            },
          ],
        },
        {
          title: "Solutions Archive",
          key: "solutions",
          type: "folder",
          children: [
            {
              title: "Dynamic Programming",
              key: "dp-solutions",
              type: "file",
              fileType: "code",
            },
            {
              title: "Graph Algorithms",
              key: "graph-solutions",
              type: "file",
              fileType: "code",
            },
          ],
        },
      ];

    case "/showcase":
      return [
        {
          title: "Featured Work",
          key: "featured",
          type: "folder",
          children: [
            {
              title: "Portfolio Website",
              key: "portfolio",
              type: "file",
              fileType: "image",
            },
            {
              title: "Mobile Game UI",
              key: "game-ui",
              type: "file",
              fileType: "image",
            },
            {
              title: "Brand Identity Design",
              key: "brand",
              type: "file",
              fileType: "image",
            },
          ],
        },
        {
          title: "Client Projects",
          key: "client-work",
          type: "folder",
          children: [
            {
              title: "Restaurant Website",
              key: "restaurant",
              type: "file",
              fileType: "image",
            },
            {
              title: "Startup Landing Page",
              key: "startup",
              type: "file",
              fileType: "image",
            },
          ],
        },
        {
          title: "Experiments",
          key: "experiments",
          type: "folder",
          children: [
            {
              title: "3D Web Animation",
              key: "3d-anim",
              type: "file",
              fileType: "video",
            },
            {
              title: "Interactive Data Viz",
              key: "data-viz",
              type: "file",
              fileType: "image",
            },
          ],
        },
      ];

    case "/store":
      return [
        {
          title: "Digital Products",
          key: "digital",
          type: "folder",
          children: [
            {
              title: "UI Kit Bundle",
              key: "ui-kit",
              type: "file",
              fileType: "image",
            },
            {
              title: "Code Templates",
              key: "templates",
              type: "file",
              fileType: "code",
            },
            {
              title: "Icon Collection",
              key: "icons",
              type: "file",
              fileType: "image",
            },
          ],
        },
        {
          title: "Courses",
          key: "courses",
          type: "folder",
          children: [
            {
              title: "React Masterclass",
              key: "react-course",
              type: "file",
              fileType: "video",
            },
            {
              title: "Design System Guide",
              key: "design-course",
              type: "file",
              fileType: "text",
            },
          ],
        },
        {
          title: "Consulting",
          key: "consulting",
          type: "folder",
          children: [
            {
              title: "Code Review Service",
              key: "code-review",
              type: "file",
              fileType: "text",
            },
            {
              title: "1-on-1 Mentoring",
              key: "mentoring",
              type: "file",
              fileType: "text",
            },
          ],
        },
      ];

    default:
      return [
        {
          title: "Overview",
          key: "overview",
          type: "folder",
          children: [
            {
              title: "Dashboard.tsx",
              key: "dashboard",
              type: "file",
              fileType: "code",
            },
            {
              title: "Analytics.tsx",
              key: "analytics",
              type: "file",
              fileType: "code",
            },
          ],
        },
      ];
  }
};

// Custom tile renderer for tree nodes and its utility functions

export { getFileIcon, generateTreeDataBySectionPage };
