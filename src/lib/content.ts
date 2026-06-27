/**
 * Real portfolio content for Ezzy Rappeport.
 * Source: resume + "Expanded Grand Vision" brief.
 */

export const HERO = {
  name: "EZZY RAPPEPORT",
  role: "AI Systems · iOS Software · Cognitive Science",
  thesis:
    "Building AI systems and consumer iOS software at scale. 300K+ line iOS app, solo; 1st place at the 2026 NVIDIA × ASUS Hackathon for a multi-agent AI security platform.",
  tagline: "Building AI systems and consumer iOS software at scale.",
};

export const COGNITION_STATEMENTS = [
  "I architect systems that think.",
  "I engineer for scale.",
  "I bridge human intent and machine execution.",
];

/** Codebase-character glyphs that flow in the Act 1 vortex. */
export const CODEBASE_GLYPHS = ["Swift", "Python", "Rust", "{}", "()", "=>", "fn", "let", "async", "struct", "impl", "def", "match", "await", "pub", "mut"];

export type ProjectAccent = {
  /** base fluid tint (rgb 0..1) */
  base: [number, number, number];
  /** highlight tint */
  highlight: [number, number, number];
  /** css hex */
  hex: string;
  /** css hex for highlight */
  hexHighlight: string;
};

export interface Project {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  category: string;
  year: string;
  badge: string;
  accent: ProjectAccent;
  stack: string[];
  summary: string;
  link: string;
}

export const PROJECTS: Project[] = [
  {
    id: "monkeyclaw",
    index: "01",
    title: "MonkeyClaw",
    subtitle: "Multi-Agent AI Security System",
    category: "AI / Security",
    year: "2026",
    badge: "1st Place · NVIDIA × ASUS Hackathon",
    accent: {
      base: [1.0, 0.21, 0.37], // #FF375F pink-red (Red Team)
      highlight: [0.0, 0.94, 1.0], // #00F0FF cyan (Blue Team)
      hex: "#FF375F",
      hexHighlight: "#00F0FF",
    },
    stack: [
      "Python",
      "PyTorch",
      "LoRA / PEFT",
      "NVIDIA Nemotron",
      "NemoClaw",
      "MCP",
      "FastAPI",
      "SQLite",
      "tree-sitter",
    ],
    summary:
      "A coordinated team of AI agents that finds vulnerabilities in NVIDIA's NemoClaw agent sandbox, patches them, and verifies each fix holds.",
    link: "https://github.com/ezzy1630",
  },
  {
    id: "flowe",
    index: "02",
    title: "FlowE",
    subtitle: "iOS Student Productivity App · flowe.cc",
    category: "Consumer iOS",
    year: "2025",
    badge: "Solo Developer · 300K+ LOC",
    accent: {
      base: [0.04, 0.52, 1.0], // #0A84FF Apple blue
      highlight: [0.37, 0.36, 0.9], // #5E5CE6 indigo
      hex: "#0A84FF",
      hexHighlight: "#5E5CE6",
    },
    stack: [
      "Swift",
      "SwiftUI",
      "TypeScript",
      "Next.js",
      "Convex",
      "Clerk",
      "Apple Intelligence",
      "WidgetKit",
      "OpenRouter",
    ],
    summary:
      "A 300K+ line SwiftUI iOS app with a local-first AI layer, a constraint-based scheduling engine, and bidirectional sync across Canvas LMS, EventKit, and Google Calendar.",
    link: "https://flowe.cc",
  },
  {
    id: "argyph",
    index: "03",
    title: "Argyph",
    subtitle: "Local-First MCP Server for AI Coding Agents",
    category: "Developer Tools · Rust",
    year: "2025",
    badge: "Published · Open Source",
    accent: {
      base: [1.0, 0.62, 0.04], // #FF9F0A orange (Rust)
      highlight: [1.0, 0.42, 0.0], // #FF6B00 deep orange
      hex: "#FF9F0A",
      hexHighlight: "#FF6B00",
    },
    stack: ["Rust", "tree-sitter", "BM25", "Vector Search", "MCP", "Local Embedder"],
    summary:
      "A Rust MCP server giving AI coding agents fast, structured, and semantic context over any codebase — tree-sitter symbol graph, hybrid BM25/vector search, bundled local embedder; no cloud or API keys.",
    link: "https://github.com/ezzy1630",
  },
];

export interface MonkeyClawStage {
  key: string;
  name: string;
  role: string;
  color: string;
  desc: string;
}

