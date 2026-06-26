"use client";

import { useFluidStore } from "@/lib/store";
import { HERO } from "@/lib/content";

/**
 * ACT 1 — THE GENESIS (scroll 0% → ~14%)
 * The fluid splits horizontally and the hero name rises through a
 * clip-path curtain reveal, synced to the fluid's uPartAmount.
 */
export default function Act1Genesis() {
  const p = useFluidStore((s) => s.scrollProgress);

  // local act progress 0..1 across 0 -> 0.14
  const local = Math.min(1, Math.max(0, p / 0.14));
  // reveal ramps with the fluid parting (0 -> 0.08), holds, then fades out
  const reveal = Math.min(1, p / 0.08);
  const exit = Math.max(0, (p - 0.11) / 0.03); // fade 0.11 -> 0.14
  const opacity = Math.max(0, reveal - exit);
  // curtain: inset 50% -> 0% as reveal goes 0 -> 1
  const inset = 50 * (1 - reveal);

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
            "0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(74,0,224,0.2)",
        }}
      >
        {HERO.name}
      </div>

      <div
        className="mt-8 font-ui text-[var(--text-secondary)] transition-opacity duration-500"
        style={{ opacity: reveal > 0.6 ? 1 : 0 }}
      >
        {HERO.role} — {HERO.tagline}
      </div>

      {/* scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 font-ui text-[var(--text-secondary)] flex flex-col items-center gap-2"
        style={{ opacity: local < 0.5 ? 1 - local * 2 : 0 }}
      >
        <span>Scroll to part the fluid</span>
        <span className="block w-px h-12 bg-gradient-to-b from-[var(--iridescent-cyan)] to-transparent animate-pulse" />
      </div>
    </section>
  );
}
