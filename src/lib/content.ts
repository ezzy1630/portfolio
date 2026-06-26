/**
 * Demo portfolio content. Replace with real data later.
 */

export const HERO = {
  name: "ALEX RIVERA",
  role: "Creative Technologist",
  tagline: "I build things that move.",
};

export const PHILOSOPHY = [
  "I design systems.",
  "I build experiences.",
  "I choreograph motion.",
  "I ship reality.",
];

export interface Project {
  id: string;
  index: string;
  title: string;
  category: string;
  year: string;
  stack: string[];
  summary: string;
  link: string;
}

export const PROJECTS: Project[] = [
  {
    id: "p1",
    index: "01",
    title: "Neural Cartography",
    category: "Data Visualization",
    year: "2024",
    stack: ["WebGL", "D3", "Rust/WASM", "Three.js"],
    summary:
      "An interactive atlas mapping 14M research papers into a living, zoomable neural constellation. Real-time GPU clustering at 60fps.",
    link: "#",
  },
  {
    id: "p2",
    index: "02",
    title: "Tessellate",
    category: "Generative Design",
    year: "2023",
    stack: ["GLSL", "React", "WebGPU", "Compute"],
    summary:
      "A generative tessellation engine used by 200+ studios to produce parametric brand identities from a single seed.",
    link: "#",
  },
  {
    id: "p3",
    index: "03",
    title: "Resonance",
    category: "Audio / Visual",
    year: "2023",
    stack: ["Web Audio", "Shaders", "TouchDesigner", "OSC"],
    summary:
      "A browser-native AV instrument turning any microphone into reactive fluid light. Touring with two electronic acts.",
    link: "#",
  },
];

export const CONTACT = {
  email: "hello@alexrivera.dev",
  cta: "LET'S BUILD",
};
