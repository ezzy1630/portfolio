"use client";

import { useFluidStore } from "@/lib/store";
import { PHILOSOPHY } from "@/lib/content";

/**
 * ACT 2 — THE CURRENT (scroll ~14% → ~40%)
 * A continuous upward flow of philosophical statements. The typography
 * uses .font-body-display which reads the velocity-driven CSS vars
 * (--font-stretch / --font-weight) set by the fluid sim each frame:
 * scroll fast → condensed + bold, stop → relaxed + light.
 */
export default function Act2Current() {
  const p = useFluidStore((s) => s.scrollProgress);

  const start = 0.14;
  const end = 0.4;
  const local = Math.min(1, Math.max(0, (p - start) / (end - start)));

  // crossfade in/out
  const inOpacity = Math.min(1, Math.max(0, (p - 0.12) / 0.03));
  const outOpacity = Math.min(1, Math.max(0, (end - p) / 0.03));
  const opacity = Math.min(inOpacity, outOpacity);

  // pick the active statement from local progress
  const idx = Math.min(
    PHILOSOPHY.length - 1,
    Math.floor(local * PHILOSOPHY.length)
  );
  const nextIdx = Math.min(PHILOSOPHY.length - 1, idx + 1);
  const subProg = local * PHILOSOPHY.length - idx; // 0..1 within statement

  const active = PHILOSOPHY[idx];
  const next = PHILOSOPHY[nextIdx];

  return (
    <section
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none px-6"
      style={{ opacity }}
      aria-label="Current"
    >
      <div className="relative w-full max-w-6xl text-center">
        {/* current statement */}
        <div
          className="font-body-display text-[var(--text-primary)]"
          style={{
            opacity: 1 - subProg * 0.9,
            transform: `translateY(${-subProg * 60}px)`,
            textShadow: "0 0 50px rgba(0,240,255,0.15)",
          }}
        >
          {active}
        </div>
        {/* incoming statement */}
        {next !== active && (
          <div
            className="font-body-display text-[var(--text-primary)] absolute inset-0 flex items-center justify-center"
            style={{
              opacity: subProg * 0.9,
              transform: `translateY(${(1 - subProg) * 60}px)`,
            }}
          >
            {next}
          </div>
        )}
      </div>

      {/* index ticker */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-ui text-[var(--text-secondary)]">
        {String(idx + 1).padStart(2, "0")} / {String(PHILOSOPHY.length).padStart(2, "0")}
      </div>
    </section>
  );
}
