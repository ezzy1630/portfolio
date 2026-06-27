"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useFluidStore } from "@/lib/store";
import { PROJECTS } from "@/lib/content";
import { AnimatePresence, motion } from "framer-motion";
import { X, Crosshair } from "lucide-react";
import type { ProjectArtifactType } from "@/components/artifacts/ProjectArtifact";

const ProjectArtifact = dynamic(
  () => import("@/components/artifacts/ProjectArtifact"),
  { ssr: false },
);

function CaseStudyLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center font-ui text-[var(--text-secondary)]">
      Loading case study
    </div>
  );
}

const CASE_STUDIES = [
  dynamic(() => import("@/components/casestudies/MonkeyClawCaseStudy"), {
    ssr: false,
    loading: CaseStudyLoading,
  }),
  dynamic(() => import("@/components/casestudies/FlowECaseStudy"), {
    ssr: false,
    loading: CaseStudyLoading,
  }),
  dynamic(() => import("@/components/casestudies/ArgyphCaseStudy"), {
    ssr: false,
    loading: CaseStudyLoading,
  }),
];

const preloadCaseStudy = (index: number) => {
  if (index === 0) return import("@/components/casestudies/MonkeyClawCaseStudy");
  if (index === 1) return import("@/components/casestudies/FlowECaseStudy");
  return import("@/components/casestudies/ArgyphCaseStudy");
};

/**
 * ACT 3 — THE EXECUTION ISLANDS (scroll ~25% → ~75%)
 * Three project "islands". The fluid gathers into a central sphere whose
 * accent color shifts per active project as the user scrolls. Clicking an
 * island shatters the fluid into glass mode and expands a rich case study.
 */
