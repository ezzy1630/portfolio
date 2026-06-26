"use client";

import { useState } from "react";
import { useFluidStore } from "@/lib/store";
import { getLenis } from "@/lib/lenis";

const SECTIONS = [
  { name: "Genesis", range: [0, 0.14] as const },
  { name: "Current", range: [0.14, 0.4] as const },
  { name: "Islands", range: [0.4, 0.8] as const },
  { name: "Abyss", range: [0.8, 1.0] as const },
];

/**
 * Fixed right-side vertical progress rail. A liquid-metal (cyan) fill
 * maps to the master scroll progress. Hover expands the rail and
 * reveals section tooltips; click jumps to that act.
 */
export default function ProgressNav() {
  const p = useFluidStore((s) => s.scrollProgress);
  const [hover, setHover] = useState(false);

  const jump = (range: readonly [number, number]) => {
    const target = (range[0] + range[1]) / 2;
    const l = getLenis();
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const y = target * limit;
    if (l) l.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const activeIdx = SECTIONS.findIndex(
    (s) => p >= s.range[0] && p < s.range[1]
  );

  return (
    <nav
      className="fixed right-6 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-3"
      aria-label="Section progress"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="relative rounded-full transition-all duration-500"
        style={{
          width: hover ? 4 : 2,
          height: 200,
          background: "rgba(134,134,139,0.3)",
        }}
      >
        <div
          className="absolute top-0 left-0 rounded-full"
          style={{
            width: "100%",
            height: `${p * 100}%`,
            background:
              "linear-gradient(to bottom, var(--iridescent-violet), var(--iridescent-cyan))",
            boxShadow: "0 0 10px rgba(0,240,255,0.6)",
            transition: "height 0.1s linear",
          }}
        />
      </div>

      {/* section tooltips */}
      <div
        className="flex flex-col items-end gap-1.5 transition-all duration-300"
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? "translateX(0)" : "translateX(8px)",
          pointerEvents: hover ? "auto" : "none",
        }}
      >
        {SECTIONS.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onClick={() => jump(s.range)}
            className="font-ui text-[10px] transition-colors"
            style={{
              color: i === activeIdx ? "var(--iridescent-cyan)" : "var(--text-secondary)",
            }}
          >
            {String(i + 1).padStart(2, "0")} · {s.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
