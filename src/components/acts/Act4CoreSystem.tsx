"use client";

import { useFluidStore } from "@/lib/store";
import { LEADERSHIP } from "@/lib/content";
import { Coins, Network, Workflow } from "lucide-react";

const SHAPE_ICON = { coin: Coins, node: Network, pipeline: Workflow };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smoothStep = (edge0: number, edge1: number, n: number) => {
  const t = clamp01((n - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * ACT 4 — THE CORE SYSTEM (scroll ~75% → ~90%)
 * The fluid drains to the bottom (uDrainBottom). A horizontally scrolling
 * list of leadership stats is driven by the vertical scroll position —
 * as each stat scrolls by, the fluid briefly snaps into a geometric shape
 * (coin / node / pipeline).
 */
export default function Act4CoreSystem() {
  const p = useFluidStore((s) => s.scrollProgress);

  const start = 0.75;
  const end = 0.9;
  const local = clamp01((p - start) / (end - start));

  const enter = smoothStep(0.735, 0.765, p);
  const exit = smoothStep(0.855, 0.92, p);
  const opacity = enter * (1 - exit);
  const y = 8 * (1 - enter) - 12 * exit;
  const scale = 0.985 + 0.015 * enter - 0.035 * exit;

  // horizontal translate driven by local progress
  const count = LEADERSHIP.length;
  const tx = -local * (count - 1) * (100 / count); // percent

  // active stat index
  const activeIdx = Math.min(count - 1, Math.floor(local * count));

  return (
    <section
      className="fixed inset-0 z-10 pointer-events-none"
      style={{
        opacity,
        transform: `translate3d(0, ${y}vh, 0) scale(${scale})`,
        transformOrigin: "50% 48%",
      }}
      aria-label="Core System"
    >
      <div className="absolute top-[clamp(2.75rem,7vh,5.5rem)] left-1/2 z-10 w-full -translate-x-1/2 px-6 text-center">
        <div className="font-ui text-[var(--text-secondary)] mb-3">
          Act IV — The Core System
        </div>
        <h2 className="font-h2 !text-[clamp(2.75rem,7vw,6.5rem)] text-[var(--text-primary)]">
          Leadership &amp; Scale
        </h2>
      </div>

      {/* horizontal track */}
      <div
        className="absolute inset-x-0 top-[31vh] w-screen overflow-hidden"
        style={{ height: "62vh" }}
      >
        <div
          className="flex h-full items-center transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${tx}vw)`,
            width: `${count * 100}vw`,
          }}
        >
          {LEADERSHIP.map((s, i) => {
            const Icon = SHAPE_ICON[s.shape];
            const active = i === activeIdx;
            return (
              <div
                key={s.id}
                className="flex flex-col items-center justify-start px-[10vw] pt-[clamp(0rem,1.5vh,1rem)] text-center"
                style={{ width: "100vw" }}
              >
                {/* geometric shape (magnetic fluid metaphor) */}
                <div
                  className="mb-[clamp(1rem,2.5vh,1.75rem)] flex items-center justify-center rounded-2xl transition-all duration-500"
                  style={{
                    width: active ? "clamp(5rem, 7vw, 7rem)" : "clamp(4rem, 5vw, 5.5rem)",
                    height: active ? "clamp(5rem, 7vw, 7rem)" : "clamp(4rem, 5vw, 5.5rem)",
                    transform: `scale(${active ? 1.05 : 0.85}) rotate(${active ? 0 : 12}deg)`,
                    background: active
                      ? `radial-gradient(circle, rgba(94,92,230,0.35), rgba(94,92,230,0.05) 70%)`
                      : `radial-gradient(circle, rgba(94,92,230,0.12), transparent 70%)`,
                    border: `1px solid ${active ? "rgba(94,92,230,0.6)" : "rgba(245,245,247,0.12)"}`,
                    boxShadow: active ? "0 0 50px rgba(94,92,230,0.35)" : "none",
                  }}
                >
                  <Icon
                    className="h-1/2 w-1/2"
                    style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                  />
                </div>

                <div
                  className="font-h2 !text-[clamp(3.25rem,10vw,8.5rem)] leading-none transition-colors duration-500"
                  style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {s.value}
                </div>
                <div className="mt-3 font-ui text-[var(--text-primary)]">{s.label}</div>
                <div className="mt-3 max-w-[min(34rem,82vw)] font-body !text-[clamp(0.95rem,1.4vw,1.1rem)] text-[var(--text-secondary)]">
                  {s.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* progress rail */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {LEADERSHIP.map((s, i) => (
          <span
            key={s.id}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === activeIdx ? 36 : 12,
              background:
                i === activeIdx ? "var(--indigo)" : "rgba(134,134,139,0.4)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
