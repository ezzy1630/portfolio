import { create } from "zustand";

export type GpuTier = "high" | "medium" | "low";
export type RenderMode = "webgl" | "fallback";

interface FluidState {
  /* scroll */
  scrollProgress: number; // 0..1 master progress
  scrollVelocity: number; // raw px/frame from lenis (abs)
  scrollDirection: 1 | -1 | 0;

  /* resting timer (for Act 2 neural lattice) */
  restingTime: number; // seconds since last significant scroll
  isResting: boolean;

  /* pointer */
  mouseX: number; // -1..1
  mouseY: number; // -1..1
  mouseDX: number; // delta
  mouseDY: number;
  mouseActive: boolean;

  /* runtime */
  gpuTier: GpuTier;
  renderMode: RenderMode;
  reducedMotion: boolean;
  isTouch: boolean;
  isLoaded: boolean; // preloader done
  isBooted: boolean; // device capabilities detected

  /* audio */
  audioEnabled: boolean;

  /* acts */
  activeProject: number | null; // Act 3 expanded case study index
  activeProjectId: string | null; // for accent tinting while scrolling Act 3
  projectAccent: { r: number; g: number; b: number; hr: number; hg: number; hb: number };

  /* contact terminal */
  contactSending: boolean;
  contactSent: boolean;

  /* setters */
  set: (partial: Partial<FluidState>) => void;
  setMouse: (x: number, y: number, dx: number, dy: number) => void;
}

export const useFluidStore = create<FluidState>((set) => ({
  scrollProgress: 0,
  scrollVelocity: 0,
  scrollDirection: 0,

  restingTime: 0,
  isResting: false,

  mouseX: 0,
  mouseY: 0,
  mouseDX: 0,
  mouseDY: 0,
  mouseActive: false,

  gpuTier: "high",
  renderMode: "webgl",
  reducedMotion: false,
  isTouch: false,
  isLoaded: false,
  isBooted: false,

  audioEnabled: false,
  activeProject: null,
  activeProjectId: null,
  projectAccent: { r: 0.04, g: 0.52, b: 1.0, hr: 0.37, hg: 0.36, hb: 0.9 },

  contactSending: false,
  contactSent: false,

  set: (partial) => set(partial),
  setMouse: (x, y, dx, dy) =>
    set({ mouseX: x, mouseY: y, mouseDX: dx, mouseDY: dy, mouseActive: true }),
}));
