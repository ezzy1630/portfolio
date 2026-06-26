"use client";

import { useFluidStore } from "@/lib/store";
import { HERO } from "@/lib/content";

/**
 * ACT 1 — THE GENESIS (scroll 0% → ~8%)
 * Fluid rushes in and parts; "EZZY RAPPEPORT" rises through a clip-path
 * curtain; the thesis fades in beneath. The fluid sim renders a central
 * codebase-character vortex (uVortex) during this act.
 */
export default function Act1Genesis() {
  const p = useFluidStore((s) => s.scrollProgress);

  const reveal = Math.min(1, p / 0.05);
  const exit = Math.max(0, (p - 0.07) / 0.03);
  const opacity = Math.max(0, reveal - exit);
  const inset = 50 * (1 - reveal);

  // thesis appears after the name is mostly revealed
  const thesisOpacity = Math.max(0, Math.min(1, (p - 0.03) / 0.03) - exit);

  return (
    <section
      className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6"
      style={{ opacity }}
      aria-label="Genesis"
    >
      <div
        className="font-hero text-center select-none"
        style={{
          clipPath: `inset(${inset}% 0 ${inset}% 0)`,
          WebkitClipPath: `inset(${inset}% 0 ${inset}% 0)`,
          color: "var(--text-primary)",
          textShadow:
            "0 0 40px rgba(94,92,230,0.35), 0 0 80px rgba(94,92,230,0.2)",
        }}
      >
        {HERO.name}
      </div>

      <div
        className="mt-6 md:mt-10 max-w-3xl text-center font-body text-[var(--text-secondary)] transition-opacity duration-500"
        style={{ opacity: thesisOpacity }}
      >
        {HERO.thesis}
      </div>

      <div
        className="mt-8 font-ui text-[var(--text-secondary)] transition-opacity duration-500"
        style={{ opacity: thesisOpacity }}
      >
        {HERO.role}
      </div>

      {/* scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 font-ui text-[var(--text-secondary)] flex flex-col items-center gap-2"
        style={{ opacity: p < 0.04 ? 1 - p * 25 : 0 }}
      >
        <span>Scroll to part the fluid</span>
        <span className="block w-px h-12 bg-gradient-to-b from-[var(--indigo)] to-transparent animate-pulse" />
      </div>
    </section>
  );
}
