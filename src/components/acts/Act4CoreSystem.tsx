"use client";

import { useFluidStore } from "@/lib/store";
import { LEADERSHIP } from "@/lib/content";
import { Coins, Network, Workflow } from "lucide-react";

const SHAPE_ICON = { coin: Coins, node: Network, pipeline: Workflow };

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
  const local = Math.min(1, Math.max(0, (p - start) / (end - start)));

  const inOpacity = Math.min(1, Math.max(0, (p - 0.74) / 0.02));
  const outOpacity = Math.min(1, Math.max(0, (end - p) / 0.02));
  const opacity = Math.min(inOpacity, outOpacity);

  // horizontal translate driven by local progress
  const count = LEADERSHIP.length;
  const tx = -local * (count - 1) * (100 / count); // percent

  // active stat index
  const activeIdx = Math.min(count - 1, Math.floor(local * count));

  return (
    <section
      className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
      style={{ opacity }}
      aria-label="Core System"
    >
      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-center px-6">
        <div className="font-ui text-[var(--text-secondary)] mb-3">
          Act IV — The Core System
        </div>
        <h2 className="font-h2 !text-[clamp(2rem,7vw,7rem)] text-[var(--text-primary)]">
          Leadership &amp; Scale
        </h2>
      </div>

      {/* horizontal track */}
      <div className="relative w-screen overflow-hidden" style={{ height: "44vh" }}>
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
                className="flex flex-col items-center justify-center px-[10vw] text-center"
                style={{ width: "100vw" }}
              >
                {/* geometric shape (magnetic fluid metaphor) */}
                <div
                  className="mb-8 flex items-center justify-center rounded-2xl transition-all duration-500"
                  style={{
                    width: active ? 140 : 96,
                    height: active ? 140 : 96,
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
                  className="font-h2 !text-[clamp(3rem,10vw,9rem)] leading-none transition-colors duration-500"
                  style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {s.value}
                </div>
                <div className="mt-3 font-ui text-[var(--text-primary)]">{s.label}</div>
                <div className="mt-3 max-w-md font-body !text-[1.05rem] text-[var(--text-secondary)]">
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
