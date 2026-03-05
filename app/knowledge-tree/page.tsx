"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/* ══════════════════════════════════════════════════════════════════
   CS Knowledge Graph — Obsidian-style force-directed graph
   ══════════════════════════════════════════════════════════════════ */

// ─── Category colours ────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  core: "#22c55e",
  ai: "#f97316",
  systems: "#3b82f6",
  data: "#a855f7",
  security: "#ef4444",
  web: "#06b6d4",
  math: "#eab308",
  software: "#ec4899",
  hardware: "#64748b",
};

// Color helper: parse hex to [r,g,b]
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ─── Node / Edge types ───────────────────────────────────────────
interface GraphNode {
  id: string;
  label: string;
  category: string;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

// ─── Build CS knowledge graph data ───────────────────────────────
function buildGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const raw: { id: string; label: string; cat: string; size: number }[] = [
    // Core CS
    { id: "cs", label: "Computer Science", cat: "core", size: 3 },
    { id: "algo", label: "Algorithms", cat: "core", size: 2.4 },
    { id: "ds", label: "Data Structures", cat: "core", size: 2.4 },
    { id: "oop", label: "OOP", cat: "core", size: 1.6 },
    { id: "fp", label: "Functional Programming", cat: "core", size: 1.2 },
    { id: "recursion", label: "Recursion", cat: "core", size: 1 },
    { id: "sorting", label: "Sorting", cat: "core", size: 1.2 },
    { id: "searching", label: "Searching", cat: "core", size: 1.2 },
    { id: "graphs", label: "Graph Theory", cat: "core", size: 1.4 },
    { id: "trees", label: "Trees", cat: "data", size: 1.4 },
    { id: "hash", label: "Hash Tables", cat: "data", size: 1.2 },
    { id: "stack", label: "Stacks & Queues", cat: "data", size: 1 },
    { id: "linkedlist", label: "Linked Lists", cat: "data", size: 1 },
    { id: "heap", label: "Heaps", cat: "data", size: 1 },
    { id: "dp", label: "Dynamic Programming", cat: "core", size: 1.6 },
    { id: "greedy", label: "Greedy Algorithms", cat: "core", size: 1 },
    { id: "divconq", label: "Divide & Conquer", cat: "core", size: 1 },
    { id: "complexity", label: "Complexity Theory", cat: "core", size: 1.4 },
    { id: "bigO", label: "Big-O Notation", cat: "core", size: 1 },

    // AI / ML
    { id: "ai", label: "Artificial Intelligence", cat: "ai", size: 2.4 },
    { id: "ml", label: "Machine Learning", cat: "ai", size: 2 },
    { id: "dl", label: "Deep Learning", cat: "ai", size: 1.8 },
    { id: "nn", label: "Neural Networks", cat: "ai", size: 1.4 },
    { id: "cnn", label: "CNN", cat: "ai", size: 1 },
    { id: "rnn", label: "RNN / LSTM", cat: "ai", size: 1 },
    { id: "transformer", label: "Transformers", cat: "ai", size: 1.4 },
    { id: "nlp", label: "NLP", cat: "ai", size: 1.4 },
    { id: "cv", label: "Computer Vision", cat: "ai", size: 1.2 },
    { id: "rl", label: "Reinforcement Learning", cat: "ai", size: 1 },
    { id: "llm", label: "Large Language Models", cat: "ai", size: 1.6 },

    // Systems
    { id: "os", label: "Operating Systems", cat: "systems", size: 2 },
    { id: "networking", label: "Networking", cat: "systems", size: 2 },
    { id: "db", label: "Databases", cat: "systems", size: 2 },
    { id: "sql", label: "SQL", cat: "data", size: 1.2 },
    { id: "nosql", label: "NoSQL", cat: "data", size: 1 },
    {
      id: "distributed",
      label: "Distributed Systems",
      cat: "systems",
      size: 1.6,
    },
    { id: "cloud", label: "Cloud Computing", cat: "systems", size: 1.4 },
    {
      id: "containers",
      label: "Containers & Docker",
      cat: "systems",
      size: 1.2,
    },
    { id: "linux", label: "Linux", cat: "systems", size: 1.4 },
    { id: "process", label: "Processes & Threads", cat: "systems", size: 1 },
    { id: "memory", label: "Memory Management", cat: "systems", size: 1 },
    { id: "filesystem", label: "File Systems", cat: "systems", size: 1 },
    { id: "tcp", label: "TCP/IP", cat: "systems", size: 1 },
    { id: "http", label: "HTTP/HTTPS", cat: "systems", size: 1 },
    { id: "dns", label: "DNS", cat: "systems", size: 0.8 },
    { id: "compiler", label: "Compilers", cat: "systems", size: 1.4 },
    { id: "interpreter", label: "Interpreters", cat: "systems", size: 1 },

    // Web & Software engineering
    { id: "web", label: "Web Development", cat: "web", size: 2 },
    { id: "frontend", label: "Frontend", cat: "web", size: 1.6 },
    { id: "backend", label: "Backend", cat: "web", size: 1.6 },
    { id: "api", label: "REST & APIs", cat: "web", size: 1.2 },
    { id: "graphql", label: "GraphQL", cat: "web", size: 1 },
    { id: "react", label: "React", cat: "web", size: 1.4 },
    { id: "nextjs", label: "Next.js", cat: "web", size: 1.2 },
    { id: "nodejs", label: "Node.js", cat: "web", size: 1.2 },
    { id: "html", label: "HTML / CSS", cat: "web", size: 1 },
    { id: "js", label: "JavaScript", cat: "web", size: 1.6 },
    { id: "ts", label: "TypeScript", cat: "web", size: 1.4 },

    // Languages
    { id: "python", label: "Python", cat: "software", size: 1.6 },
    { id: "java", label: "Java", cat: "software", size: 1.4 },
    { id: "cpp", label: "C / C++", cat: "software", size: 1.4 },
    { id: "rust", label: "Rust", cat: "software", size: 1.2 },
    { id: "go", label: "Go", cat: "software", size: 1 },

    // Software engineering
    { id: "swe", label: "Software Engineering", cat: "software", size: 2 },
    { id: "git", label: "Git & Version Control", cat: "software", size: 1.4 },
    { id: "testing", label: "Testing", cat: "software", size: 1.2 },
    { id: "cicd", label: "CI / CD", cat: "software", size: 1 },
    { id: "designpat", label: "Design Patterns", cat: "software", size: 1.4 },
    { id: "agile", label: "Agile / Scrum", cat: "software", size: 1 },
    { id: "devops", label: "DevOps", cat: "software", size: 1.2 },

    // Math foundations
    { id: "math", label: "Mathematics", cat: "math", size: 2 },
    { id: "discrete", label: "Discrete Math", cat: "math", size: 1.6 },
    { id: "linalg", label: "Linear Algebra", cat: "math", size: 1.4 },
    { id: "probability", label: "Probability & Stats", cat: "math", size: 1.4 },
    { id: "calculus", label: "Calculus", cat: "math", size: 1.2 },
    { id: "logic", label: "Logic", cat: "math", size: 1.2 },
    { id: "combinatorics", label: "Combinatorics", cat: "math", size: 1 },
    { id: "numtheory", label: "Number Theory", cat: "math", size: 1 },

    // Security
    { id: "security", label: "Cybersecurity", cat: "security", size: 2 },
    { id: "crypto", label: "Cryptography", cat: "security", size: 1.6 },
    { id: "web_sec", label: "Web Security", cat: "security", size: 1.2 },
    { id: "auth", label: "Authentication", cat: "security", size: 1 },
    { id: "encryption", label: "Encryption", cat: "security", size: 1 },
    { id: "pentest", label: "Penetration Testing", cat: "security", size: 1 },

    // Hardware
    {
      id: "hardware",
      label: "Computer Architecture",
      cat: "hardware",
      size: 1.8,
    },
    { id: "cpu", label: "CPU & Processors", cat: "hardware", size: 1.2 },
    { id: "gpu", label: "GPU Computing", cat: "hardware", size: 1 },
    { id: "embedded", label: "Embedded Systems", cat: "hardware", size: 1 },
    { id: "iot", label: "IoT", cat: "hardware", size: 1 },
  ];