export default function Act3Islands() {
  const p = useFluidStore((s) => s.scrollProgress);
  const activeProject = useFluidStore((s) => s.activeProject);
  const setActiveProject = useFluidStore((s) => s.set);
  const [hovered, setHovered] = useState(false);

  const start = 0.25;
  const end = 0.75;
  const local = Math.min(1, Math.max(0, (p - start) / (end - start)));

  const inOpacity = Math.min(1, Math.max(0, (p - 0.24) / 0.02));
  const outOpacity = Math.min(1, Math.max(0, (end - p) / 0.02));
  const opacity = Math.min(inOpacity, outOpacity);

  const idx = Math.min(PROJECTS.length - 1, Math.floor(local * PROJECTS.length));
  const project = PROJECTS[idx];

  // drive the store's accent color so the fluid + DOM tint matches the active project
  useEffect(() => {
    const a = project.accent;
    useFluidStore.getState().set({
      activeProjectId: project.id,
      projectAccent: {
        r: a.base[0],
        g: a.base[1],
        b: a.base[2],
        hr: a.highlight[0],
        hg: a.highlight[1],
        hb: a.highlight[2],
      },
    });
  }, [project]);

  const isOpen = activeProject !== null;
  const shouldMountArtifact = opacity > 0.02 || isOpen;
  const ActiveCaseStudy = activeProject !== null ? CASE_STUDIES[activeProject] : null;
  const openProject = useCallback(
    (index: number) => {
      void preloadCaseStudy(index);
      setActiveProject({ activeProject: index });
    },
    [setActiveProject],
  );

  useEffect(() => {
    const preload = () => {
      void import("@/components/artifacts/ProjectArtifact");
      PROJECTS.forEach((_, index) => void preloadCaseStudy(index));
    };
    const idle = (
      window as typeof window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    );
    if (idle.requestIdleCallback) {
      const id = idle.requestIdleCallback(preload, { timeout: 2400 });
      return () => idle.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(preload, 900);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
      aria-label="Execution Islands"
    >
      {/* The living project artifact */}
      <button
        type="button"
        aria-label={`Open ${project.title}`}
        onClick={() => openProject(idx)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-cursor-label="EXPAND"
        className="group relative flex items-center justify-center rounded-full transition-transform duration-500"
        style={{
          pointerEvents: opacity > 0.3 ? "auto" : "none",
          width: "clamp(230px, 42vmin, 390px)",
          height: "clamp(230px, 42vmin, 390px)",
          transform: `scale(${hovered ? 1.04 : 1}) ${isOpen ? "scale(1.4)" : ""}`,
          background: `radial-gradient(circle at 50% 50%, ${project.accent.hex}18, transparent 64%)`,
          boxShadow: `0 0 90px ${project.accent.hex}30`,
        }}
      >
        {shouldMountArtifact && (
          <ProjectArtifact
            type={project.id as ProjectArtifactType}
            hovered={hovered}
            expanded={activeProject === idx}
          />
        )}

        {/* orbiting index ring */}
        <div
          className="absolute inset-0 rounded-full border border-white/10"
          style={{ transform: `rotate(${local * 360}deg)` }}
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 -top-3 font-ui"
            style={{ color: project.accent.hex, textShadow: `0 0 12px ${project.accent.hex}` }}
          >
            {project.index}
          </span>
          <span
            className="absolute left-1/2 -translate-x-1/2 -bottom-3 font-ui text-[var(--text-secondary)]"
            style={{ transform: "rotate(180deg)" }}
          >
            {project.year}
          </span>
        </div>

        {/* center label */}
        <div
          className="relative z-10 flex flex-col items-center gap-2 px-6 text-center"
          style={{
            textShadow: "0 1px 18px rgba(0,0,0,0.9), 0 0 28px rgba(0,0,0,0.8)",
          }}
        >
          <span className="font-ui text-[var(--text-secondary)]">
            {project.category}
          </span>
          <span className="max-w-[min(82vw,540px)] font-h2 !text-[clamp(1.45rem,4.4vw,3.55rem)] text-[var(--text-primary)] leading-none break-words">
            {project.title}
          </span>
          <span className="font-ui text-[var(--text-secondary)] !text-[0.7rem] !tracking-[0.1em] normal-case max-w-[80%]">
            {project.subtitle}
          </span>
        </div>

        {/* hover crosshair hint */}
        <span
          className="absolute -bottom-9 font-ui text-[var(--text-secondary)] flex items-center gap-1.5 transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0.5 }}
        >
          <Crosshair className="h-3 w-3" />
          {hovered ? "EXPAND" : "Click to expand"}
        </span>
      </button>

      {/* project progress dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {PROJECTS.map((pr, i) => (
          <span
            key={pr.id}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === idx ? 32 : 10,
              background:
                i === idx ? project.accent.hex : "rgba(134,134,139,0.4)",
            }}
          />
        ))}
      </div>

      {/* Case study overlay (shatter + glass) */}
      <AnimatePresence>
        {isOpen && activeProject !== null && (
          <motion.div
            key="case"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto fixed inset-0 z-[80] overflow-y-auto p-3 pt-14 sm:p-6 md:p-8"
            style={{
              background: "rgba(5,5,7,0.86)",
              backdropFilter: "blur(20px)",
            }}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto my-0 w-full max-w-6xl overflow-hidden rounded-xl"
              style={{
                background:
                  "linear-gradient(160deg, rgba(20,20,30,0.92), rgba(10,10,15,0.97))",
                border: `1px solid ${PROJECTS[activeProject].accent.hex}30`,
                boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px ${PROJECTS[activeProject].accent.hex}10`,
              }}
            >
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#090910]/90 px-4 py-3 backdrop-blur md:px-6">
                <div className="font-ui text-[10px] text-[var(--text-secondary)]">
                  {PROJECTS[activeProject].index} / {PROJECTS[activeProject].title}
                </div>
                <button
                  type="button"
                  aria-label="Close case study"
                  onClick={() => setActiveProject({ activeProject: null })}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-ui text-[10px] text-[var(--text-secondary)] transition hover:border-white/20 hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
                >
                  Close
                  <X className="h-4 w-4" />
                </button>
              </div>
              {ActiveCaseStudy && <ActiveCaseStudy />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
