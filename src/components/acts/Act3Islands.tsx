"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useFluidStore } from "@/lib/store";
import { MONKEYCLAW_GATES, MONKEYCLAW_STAGES, PROJECTS } from "@/lib/content";
import { AnimatePresence, motion } from "framer-motion";
import { X, Crosshair } from "lucide-react";
import type { ProjectArtifactType } from "@/components/artifacts/ProjectArtifact";
import MonkeyClawGrabCanvas from "@/components/casestudies/monkeyclaw/MonkeyClawGrabCanvas";

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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const MONKEYCLAW_BEATS = [
  {
    label: "Exploit search",
    title: "Red agent probes NemoClaw",
    body: "LoRA-tuned Nemotron searches for a concrete sandbox break, not a generic benchmark score.",
    evidence: "1,032 attacker examples",
  },
  {
    label: "Validity filter",
    title: "Judge scores severity",
    body: "The exploit is scored and routed only if it reproduces as a real security finding.",
    evidence: "LLM severity filter",
  },
  {
    label: "Reproduction lock",
    title: "Harness freezes the failure",
    body: "The repro agent turns the attack into deterministic evidence the patcher cannot hand-wave away.",
    evidence: "deterministic repro",
  },
  {
    label: "Patch authoring",
    title: "Blue agent closes root cause",
    body: "The defense pass edits against the failing path while keeping the wider system stable.",
    evidence: "targeted patch",
  },
  {
    label: "Detection-as-pass",
    title: "Purple verifier must fire",
    body: "Eight gates light only when detection, telemetry, tests, and regression checks all agree.",
    evidence: "1000+ tests",
  },
] as const;

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
  const projectPhase = Math.min(1, Math.max(0, local * PROJECTS.length - idx));
  const monkeyClawForgeOpacity =
    project.id === "monkeyclaw"
      ? clamp01(projectPhase / 0.06) * clamp01((1 - projectPhase) / 0.1)
      : 0;
  const monkeyBeatIndex = Math.min(
    MONKEYCLAW_BEATS.length - 1,
    Math.floor(clamp01(projectPhase * 1.04) * MONKEYCLAW_BEATS.length),
  );
  const monkeyBeat = MONKEYCLAW_BEATS[monkeyBeatIndex];
  const monkeyGateCount = Math.min(
    MONKEYCLAW_GATES.length,
    Math.max(1, Math.ceil(clamp01((projectPhase - 0.58) / 0.34) * MONKEYCLAW_GATES.length)),
  );
  const monkeyBeatProgress = clamp01(projectPhase * MONKEYCLAW_BEATS.length - monkeyBeatIndex);

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
      {project.id === "monkeyclaw" && shouldMountArtifact && (
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{
            opacity: monkeyClawForgeOpacity,
            transform: `scale(${0.985 + projectPhase * 0.035})`,
            filter: `blur(${clamp01((projectPhase - 0.94) / 0.06) * 14}px)`,
          }}
        >
          <MonkeyClawGrabCanvas progress={projectPhase} className="h-full w-full" />
        </div>
      )}

      {project.id === "monkeyclaw" && shouldMountArtifact && (
        <div
          className="pointer-events-none absolute inset-0 z-[12]"
          style={{ opacity: monkeyClawForgeOpacity }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(5,5,7,0.78) 0%, rgba(5,5,7,0.2) 32%, transparent 50%, rgba(5,5,7,0.18) 67%, rgba(5,5,7,0.74) 100%), linear-gradient(0deg, rgba(5,5,7,0.78) 0%, transparent 26%, transparent 76%, rgba(5,5,7,0.45) 100%)",
            }}
          />
          <div
            className="absolute left-[clamp(1.25rem,5vw,4.5rem)] top-[14vh] w-[min(31vw,430px)] max-md:left-5 max-md:right-5 max-md:top-20 max-md:w-auto"
            style={{
              transform: `translateY(${(1 - monkeyBeatProgress) * 8}px)`,
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: MONKEYCLAW_STAGES[monkeyBeatIndex]?.color ?? PROJECTS[0].accent.hex,
                  boxShadow: `0 0 20px ${MONKEYCLAW_STAGES[monkeyBeatIndex]?.color ?? PROJECTS[0].accent.hex}`,
                }}
              />
              <span className="font-ui text-[10px] text-[rgba(245,245,247,0.72)]">
                MonkeyClaw / {monkeyBeat.label}
              </span>
            </div>
            <div className="mt-4 max-w-[13ch] font-h2 text-[clamp(2rem,3vw,3.05rem)] leading-[0.94] text-[var(--text-primary)] [text-wrap:balance] max-md:text-[clamp(2rem,10vw,3.8rem)] [@media(max-height:760px)]:text-[clamp(1.8rem,2.75vw,2.72rem)]">
              {monkeyBeat.title}
            </div>
            <p className="mt-4 max-w-[31ch] text-[0.84rem] leading-6 text-[rgba(245,245,247,0.76)] max-md:hidden [@media(max-height:760px)]:hidden">
              {monkeyBeat.body}
            </p>
            <div className="mt-4 flex max-w-sm items-center gap-2 max-md:hidden">
              <span
                className="h-px flex-1"
                style={{
                  background: `linear-gradient(90deg, ${PROJECTS[0].accent.hex}, transparent)`,
                }}
              />
              <span className="font-ui text-[9px] text-[rgba(245,245,247,0.62)]">
                {monkeyBeat.evidence}
              </span>
            </div>
          </div>

          <div className="absolute right-[clamp(1.25rem,5vw,4.5rem)] top-[16vh] w-[min(25vw,330px)] space-y-3 max-md:hidden">
            {MONKEYCLAW_STAGES.map((stage, index) => {
              const active = index <= monkeyBeatIndex;
              const current = index === monkeyBeatIndex;
              return (
                <div
                  key={stage.key}
                  className="flex items-center gap-3 py-1.5"
                  style={{
                    opacity: active ? 1 : 0.24,
                    transform: current ? "translateX(-10px)" : "translateX(0)",
                    transition: "transform 450ms var(--ease-act), opacity 450ms var(--ease-act)",
                  }}
                >
                  <span
                    className="relative h-8 w-8 rounded-full border"
                    style={{
                      borderColor: active ? stage.color : "rgba(255,255,255,0.14)",
                      background: active ? `${stage.color}18` : "rgba(255,255,255,0.03)",
                      boxShadow: current ? `0 0 32px ${stage.color}88` : "none",
                    }}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: stage.color }}
                    />
                  </span>
                  <span>
                    <span className="block font-ui text-[10px] text-[rgba(245,245,247,0.78)]">
                      {stage.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-[rgba(245,245,247,0.58)]">
                      {stage.desc}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="absolute inset-x-[clamp(1.25rem,6vw,5.5rem)] bottom-[7vh] grid grid-cols-8 gap-2 max-md:hidden">
            {MONKEYCLAW_GATES.map((gate, index) => {
              const active = index < monkeyGateCount;
              return (
                <div
                  key={gate}
                  className="min-h-12 pt-2 font-ui text-[9px] leading-tight"
                  style={{
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    opacity: active ? 0.92 : 0.34,
                    textShadow: active ? `0 0 16px ${PROJECTS[0].accent.hexHighlight}` : "none",
                  }}
                >
                  <span
                    className="mb-2 block h-1 rounded-full"
                    style={{
                      background: active
                        ? `linear-gradient(90deg, ${PROJECTS[0].accent.hexHighlight}, ${PROJECTS[0].accent.hex})`
                        : "rgba(255,255,255,0.12)",
                      boxShadow: active ? `0 0 18px ${PROJECTS[0].accent.hexHighlight}66` : "none",
                    }}
                  />
                  G{index + 1}. {gate}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* The living project artifact */}
      <button
        type="button"
        aria-label={`Open ${project.title}`}
        onClick={() => openProject(idx)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-cursor-label="EXPAND"
        className="group relative z-20 flex items-center justify-center rounded-full transition-transform duration-500"
        style={{
          pointerEvents: opacity > 0.3 ? "auto" : "none",
          width: "clamp(230px, 42vmin, 390px)",
          height: "clamp(230px, 42vmin, 390px)",
          transform: `scale(${hovered ? 1.04 : 1}) ${isOpen ? "scale(1.4)" : ""}`,
          background: `radial-gradient(circle at 50% 50%, ${project.accent.hex}18, transparent 64%)`,
          boxShadow: `0 0 90px ${project.accent.hex}30`,
        }}
      >
        {shouldMountArtifact && project.id !== "monkeyclaw" ? (
          <ProjectArtifact
            type={project.id as ProjectArtifactType}
            hovered={hovered}
            expanded={activeProject === idx}
          />
        ) : null}

        {project.id === "monkeyclaw" && (
          <div
            aria-hidden
            className="absolute inset-[-18%] rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${PROJECTS[0].accent.hex}20, transparent 55%), radial-gradient(circle at 50% 52%, ${PROJECTS[0].accent.hexHighlight}14, transparent 66%)`,
              boxShadow: `inset 0 0 80px rgba(0,240,255,0.1), 0 0 110px ${PROJECTS[0].accent.hex}24`,
            }}
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
