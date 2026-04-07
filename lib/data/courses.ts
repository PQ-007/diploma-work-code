export type Level = "beginner" | "intermediate" | "advanced";

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  completed?: boolean;
  preview?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  instructor: string;
  instructorAvatar: string;
  instructorBio: string;
  category: string;
  level: Level;
  duration: number;
  lessons: number;
  enrolled: number;
  rating: number;
  tags: string[];
  progress?: number;
  modules: Module[];
  requirements: string[];
  outcomes: string[];
  lastUpdated: string;
}

export const coursesMap: Record<string, Course> = {
  "complete-react-developer": {
    id: "1",
    slug: "complete-react-developer",
    title: "Complete React Developer Course",
    description:
      "Master React from basics to advanced concepts including hooks, context, and performance.",
    longDescription:
      "This comprehensive course takes you through the entire React ecosystem. You will start with the fundamentals — JSX, components, props, and state — then progress to hooks, context API, performance optimization, and testing. By the end, you will be able to build and deploy production-grade React applications with confidence.",
    thumbnail: "/images/courses/react-developer.png",
    instructor: "Sarah Johnson",
    instructorAvatar: "/images/avatars/sarah.png",
    instructorBio:
      "Senior Frontend Engineer at Meta. 10+ years of React experience and open-source contributor.",
    category: "Frontend",
    level: "intermediate",
    duration: 24,
    lessons: 156,
    enrolled: 12547,
    rating: 4.8,
    tags: ["React", "JavaScript", "Frontend"],
    progress: 65,
    lastUpdated: "2025-06-15",
    requirements: [
      "Basic JavaScript knowledge (variables, functions, arrays)",
      "Familiarity with HTML and CSS",
      "A code editor (VS Code recommended)",
      "Node.js 18+ installed on your machine",
    ],
    outcomes: [
      "Build complex React applications from scratch",
      "Master hooks, context, and state management patterns",
      "Optimize performance with memoization and code splitting",
      "Write unit and integration tests with React Testing Library",
      "Deploy production apps to Vercel and AWS",
    ],
    modules: [
      {
        id: "m1",
        title: "Getting Started with React",
        lessons: [
          {
            id: "l1",
            title: "Course Introduction",
            duration: 5,
            completed: true,
            preview: true,
          },
          {
            id: "l2",
            title: "Setting Up Your Environment",
            duration: 12,
            completed: true,
          },
          {
            id: "l3",
            title: "JSX Deep Dive",
            duration: 18,
            completed: true,
          },
          {
            id: "l4",
            title: "Your First Component",
            duration: 15,
            completed: true,
          },
        ],
      },
      {
        id: "m2",
        title: "Core Concepts",
        lessons: [
          {
            id: "l5",
            title: "Props and Data Flow",
            duration: 20,
            completed: true,
          },
          {
            id: "l6",
            title: "State and useState",
            duration: 22,
            completed: true,
          },
          { id: "l7", title: "Event Handling", duration: 14, completed: true },
          {
            id: "l8",
            title: "Conditional Rendering",
            duration: 16,
            completed: true,
          },
          { id: "l9", title: "Lists and Keys", duration: 18, completed: true },
        ],
      },
      {
        id: "m3",
        title: "Hooks in Depth",
        lessons: [
          {
            id: "l10",
            title: "useEffect and Side Effects",
            duration: 25,
            completed: true,
          },
          {
            id: "l11",
            title: "useRef and DOM Access",
            duration: 18,
            completed: true,
          },
          { id: "l12", title: "useContext for Global State", duration: 20 },
          { id: "l13", title: "useReducer for Complex State", duration: 22 },
          { id: "l14", title: "Custom Hooks", duration: 28 },
        ],
      },
      {
        id: "m4",
        title: "Performance & Patterns",
        lessons: [
          { id: "l15", title: "React.memo and useMemo", duration: 20 },
          {
            id: "l16",
            title: "useCallback and Avoiding Re-renders",
            duration: 18,
          },
          { id: "l17", title: "Code Splitting with Suspense", duration: 22 },
          { id: "l18", title: "Error Boundaries", duration: 15 },
        ],
      },
      {
        id: "m5",
        title: "Testing & Deployment",
        lessons: [
          { id: "l19", title: "Unit Testing with Vitest", duration: 25 },
          { id: "l20", title: "Integration Testing", duration: 20 },
          { id: "l21", title: "Deploying to Vercel", duration: 12 },
          { id: "l22", title: "Course Wrap-Up", duration: 8, preview: true },
        ],
      },
    ],
  },
  "advanced-javascript-concepts": {
    id: "2",
    slug: "advanced-javascript-concepts",
    title: "Advanced JavaScript Concepts",
    description:
      "Deep dive into closures, prototypes, async programming, and modern ES6+ features.",
    longDescription:
      "Go beyond the basics and truly understand how JavaScript works under the hood. This course covers execution context, the event loop, closures, prototypal inheritance, generators, proxies, and advanced async patterns. Perfect for developers who want to write cleaner, more efficient code.",
    thumbnail: "/images/courses/advanced-js.png",
    instructor: "Alex Rodriguez",
    instructorAvatar: "/images/avatars/alex.png",
    instructorBio:
      "JavaScript educator and author of 'JS Under the Hood'. Former engineer at Google.",
    category: "Frontend",
    level: "advanced",
    duration: 16,
    lessons: 89,
    enrolled: 6754,
    rating: 4.6,
    tags: ["JavaScript", "Frontend"],
    progress: 25,
    lastUpdated: "2025-05-10",
    requirements: [
      "Solid understanding of JavaScript fundamentals",
      "Experience building web applications",
      "Familiarity with ES6 syntax",
    ],
    outcomes: [
      "Understand execution context, scope chain, and closures deeply",
      "Master prototypal inheritance and the class syntax",
      "Handle complex async flows with generators and async iterators",
      "Use Proxy and Reflect for meta-programming",
    ],
    modules: [
      {
        id: "m1",
        title: "JavaScript Engine Internals",
        lessons: [
          {
            id: "l1",
            title: "How V8 Executes Your Code",
            duration: 20,
            completed: true,
            preview: true,
          },
          {
            id: "l2",
            title: "Execution Context & Call Stack",
            duration: 18,
            completed: true,
          },
          {
            id: "l3",
            title: "Scope Chain & Lexical Environment",
            duration: 22,
            completed: true,
          },
        ],
      },
      {
        id: "m2",
        title: "Closures & Prototypes",
        lessons: [
          {
            id: "l4",
            title: "Closures Explained",
            duration: 25,
            completed: true,
          },
          { id: "l5", title: "Practical Closure Patterns", duration: 20 },
          { id: "l6", title: "Prototypal Inheritance", duration: 22 },
          { id: "l7", title: "The Class Syntax", duration: 18 },
        ],
      },
      {
        id: "m3",
        title: "Advanced Async",
        lessons: [
          { id: "l8", title: "The Event Loop Deep Dive", duration: 28 },
          { id: "l9", title: "Generators & Iterators", duration: 24 },
          { id: "l10", title: "Async Generators", duration: 20 },
        ],
      },
    ],
  },
};

export function getDefaultCourse(slug: string): Course {
  return {
    id: "0",
    slug,
    title: slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: "Course details are loading...",
    longDescription:
      "Detailed information about this course will be available soon. Check back later for full curriculum details, instructor information, and learning outcomes.",
    thumbnail: "/images/courses/placeholder.svg",
    instructor: "FutureHub Team",
    instructorAvatar: "",
    instructorBio: "The FutureHub education team.",
    category: "General",
    level: "beginner",
    duration: 10,
    lessons: 40,
    enrolled: 1000,
    rating: 4.5,
    tags: [],
    lastUpdated: "2025-01-01",
    requirements: ["Basic programming knowledge"],
    outcomes: ["Gain practical skills in the topic"],
    modules: [
      {
        id: "m1",
        title: "Introduction",
        lessons: [
          { id: "l1", title: "Welcome", duration: 5, preview: true },
          { id: "l2", title: "Getting Started", duration: 10 },
          { id: "l3", title: "Core Concepts", duration: 15 },
        ],
      },
    ],
  };
}