  const edges: GraphEdge[] = [
    { source: "cs", target: "algo" },
    { source: "cs", target: "ds" },
    { source: "cs", target: "oop" },
    { source: "cs", target: "fp" },
    { source: "cs", target: "ai" },
    { source: "cs", target: "os" },
    { source: "cs", target: "web" },
    { source: "cs", target: "swe" },
    { source: "cs", target: "math" },
    { source: "cs", target: "security" },
    { source: "cs", target: "hardware" },
    { source: "cs", target: "db" },
    { source: "cs", target: "networking" },
    { source: "cs", target: "compiler" },
    { source: "algo", target: "sorting" },
    { source: "algo", target: "searching" },
    { source: "algo", target: "dp" },
    { source: "algo", target: "greedy" },
    { source: "algo", target: "divconq" },
    { source: "algo", target: "graphs" },
    { source: "algo", target: "recursion" },
    { source: "algo", target: "complexity" },
    { source: "complexity", target: "bigO" },
    { source: "ds", target: "trees" },
    { source: "ds", target: "hash" },
    { source: "ds", target: "stack" },
    { source: "ds", target: "linkedlist" },
    { source: "ds", target: "heap" },
    { source: "ds", target: "graphs" },
    { source: "ai", target: "ml" },
    { source: "ai", target: "nlp" },
    { source: "ai", target: "cv" },
    { source: "ai", target: "rl" },
    { source: "ml", target: "dl" },
    { source: "dl", target: "nn" },
    { source: "nn", target: "cnn" },
    { source: "nn", target: "rnn" },
    { source: "nn", target: "transformer" },
    { source: "transformer", target: "llm" },
    { source: "nlp", target: "llm" },
    { source: "nlp", target: "transformer" },
    { source: "cv", target: "cnn" },
    { source: "ml", target: "probability" },
    { source: "ml", target: "linalg" },
    { source: "dl", target: "gpu" },
    { source: "os", target: "process" },
    { source: "os", target: "memory" },
    { source: "os", target: "filesystem" },
    { source: "os", target: "linux" },
    { source: "networking", target: "tcp" },
    { source: "networking", target: "http" },
    { source: "networking", target: "dns" },
    { source: "db", target: "sql" },
    { source: "db", target: "nosql" },
    { source: "distributed", target: "cloud" },
    { source: "distributed", target: "db" },
    { source: "cloud", target: "containers" },
    { source: "containers", target: "devops" },
    { source: "compiler", target: "interpreter" },
    { source: "web", target: "frontend" },
    { source: "web", target: "backend" },
    { source: "web", target: "api" },
    { source: "frontend", target: "react" },
    { source: "frontend", target: "html" },
    { source: "frontend", target: "js" },
    { source: "react", target: "nextjs" },
    { source: "react", target: "ts" },
    { source: "backend", target: "nodejs" },
    { source: "backend", target: "api" },
    { source: "api", target: "graphql" },
    { source: "api", target: "http" },
    { source: "js", target: "ts" },
    { source: "js", target: "nodejs" },
    { source: "python", target: "ml" },
    { source: "python", target: "backend" },
    { source: "java", target: "oop" },
    { source: "java", target: "backend" },
    { source: "cpp", target: "os" },
    { source: "cpp", target: "hardware" },
    { source: "rust", target: "os" },
    { source: "go", target: "backend" },
    { source: "go", target: "distributed" },
    { source: "swe", target: "git" },
    { source: "swe", target: "testing" },
    { source: "swe", target: "cicd" },
    { source: "swe", target: "designpat" },
    { source: "swe", target: "agile" },
    { source: "swe", target: "devops" },
    { source: "designpat", target: "oop" },
    { source: "devops", target: "cicd" },
    { source: "math", target: "discrete" },
    { source: "math", target: "linalg" },
    { source: "math", target: "probability" },
    { source: "math", target: "calculus" },
    { source: "math", target: "logic" },
    { source: "discrete", target: "combinatorics" },
    { source: "discrete", target: "graphs" },
    { source: "discrete", target: "numtheory" },
    { source: "discrete", target: "logic" },
    { source: "logic", target: "complexity" },
    { source: "security", target: "crypto" },
    { source: "security", target: "web_sec" },
    { source: "security", target: "auth" },
    { source: "security", target: "pentest" },
    { source: "crypto", target: "encryption" },
    { source: "crypto", target: "numtheory" },
    { source: "web_sec", target: "http" },
    { source: "web_sec", target: "auth" },
    { source: "hardware", target: "cpu" },
    { source: "hardware", target: "gpu" },
    { source: "hardware", target: "embedded" },
    { source: "embedded", target: "iot" },
    { source: "hardware", target: "memory" },
  ];

