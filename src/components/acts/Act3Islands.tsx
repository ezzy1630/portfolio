"use client";

import { useState } from "react";
import { useFluidStore } from "@/lib/store";
import { PROJECTS } from "@/lib/content";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";

/**
 * ACT 3 — THE ISLANDS (scroll ~40% → ~80%)
 * The fluid gathers into a central sphere (driven by uOrbitAmount).
 * Each project is an "island". Scrolling cycles through projects;
 * clicking the sphere expands a glass case-study overlay.
 */
export default function Act3Islands() {
  const p = useFluidStore((s) => s.scrollProgress);
  const activeProject = useFluidStore((s) => s.activeProject);
  const setActiveProject = useFluidStore((s) => s.set);
  const [hovered, setHovered] = useState(false);

  const start = 0.4;
  const end = 0.8;
  const local = Math.min(1, Math.max(0, (p - start) / (end - start)));

  const inOpacity = Math.min(1, Math.max(0, (p - 0.38) / 0.025));
  const outOpacity = Math.min(1, Math.max(0, (end - p) / 0.02));
  const opacity = Math.min(inOpacity, outOpacity);

  const idx = Math.min(PROJECTS.length - 1, Math.floor(local * PROJECTS.length));
  const project = PROJECTS[idx];

  const isOpen = activeProject !== null;

  return (
    <section
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
      aria-label="Islands"
    >
      {/* Sphere (clickable) */}
      <button
        type="button"
        aria-label={`Open ${project.title}`}
        onClick={() => setActiveProject({ activeProject: idx })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex items-center justify-center rounded-full transition-transform duration-500"
        style={{
          pointerEvents: opacity > 0.3 ? "auto" : "none",
          width: "min(46vmin, 420px)",
          height: "min(46vmin, 420px)",
          transform: `scale(${hovered ? 1.05 : 1}) ${isOpen ? "scale(1.4)" : ""}`,
          background:
            "radial-gradient(circle at 35% 30%, rgba(0,240,255,0.25), rgba(74,0,224,0.18) 45%, rgba(10,10,15,0.9) 75%)",
          boxShadow:
            "0 0 80px rgba(0,240,255,0.25), inset 0 0 60px rgba(74,0,224,0.3)",
          backdropFilter: "blur(2px)",
          border: "1px solid rgba(0,240,255,0.2)",
        }}
      >
        {/* orbiting index ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            transform: `rotate(${local * 360}deg)`,
          }}
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 -top-3 font-ui text-[var(--iridescent-cyan)]"
            style={{ textShadow: "0 0 12px rgba(0,240,255,0.6)" }}
          >
            {project.index}
          </span>
        </div>

        {/* center label */}
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <span className="font-ui text-[var(--text-secondary)]">
            {project.category}
          </span>
          <span className="font-body-display text-[var(--text-primary)] !text-[clamp(1.5rem,4vw,3rem)] leading-tight">
            {project.title}
          </span>
          <span className="font-ui text-[var(--text-secondary)]">
            {project.year}
          </span>
        </div>

        {/* hover hint */}
        <span
          className="absolute -bottom-8 font-ui text-[var(--text-secondary)] transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0.5 }}
        >
          Click to open
        </span>
      </button>

      {/* progress dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {PROJECTS.map((pr, i) => (
          <span
            key={pr.id}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === idx ? 28 : 10,
              background:
                i === idx
                  ? "var(--iridescent-cyan)"
                  : "rgba(134,134,139,0.4)",
            }}
          />
        ))}
      </div>

      {/* Case study overlay */}
      <AnimatePresence>
        {isOpen && activeProject !== null && (
          <motion.div
            key="case"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center p-6 md:p-12"
            style={{
              background: "rgba(3,3,5,0.55)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div
              className="relative w-full max-w-3xl rounded-2xl p-8 md:p-12 fluid-scroll overflow-y-auto max-h-[85vh]"
              style={{
                background:
                  "linear-gradient(160deg, rgba(20,20,30,0.85), rgba(10,10,15,0.95))",
                border: "1px solid rgba(0,240,255,0.18)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              }}
            >
              <button
                type="button"
                aria-label="Close case study"
                onClick={() => setActiveProject({ activeProject: null })}
                className="absolute right-5 top-5 rounded-full p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="font-ui text-[var(--iridescent-cyan)] mb-3">
                Project {PROJECTS[activeProject].index} / {PROJECTS.length}
              </div>
              <h2 className="font-body-display !text-[clamp(2rem,6vw,4.5rem)] text-[var(--text-primary)] mb-3">
                {PROJECTS[activeProject].title}
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-1 font-ui text-[var(--text-secondary)] mb-8">
                <span>{PROJECTS[activeProject].category}</span>
                <span>·</span>
                <span>{PROJECTS[activeProject].year}</span>
              </div>

              <p className="text-[var(--text-primary)] text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
                {PROJECTS[activeProject].summary}
              </p>

              <div className="mb-10">
                <div className="font-ui text-[var(--text-secondary)] mb-3">
                  Tech Stack
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROJECTS[activeProject].stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-3 py-1 font-ui text-[var(--text-primary)]"
                      style={{
                        background: "rgba(0,240,255,0.08)",
                        border: "1px solid rgba(0,240,255,0.2)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={PROJECTS[activeProject].link}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-ui text-[var(--abyss)] transition hover:gap-3"
                style={{ background: "var(--iridescent-cyan)" }}
              >
                View Live
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
