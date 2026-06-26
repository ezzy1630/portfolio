"use client";

import { useFluidStore } from "@/lib/store";
import { COGNITION_STATEMENTS } from "@/lib/content";

/**
 * ACT 2 — THE COGNITION STREAM (scroll ~8% → ~25%)
 * Fluid flows upward (uScrollForce). Three statements crossfade,
 * distorted by the fluid. Font weight responds to scroll velocity.
 * When the user stops scrolling, the fluid forms a neural-network
 * lattice (uLattice, driven by restingTime in the store).
 */
export default function Act2Current() {
  const p = useFluidStore((s) => s.scrollProgress);
  const isResting = useFluidStore((s) => s.isResting);

  const start = 0.08;
  const end = 0.25;
  const inOpacity = Math.min(1, Math.max(0, (p - 0.07) / 0.02));
  const outOpacity = Math.min(1, Math.max(0, (end - p) / 0.02));
  const opacity = Math.min(inOpacity, outOpacity);

  const local = Math.min(1, Math.max(0, (p - start) / (end - start)));
  const idx = Math.min(
    COGNITION_STATEMENTS.length - 1,
    Math.floor(local * COGNITION_STATEMENTS.length)
  );
  const nextIdx = Math.min(COGNITION_STATEMENTS.length - 1, idx + 1);
  const subProg = local * COGNITION_STATEMENTS.length - idx;

  const active = COGNITION_STATEMENTS[idx];
  const next = COGNITION_STATEMENTS[nextIdx];

  return (
    <section
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none px-6"
      style={{ opacity }}
      aria-label="Cognition Stream"
    >
      <div className="relative w-full max-w-6xl text-center">
        <div
          className="font-body-display text-[var(--text-primary)]"
          style={{
            opacity: 1 - subProg * 0.9,
            transform: `translateY(${-subProg * 60}px)`,
            textShadow: "0 0 50px rgba(94,92,230,0.2)",
          }}
        >
          {active}
        </div>
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

      {/* neural lattice hint badge */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-32 font-ui text-[var(--text-secondary)] transition-opacity duration-700"
        style={{ opacity: isResting && p > 0.1 && p < 0.25 ? 0.6 : 0 }}
      >
        ◦ forming cognition lattice ◦
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-ui text-[var(--text-secondary)]">
        {String(idx + 1).padStart(2, "0")} / {String(COGNITION_STATEMENTS.length).padStart(2, "0")}
      </div>
    </section>
  );
}