  // Scatter initial positions in a circle
  const nodes: GraphNode[] = raw.map((r, i) => {
    const angle = (i / raw.length) * Math.PI * 2;
    const radius = 200 + Math.random() * 300;
    return {
      id: r.id,
      label: r.label,
      category: r.cat,
      size: r.size,
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
      y: Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
    };
  });

  return { nodes, edges };
}

// ─── Force simulation ────────────────────────────────────────────
function simulate(
  nodes: GraphNode[],
  edges: GraphEdge[],
  draggedNodeId?: string | null,
  alpha: number = 1,
) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const dt = 1;
  const REPULSION = 8000 * alpha;
  const EDGE_STRENGTH = 0.004 * alpha;
  const EDGE_LENGTH = 120;
  const DAMPING = 0.88;
  const CENTER_GRAVITY = 0.0008 * alpha;
  const DRAG_PULL_STRENGTH = 0.06;

  // Repulsion (every pair)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx * dt;
      a.vy += fy * dt;
      b.vx -= fx * dt;
      b.vy -= fy * dt;
    }
  }

  // Edge attraction (spring)
  for (const e of edges) {
    const a = nodeMap.get(e.source);
    const b = nodeMap.get(e.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const displacement = dist - EDGE_LENGTH;
    const fx = (dx / dist) * displacement * EDGE_STRENGTH;
    const fy = (dy / dist) * displacement * EDGE_STRENGTH;
    a.vx += fx * dt;
    a.vy += fy * dt;
    b.vx -= fx * dt;
    b.vy -= fy * dt;
  }

  // Drag influence: dragged node pulls neighbors
  if (draggedNodeId) {
    const dragged = nodeMap.get(draggedNodeId);
    if (dragged) {
      for (const e of edges) {
        let neighbor: GraphNode | undefined;
        if (e.source === draggedNodeId) neighbor = nodeMap.get(e.target);
        else if (e.target === draggedNodeId) neighbor = nodeMap.get(e.source);
        if (!neighbor) continue;
        const dx = dragged.x - neighbor.x;
        const dy = dragged.y - neighbor.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pull = Math.max(0, dist - EDGE_LENGTH * 0.8) * DRAG_PULL_STRENGTH;
        neighbor.vx += (dx / dist) * pull;
        neighbor.vy += (dy / dist) * pull;
      }
    }
  }

  // Center gravity
  for (const n of nodes) {
    n.vx -= n.x * CENTER_GRAVITY;
    n.vy -= n.y * CENTER_GRAVITY;
  }

  // Apply velocity (pin dragged node)
  for (const n of nodes) {
    if (n.id === draggedNodeId) {
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx *= DAMPING;
    n.vy *= DAMPING;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
  }
}

// ─── Background particles ────────────────────────────────────────
function generateParticles(count: number) {
  const particles: { x: number; y: number; r: number; a: number }[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      r: 0.3 + Math.random() * 0.8,
      a: 0.08 + Math.random() * 0.2,
    });
  }
  return particles;
}

