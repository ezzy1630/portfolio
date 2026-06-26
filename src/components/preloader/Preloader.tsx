"use client";

import { useEffect, useState } from "react";
import { useFluidStore } from "@/lib/store";

const STAGES = [
  "Compiling Shaders…",
  "Initializing Fluid…",
  "Entering the Abyss…",
  "Loading Codebase…",
];

/**
 * WebGL preloader overlay. Cycles loading messages while the fluid
 * canvas boots, then fades out and flips the store's isLoaded flag.
 */
export default function Preloader() {
  const set = useFluidStore((s) => s.set);
  const [stage, setStage] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setStage(i), i * 700));
    });
    timers.push(
      setTimeout(() => {
        setHidden(true);
        set({ isLoaded: true });
      }, STAGES.length * 700 + 500)
    );
    return () => timers.forEach(clearTimeout);
  }, [set]);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center transition-opacity duration-700"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #0a0a0f 0%, #030303 70%)",
        opacity: stage >= STAGES.length - 1 ? 0 : 1,
      }}
    >
      {/* vortex */}
      <div className="relative h-32 w-32 mb-10">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, var(--argyph), var(--monkeyclaw), var(--indigo), var(--flowe), var(--argyph))",
            filter: "blur(8px)",
            animation: "spin 1.4s linear infinite",
          }}
        />
        <div
          className="absolute inset-3 rounded-full"
          style={{ background: "#050507" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            borderTop: "2px solid var(--indigo)",
            animation: "spin 2s linear infinite reverse",
          }}
        />
      </div>

      <div className="font-ui text-[var(--text-primary)] tracking-[0.3em]">
        {STAGES[stage]}
      </div>

      {/* progress bar */}
      <div className="mt-6 h-px w-48 bg-white/10 overflow-hidden">
        <div
          className="h-full bg-[var(--indigo)] transition-all duration-500"
          style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
        />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg);} }`}</style>
    </div>
  );
}
