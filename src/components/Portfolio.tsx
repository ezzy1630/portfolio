"use client";

import { useEffect } from "react";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";
import { useMouseTracker } from "@/hooks/useMouseTracker";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { useFluidStore } from "@/lib/store";
import FluidCanvas from "@/components/fluid/FluidCanvas";
import Act1Genesis from "@/components/acts/Act1Genesis";
import Act2Current from "@/components/acts/Act2Current";
import Act3Islands from "@/components/acts/Act3Islands";
import Act4Abyss from "@/components/acts/Act4Abyss";
import CustomCursor from "@/components/cursor/CustomCursor";
import ProgressNav from "@/components/nav/ProgressNav";
import AudioToggle from "@/components/audio/AudioToggle";
import Preloader from "@/components/preloader/Preloader";

/**
 * Top-level experience orchestrator. Boots device detection, then
 * wires pointer + smooth-scroll, and layers the fluid canvas, the
 * four acts, and the chrome (cursor / nav / audio / preloader).
 *
 * The scroll height is driven by a transparent 1000vh spacer so the
 * fixed overlays can read a 0..1 master progress from Lenis.
 */
export default function Portfolio() {
  useDeviceCapabilities();
  const booted = useFluidStore((s) => s.isBooted);
  const gpuTier = useFluidStore((s) => s.gpuTier);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const isTouch = useFluidStore((s) => s.isTouch);

  useMouseTracker(booted && !isTouch);
  useLenisScroll(booted);

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
      <FluidCanvas />

      {/* The four acts — fixed overlays reading scroll progress */}
      <Act1Genesis />
      <Act2Current />
      <Act3Islands />
      <Act4Abyss />

      {/* Chrome */}
      <CustomCursor />
      <ProgressNav />
      <AudioToggle />

      {/* Top-left wordmark */}
      <div className="fixed top-6 left-6 md:top-8 md:left-8 z-50 font-ui text-[10px] text-[var(--text-secondary)]">
        <span className="text-[var(--text-primary)]">KINETIC</span> · FLUID CANVAS
        {gpuTier !== "high" && (
          <span className="ml-2 text-[var(--text-secondary)]/60">
            [{gpuTier}]
          </span>
        )}
      </div>

      {/* Scroll spacer — defines the 0..1 master progress range.
          100/300/400/200 vh ≈ 10/30/40/20 % per act. */}
      <div
        aria-hidden
        className="pointer-events-none relative z-0"
        style={{ height: "1000vh" }}
      />
    </>
  );
}