// ─── Page component ──────────────────────────────────────────────
export default function KnowledgeTreePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef(buildGraphData());
  const particlesRef = useRef(generateParticles(200));
  const { t } = useLanguage();

  // Camera / interaction state
  const camera = useRef({ x: 0, y: 0, zoom: 0.6 });
  const drag = useRef<{
    active: boolean;
    nodeId: string | null;
    lastX: number;
    lastY: number;
    startX: number;
    startY: number;
  }>({
    active: false,
    nodeId: null,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
  });

  // Animated hover alpha per node (smooth transitions)
  const hoverAlpha = useRef<Map<string, number>>(new Map());
  const hoveredNode = useRef<string | null>(null);
  const selectedNodeRef = useRef<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Physics alpha — starts high, decays, bumps on interaction
  const physicsAlpha = useRef(1);

  // Pre-built adjacency for quick neighbor lookup
  const adjacency = useRef<Map<string, Set<string>>>(new Map());

  // Build adjacency once
  useEffect(() => {
    const adj = new Map<string, Set<string>>();
    for (const n of graphRef.current.nodes) adj.set(n.id, new Set());
    for (const e of graphRef.current.edges) {
      adj.get(e.source)?.add(e.target);
      adj.get(e.target)?.add(e.source);
    }
    adjacency.current = adj;
  }, []);

  // ── Screen ↔ World conversion ────
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const c = camera.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { wx: 0, wy: 0 };
    const cx = sx - rect.left - rect.width / 2;
    const cy = sy - rect.top - rect.height / 2;
    return {
      wx: cx / c.zoom + c.x,
      wy: cy / c.zoom + c.y,
    };
  }, []);

  const findNode = useCallback(
    (sx: number, sy: number) => {
      const { wx, wy } = screenToWorld(sx, sy);
      const z = camera.current.zoom;
      const nodes = graphRef.current.nodes;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const r = (3 + n.size * 3.5) / z + 6;
        const dx = n.x - wx;
        const dy = n.y - wy;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    },
    [screenToWorld],
  );

  // ── Render loop ────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf: number;
    const BG_COLOR = "#181a1f";

    // RGB cache per category
    const rgbCache = new Map<string, { r: number; g: number; b: number }>();
    for (const [cat, hex] of Object.entries(CATEGORY_COLORS)) {
      const [r, g, b] = hexToRgb(hex);
      rgbCache.set(cat, { r, g, b });
    }

    function render() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      const cssW = W / dpr;
      const cssH = H / dpr;
      const cam = camera.current;

      // ── Physics ──
      const isDragging = drag.current.active && drag.current.nodeId;
      if (isDragging) {
        physicsAlpha.current = Math.min(1, physicsAlpha.current + 0.05);
      } else {
        physicsAlpha.current = Math.max(0.002, physicsAlpha.current * 0.998);
      }

      // Tiny jitter to keep graph alive (Obsidian feel)
      if (physicsAlpha.current < 0.01) {
        for (const n of graphRef.current.nodes) {
          n.vx += (Math.random() - 0.5) * 0.015;
          n.vy += (Math.random() - 0.5) * 0.015;
        }
      }

      simulate(
        graphRef.current.nodes,
        graphRef.current.edges,
        drag.current.nodeId,
        Math.max(physicsAlpha.current, isDragging ? 1 : 0.01),
      );

      // ── Smooth hover transitions ──
      const hId = hoveredNode.current;
      const sId = selectedNodeRef.current;
      const activeId = hId || sId;
      const neighborSet = new Set<string>();
      if (activeId) {
        neighborSet.add(activeId);
        const adj = adjacency.current.get(activeId);
        if (adj) for (const id of adj) neighborSet.add(id);
      }

      for (const n of graphRef.current.nodes) {
        const current = hoverAlpha.current.get(n.id) ?? 1;
        let target = 1;
        if (activeId) {
          target = neighborSet.has(n.id) ? 1 : 0.07;
        }
        const next = current + (target - current) * 0.1;
        hoverAlpha.current.set(n.id, next);
      }

      // ── Draw ──
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(cssW / 2, cssH / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // Background particles
      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r / cam.zoom, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a * 0.4})`;
        ctx.fill();
      }

      const nodeMap = new Map(graphRef.current.nodes.map((n) => [n.id, n]));

      // ─ Edges ─
      for (const e of graphRef.current.edges) {
        const a = nodeMap.get(e.source);
        const b = nodeMap.get(e.target);
        if (!a || !b) continue;

        const alphaA = hoverAlpha.current.get(a.id) ?? 1;
        const alphaB = hoverAlpha.current.get(b.id) ?? 1;
        const edgeAlpha = Math.min(alphaA, alphaB);

        const isHighlighted =
          activeId && neighborSet.has(e.source) && neighborSet.has(e.target);

        let lineAlpha: number;
        let lineWidth: number;

        if (isHighlighted) {
          lineAlpha = 0.55;
          lineWidth = 1.5 / cam.zoom;
        } else if (activeId) {
          lineAlpha = edgeAlpha * 0.06;
          lineWidth = 0.5 / cam.zoom;
        } else {
          lineAlpha = 0.12;
          lineWidth = 0.6 / cam.zoom;
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      // ─ Nodes ─
      for (const n of graphRef.current.nodes) {
        const r = 3 + n.size * 3.5;
        const rgb = rgbCache.get(n.category) || { r: 107, g: 114, b: 128 };
        const alpha = hoverAlpha.current.get(n.id) ?? 1;
        const isHovered = hId === n.id;
        const isSelected = sId === n.id;

        // ── Outer glow (bloom) ──
        if (alpha > 0.25) {
          const glowR = r + 12 + (isHovered ? 10 : 0) + (isSelected ? 6 : 0);
          const grad = ctx.createRadialGradient(
            n.x,
            n.y,
            r * 0.3,
            n.x,
            n.y,
            glowR,
          );
          const glowAlpha =
            alpha * (isHovered ? 0.35 : isSelected ? 0.25 : 0.1);
          grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${glowAlpha})`);
          grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // ── Node circle ──
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
        ctx.fill();

        // ── Selection ring ──
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,0.8)`;
          ctx.lineWidth = 1.5 / cam.zoom;
          ctx.stroke();
        }

        // ── Hover ring ──
        if (isHovered && !isSelected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,0.45)`;
          ctx.lineWidth = 1 / cam.zoom;
          ctx.stroke();
        }

        // ── Labels ──
        // Obsidian style: show based on zoom + importance + hover
        const zoomThreshold = n.size >= 2.4 ? 0.2 : n.size >= 1.6 ? 0.35 : 0.55;
        const showLabel =
          cam.zoom >= zoomThreshold ||
          isHovered ||
          isSelected ||
          (activeId && neighborSet.has(n.id));

        if (showLabel && alpha > 0.08) {
          const fontSize = Math.max(9, 10 + (n.size - 1) * 1.5);
          ctx.font = `${isHovered || isSelected ? "600 " : "400 "}${fontSize}px Inter, system-ui, sans-serif`;

          // Text shadow
          ctx.fillStyle = `rgba(0,0,0,${alpha * 0.7})`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(n.label, n.x + 0.5, n.y + r + 5.5);

          // Label
          ctx.fillStyle = `rgba(255,255,255,${alpha * (isHovered ? 1 : 0.82)})`;
          ctx.fillText(n.label, n.x, n.y + r + 5);
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(render);
    }

    // Resize handler
    function resize() {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx!.scale(dpr, dpr);
    }

    resize();
    raf = requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Mouse events ──────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onMouseDown(e: MouseEvent) {
      const node = findNode(e.clientX, e.clientY);
      drag.current = {
        active: true,
        nodeId: node?.id ?? null,
        lastX: e.clientX,
        lastY: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
      };
      physicsAlpha.current = Math.min(1, physicsAlpha.current + 0.3);
    }

    function onMouseMove(e: MouseEvent) {
      const node = findNode(e.clientX, e.clientY);
      hoveredNode.current = node?.id ?? null;
      if (canvas)
        canvas.style.cursor = drag.current.active
          ? drag.current.nodeId
            ? "grabbing"
            : "grabbing"
          : node
            ? "grab"
            : "default";

      if (!drag.current.active) return;

      const dx = e.clientX - drag.current.lastX;
      const dy = e.clientY - drag.current.lastY;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;

      if (drag.current.nodeId) {
        const n = graphRef.current.nodes.find(
          (n) => n.id === drag.current.nodeId,
        );
        if (n) {
          n.x += dx / camera.current.zoom;
          n.y += dy / camera.current.zoom;
          n.vx = 0;
          n.vy = 0;
        }
      } else {
        camera.current.x -= dx / camera.current.zoom;
        camera.current.y -= dy / camera.current.zoom;
      }
    }

    function onMouseUp(e: MouseEvent) {
      if (drag.current.active && drag.current.nodeId) {
        const dx = Math.abs(e.clientX - drag.current.startX);
        const dy = Math.abs(e.clientY - drag.current.startY);
        if (dx < 4 && dy < 4) {
          const node = graphRef.current.nodes.find(
            (n) => n.id === drag.current.nodeId,
          );
          if (node) {
            const isDeselect = selectedNodeRef.current === node.id;
            selectedNodeRef.current = isDeselect ? null : node.id;
            setSelectedNode(isDeselect ? null : node);
          }
        }
      } else if (drag.current.active && !drag.current.nodeId) {
        const dx = Math.abs(e.clientX - drag.current.startX);
        const dy = Math.abs(e.clientY - drag.current.startY);
        if (dx < 4 && dy < 4) {
          selectedNodeRef.current = null;
          setSelectedNode(null);
        }
      }
      drag.current.active = false;
      drag.current.nodeId = null;
    }

    // Zoom toward cursor (Obsidian-style)
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const oldZoom = camera.current.zoom;
      const newZoom = Math.min(4, Math.max(0.12, oldZoom * factor));

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left - rect.width / 2;
        const my = e.clientY - rect.top - rect.height / 2;
        camera.current.x += mx * (1 / oldZoom - 1 / newZoom);
        camera.current.y += my * (1 / oldZoom - 1 / newZoom);
      }

      camera.current.zoom = newZoom;
      physicsAlpha.current = Math.min(1, physicsAlpha.current + 0.01);
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [findNode]);

  // ── Touch events (mobile) ─────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let lastTouchDist = 0;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const node = findNode(t.clientX, t.clientY);
        drag.current = {
          active: true,
          nodeId: node?.id ?? null,
          lastX: t.clientX,
          lastY: t.clientY,
          startX: t.clientX,
          startY: t.clientY,
        };
        physicsAlpha.current = Math.min(1, physicsAlpha.current + 0.3);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 1 && drag.current.active) {
        const t = e.touches[0];
        const dx = t.clientX - drag.current.lastX;
        const dy = t.clientY - drag.current.lastY;
        drag.current.lastX = t.clientX;
        drag.current.lastY = t.clientY;

        if (drag.current.nodeId) {
          const n = graphRef.current.nodes.find(
            (n) => n.id === drag.current.nodeId,
          );
          if (n) {
            n.x += dx / camera.current.zoom;
            n.y += dy / camera.current.zoom;
            n.vx = 0;
            n.vy = 0;
          }
        } else {
          camera.current.x -= dx / camera.current.zoom;
          camera.current.y -= dy / camera.current.zoom;
        }
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastTouchDist > 0) {
          const factor = dist / lastTouchDist;
          camera.current.zoom = Math.min(
            4,
            Math.max(0.12, camera.current.zoom * factor),
          );
        }
        lastTouchDist = dist;
      }
    }

    function onTouchEnd() {
      drag.current.active = false;
      drag.current.nodeId = null;
      lastTouchDist = 0;
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [findNode]);

  // ── Build neighbour info for selected node panel ──
  const selectedEdges = selectedNode
    ? graphRef.current.edges.filter(
        (e) => e.source === selectedNode.id || e.target === selectedNode.id,
      )
    : [];
  const connectedNodeIds = new Set(
    selectedEdges.flatMap((e) => [e.source, e.target]),
  );
  connectedNodeIds.delete(selectedNode?.id ?? "");
  const connectedNodes = graphRef.current.nodes.filter((n) =>
    connectedNodeIds.has(n.id),
  );

  return (
    <div className="min-h-screen bg-[#181a1f] text-white relative overflow-hidden select-none">
      {/* Header — minimal fade overlay */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center px-5 py-3 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #181a1f 0%, #181a1fcc 50%, transparent 100%)",
        }}
      >
        <div className="pointer-events-auto">
          <h1 className="text-lg font-semibold tracking-tight text-white/90">
            CS Knowledge Graph
          </h1>
          <p className="text-[11px] text-white/35 mt-0.5">
            Interactive map of Computer Science topics
          </p>
        </div>
      </div>

      {/* Category legend — bottom left */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-md pointer-events-none">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span
            key={cat}
            className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-white/45 bg-white/[0.03] backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/[0.05]"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {cat}
          </span>
        ))}
      </div>

      {/* Zoom controls — bottom right */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1">
        <button
          className="h-7 w-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] text-white/60 hover:text-white/90 flex items-center justify-center text-sm transition-all duration-200"
          onClick={() => {
            camera.current.zoom = Math.min(4, camera.current.zoom * 1.25);
          }}
        >
          +
        </button>
        <button
          className="h-7 w-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] text-white/60 hover:text-white/90 flex items-center justify-center text-sm transition-all duration-200"
          onClick={() => {
            camera.current.zoom = Math.max(0.12, camera.current.zoom * 0.8);
          }}
        >
          −
        </button>
        <button
          className="h-7 w-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] text-white/60 hover:text-white/90 flex items-center justify-center text-[9px] transition-all duration-200 mt-0.5"
          onClick={() => {
            camera.current = { x: 0, y: 0, zoom: 0.6 };
            physicsAlpha.current = 0.5;
          }}
        >
          ⟳
        </button>
      </div>

      {/* Selected node panel */}
      {selectedNode && (
        <div
          className="absolute top-14 right-4 z-20 w-64 bg-[#1e2028]/95 backdrop-blur-md border border-white/[0.07] rounded-xl p-4 shadow-2xl"
          style={{ animation: "fadeSlideIn 0.15s ease-out" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  CATEGORY_COLORS[selectedNode.category] || "#6b7280",
                boxShadow: `0 0 8px ${CATEGORY_COLORS[selectedNode.category] || "#6b7280"}60`,
              }}
            />
            <h2 className="text-sm font-semibold text-white/90">
              {selectedNode.label}
            </h2>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-white/30 mb-2">
            {selectedNode.category}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">
            Connected topics ({connectedNodes.length})
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {connectedNodes.map((n) => (
              <button
                key={n.id}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white/85 transition-colors duration-150 cursor-pointer"
                style={{
                  borderLeft: `2px solid ${CATEGORY_COLORS[n.category] || "#6b7280"}`,
                }}
                onClick={() => {
                  selectedNodeRef.current = n.id;
                  setSelectedNode(n);
                  camera.current.x = n.x;
                  camera.current.y = n.y;
                  physicsAlpha.current = 0.3;
                }}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="w-full h-screen">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
