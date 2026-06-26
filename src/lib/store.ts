import { create } from "zustand";

export type GpuTier = "high" | "medium" | "low";
export type RenderMode = "webgl" | "fallback";

interface FluidState {
  /* scroll */
  scrollProgress: number; // 0..1 master progress
  scrollVelocity: number; // raw px/frame from lenis (abs)
  scrollDirection: 1 | -1 | 0;

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
  activeProject: number | null; // Act 3 expand

  /* setters */
  set: (partial: Partial<FluidState>) => void;
  setMouse: (x: number, y: number, dx: number, dy: number) => void;
}

export const useFluidStore = create<FluidState>((set) => ({
  scrollProgress: 0,
  scrollVelocity: 0,
  scrollDirection: 0,

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

  set: (partial) => set(partial),
  setMouse: (x, y, dx, dy) =>
    set({ mouseX: x, mouseY: y, mouseDX: dx, mouseDY: dy, mouseActive: true }),
}));
