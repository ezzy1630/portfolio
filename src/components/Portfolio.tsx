"use client";

import { useEffect } from "react";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";
import { useMouseTracker } from "@/hooks/useMouseTracker";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { useConsoleEasterEgg } from "@/hooks/useConsoleEasterEgg";
import { useFluidStore } from "@/lib/store";
import WebGPUFluidCanvas from "@/components/fluid/webgpu/WebGPUFluidCanvas";
import Act1Genesis from "@/components/acts/Act1Genesis";
import Act2Current from "@/components/acts/Act2Current";
import Act3Islands from "@/components/acts/Act3Islands";
import Act4CoreSystem from "@/components/acts/Act4CoreSystem";
import Act5Terminal from "@/components/acts/Act5Terminal";
import CustomCursor from "@/components/cursor/CustomCursor";
import ProgressNav from "@/components/nav/ProgressNav";
import AudioToggle from "@/components/audio/AudioToggle";
import Preloader from "@/components/preloader/Preloader";

/**
 * Top-level experience orchestrator. Boots device detection, then
 * wires pointer + smooth-scroll, and layers the fluid canvas, the
 * five acts, and the chrome (cursor / nav / audio / preloader).
 *
 * The scroll height is driven by a transparent spacer so the fixed
 * overlays can read a 0..1 master progress from Lenis.
 * Act mapping: 1:0-8%  2:8-25%  3:25-75%  4:75-90%  5:90-100%
 */
export default function Portfolio() {
  useDeviceCapabilities();
  const booted = useFluidStore((s) => s.isBooted);
  const gpuTier = useFluidStore((s) => s.gpuTier);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const isTouch = useFluidStore((s) => s.isTouch);
  const activeProject = useFluidStore((s) => s.activeProject);

  useMouseTracker(booted && !isTouch);
  useLenisScroll(booted);
  useConsoleEasterEgg();

  // Lock scroll until preloader is done for a clean entrance
  const isLoaded = useFluidStore((s) => s.isLoaded);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.overflow = isLoaded ? "" : "hidden";
  }, [isLoaded]);

  return (
    <>
      <Preloader />

      {/* WebGL fluid (or CSS fallback) */}
      <WebGPUFluidCanvas />

      {/* The five acts — fixed overlays reading scroll progress */}
      <Act1Genesis />
      <Act2Current />
      <Act3Islands />
      <Act4CoreSystem />
      <Act5Terminal />

      {/* Chrome */}
      <CustomCursor />
      {activeProject === null && (
        <>
          <ProgressNav />
          <AudioToggle />
        </>
      )}

      {/* Top-left wordmark */}
      {activeProject === null && (
        <div className="fixed top-6 left-6 md:top-8 md:left-8 z-50 font-ui text-[10px] text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)]">EZZY</span> · RAPPEPORT
          {gpuTier !== "high" && (
            <span className="ml-2 text-[var(--text-secondary)]/60">
              [{gpuTier}]
            </span>
          )}
        </div>
      )}

      {/* Scroll spacer — defines the 0..1 master progress range.
          Act mapping: 1:8% 2:17% 3:50% 4:15% 5:10% → 1000vh total. */}
      <div
        aria-hidden
        className="pointer-events-none relative z-0"
        style={{ height: "1000vh" }}
      />
    </>
  );
}