export const MONKEYCLAW_STAGES: MonkeyClawStage[] = [
  { key: "red", name: "Red", role: "Attack", color: "#FF375F", desc: "LoRA Nemotron attacker probes NemoClaw for vulnerabilities." },
  { key: "judge", name: "Judge", role: "Evaluate", color: "#FFB340", desc: "LLM judge scores exploit validity and severity." },
  { key: "repro", name: "Repro", role: "Reproduce", color: "#BF5AF2", desc: "Deterministic reproduction harness locks the failure." },
  { key: "blue", name: "Blue", role: "Patch", color: "#00F0FF", desc: "Blue agent authors a targeted patch against the root cause." },
  { key: "purple", name: "Purple", role: "Verify", color: "#5E5CE6", desc: "8-gate verifier: detection-as-pass + runtime telemetry." },
];

export const MONKEYCLAW_GATES = [
  "Attack Blocked",
  "Patch Applied",
  "Build Green",
  "1000+ Tests Pass",
  "Detection Fires",
  "Telemetry Live",
  "No Regression",
  "Signed Off",
];

export const MONKEYCLAW_STATS = [
  { label: "Attacker Dataset", value: "1,032", unit: "examples" },
  { label: "Refusal Rate", value: "0", unit: "%" },
  { label: "Tests Shipped", value: "1000", unit: "+" },
  { label: "DB Migrations", value: "20" },
  { label: "Dashboard Panels", value: "11" },
  { label: "Placement", value: "1st", unit: "NVIDIA × ASUS" },
];

export const FLOWE_STATS = [
  { label: "Lines of Code", value: "300K+", unit: "Swift" },
  { label: "Services", value: "100", unit: "+" },
  { label: "Maintainers", value: "1", unit: "solo" },
  { label: "Test Suite", value: "175", unit: "tests" },
  { label: "Calendar Integrations", value: "3", unit: "Canvas · EventKit · Google" },
  { label: "Architecture", value: "MVVM", unit: "+ Clean" },
];

export const ARGYPH_STATS = [
  { label: "Language", value: "Rust" },
  { label: "Search", value: "Hybrid", unit: "BM25 + Vector" },
  { label: "Cloud", value: "0", unit: "local-first" },
  { label: "API Keys", value: "0", unit: "none required" },
  { label: "Parser", value: "tree-sitter" },
  { label: "Protocol", value: "MCP" },
];

export interface LeadershipStat {
  id: string;
  value: string;
  label: string;
  detail: string;
  shape: "coin" | "node" | "pipeline";
}

export const LEADERSHIP: LeadershipStat[] = [
  {
    id: "budget",
    value: "$70,000+",
    label: "Regional budget managed",
    detail:
      "BBYO Regional Treasurer across Colorado, New Mexico & Wyoming — 400+ members served.",
    shape: "coin",
  },
  {
    id: "training",
    value: "4",
    label: "Departments trained across",
    detail:
      "Target Acting Front-End Lead — Guest Services, Drive-Up, Checklanes, Starbucks.",
    shape: "node",
  },
  {
    id: "founded",
    value: "0 → 1",
    label: "Chapter founded from scratch",
    detail:
      "BBYO Chapter Founder & President — org structure, recruitment pipelines, long-term culture.",
    shape: "pipeline",
  },
];

export const EDUCATION = {
  school: "University of California, Santa Cruz",
  degree: "B.S. Computer Science & Cognitive Science",
  detail: "Double Major · Expected 2029",
  org: "Alpha Epsilon Pi — Operations Board",
};

export const HONORS = [
  "1st Place — NVIDIA × ASUS Hackathon at UCSC (MonkeyClaw), May 2026",
  "CyberPatriot — 2nd in Colorado (2021–22), Top 10 (2020–21)",
  "Columbia College Dean’s List — dual enrollment (2024)",
];

export const SKILLS = {
  languages: ["Python", "Swift", "SwiftUI", "TypeScript", "Next.js", "Rust", "PyTorch", "Convex"],
  ai: ["LoRA Fine-Tuning", "Multi-Agent Systems", "MCP", "Claude Code", "Prompt Engineering", "Git", "Xcode"],
};

export const CONTACT = {
  email: "erappepo@ucsc.edu",
  phone: "(210) 870-9859",
  github: "https://github.com/ezzy1630",
  linkedin: "https://linkedin.com/in/ezzy-rappeport",
  location: "California",
  cta: "Initiate contact.",
};
