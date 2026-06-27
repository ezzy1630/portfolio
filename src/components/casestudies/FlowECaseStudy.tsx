"use client";

/**
 * FlowE Case Study — Act 3 Execution Island #02
 *
 * iOS Student Productivity App — 300K+ LOC, solo.
 * - Animated LOC count-up
 * - High-fidelity SwiftUI phone mockup with 3D tilt
 * - Interactive hotspots (Brain Dump → structured tasks)
 * - Calendar integrations as connected nodes
 * - Production-hardened checklist
 *
 * Accent: #0A84FF (Apple Blue).
 */

import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Brain,
  Calendar,
  CheckCircle2,
  CloudOff,
  Database,
  GitBranch,
  ListChecks,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FLOWE_STATS, PROJECTS } from "@/lib/content";

const project = PROJECTS[1];
const ACCENT = project.accent.hex; // #0A84FF

/* Mock schedule shown inside the phone */
const SCHEDULE = [
  { time: "09:00", title: "CS 101 Lecture", loc: "Baskin Eng", color: ACCENT },
  { time: "11:30", title: "Math 19A Section", loc: "McHenry", color: "#5E5CE6" },
  { time: "14:00", title: "Gym — Sarah", loc: "OPERS", color: "#FF9F0A" },
  { time: "16:30", title: "FlowE sync sprint", loc: "Library", color: "#30D158" },
];

const INTEGRATIONS = [
  {
    name: "Canvas LMS",
    detail: "Assignments · due dates · grades",
    color: ACCENT,
  },
  {
    name: "EventKit",
    detail: "Native iOS calendar, bi-directional",
    color: "#FF375F",
  },
  {
    name: "Google Calendar",
    detail: "Cross-account scheduling",
    color: "#30D158",
  },
];

const PRODUCTION: {
  icon: LucideIcon;
  label: string;
  detail: string;
}[] = [
  {
    icon: CloudOff,
    label: "Fault-tolerant offline sync",
    detail: "circuit breaker · DLQ · exponential backoff",
  },
  {
    icon: Lock,
    label: "Certificate pinning",
    detail: "TLS mutual auth on every sync endpoint",
  },
  {
    icon: ShieldCheck,
    label: "JWT authentication",
    detail: "short-lived access tokens · refresh rotation",
  },
  {
    icon: Database,
    label: "GDPR compliant",
    detail: "user data export · right-to-erasure",
  },
];

/* The Brain Dump sentence that fractures into parsed task chips */
const BRAIN_DUMP_SENTENCE =
  "study for math midterm, gym with sarah at 6pm, buy groceries, finish flowe PR";

const PARSED_TASKS = [
  { label: "Study", detail: "Math Midterm", color: "#5E5CE6" },
  { label: "Gym", detail: "6pm · Sarah", color: "#FF9F0A" },
  { label: "Errand", detail: "Groceries", color: "#30D158" },
  { label: "Dev", detail: "FlowE PR", color: ACCENT },
];

type HotspotId = "brain" | "schedule" | "sync" | null;

export default function FlowECaseStudy() {
  const [count, setCount] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<HotspotId>(null);

  const target = 300_000;

  // Count-up to 300,000+ on mount (easeOutCubic, ~1.8s)
  useEffect(() => {
    const duration = 1800;
    const startTs = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="case-study-content p-5 sm:p-6 md:p-10"
      style={{ "--accent": ACCENT } as CSSProperties}
    >
      <div className="space-y-12">
        {/* ───────────── HEADER ───────────── */}
        <header className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="font-ui text-[var(--accent)]">/ {project.index}</span>
            <Badge
              variant="outline"
              className="max-w-full whitespace-normal text-left font-ui leading-relaxed border-[rgba(10,132,255,0.4)] bg-[rgba(10,132,255,0.08)] text-[var(--text-primary)]"
            >
              <Smartphone className="h-3 w-3 text-[var(--accent)]" />
              {project.badge}
            </Badge>
          </div>
          <h2
            className="font-h2 !text-[clamp(2.5rem,7vw,5rem)] text-[var(--text-primary)]"
            style={{ textShadow: `0 0 48px ${ACCENT}33` }}
          >
            FlowE
          </h2>
          <p className="font-body text-[var(--text-secondary)] max-w-2xl">
            {project.summary}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-[var(--text-secondary)]">
            <span>{project.category}</span>
            <span aria-hidden>·</span>
            <span>{project.year}</span>
            <span aria-hidden>·</span>
            <span>flowe.cc</span>
          </div>
        </header>

        <Separator className="bg-[rgba(10,132,255,0.15)]" />

        {/* ───────────── LOC COUNT-UP ───────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <motion.span
              className="font-mono font-bold text-[var(--text-primary)]"
              style={{
                fontSize: "clamp(2.75rem, 9vw, 5.5rem)",
                lineHeight: 1,
                textShadow: `0 0 32px ${ACCENT}33`,
              }}
            >
              {count >= target ? "300K+" : count.toLocaleString()}
            </motion.span>
            <span className="font-ui text-[var(--accent)]">LINES OF SWIFT</span>
          </div>
          <p className="font-body text-[var(--text-secondary)] max-w-2xl">
            100+ services.{" "}
            <span className="text-[var(--text-primary)]">One developer.</span> A
            constraint-based scheduling engine, a local-first AI layer, and
            bidirectional sync — all in a single SwiftUI binary.
          </p>
        </section>

        {/* ───────────── PHONE MOCKUP + HOTSPOTS ───────────── */}
        <section className="grid lg:grid-cols-[auto_1fr] gap-8 lg:gap-10 items-center">
          {/* Phone with floating 3D tilt */}
          <div className="relative mx-auto" style={{ perspective: "1400px" }}>
            <motion.div
              initial={{ rotateY: -18, rotateX: 8 }}
              animate={{ rotateY: -18, rotateX: 8 }}
              whileHover={{ rotateY: 0, rotateX: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <PhoneFrame />
            </motion.div>

            {/* Hotspots — pulsing dots */}
            <Hotspot
              top="20%"
              left="60%"
              id="brain"
              active={activeHotspot === "brain"}
              onClick={() =>
                setActiveHotspot(activeHotspot === "brain" ? null : "brain")
              }
            />
            <Hotspot
              top="46%"
              left="6%"
              id="schedule"
              active={activeHotspot === "schedule"}
              onClick={() =>
                setActiveHotspot(
                  activeHotspot === "schedule" ? null : "schedule",
                )
              }
            />
            <Hotspot
              top="80%"
              left="82%"
              id="sync"
              active={activeHotspot === "sync"}
              onClick={() =>
                setActiveHotspot(activeHotspot === "sync" ? null : "sync")
              }
            />
          </div>

          {/* Hotspot detail panel */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeHotspot === null && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                  <p className="font-ui text-[var(--text-secondary)]">
                    TAP A HOTSPOT TO EXPLORE
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-md">
                    Three interaction layers: a freeform{" "}
                    <span className="text-[var(--text-primary)]">Brain Dump</span>{" "}
                    that structures itself, a{" "}
                    <span className="text-[var(--text-primary)]">
                      constraint scheduler
                    </span>
                    , and{" "}
                    <span className="text-[var(--text-primary)]">
                      bidirectional sync
                    </span>{" "}
                    across three calendar providers.
                  </p>
                </motion.div>
              )}

              {activeHotspot === "brain" && <BrainDumpPanel key="brain" />}

              {activeHotspot === "schedule" && (
                <DetailPanel
                  key="schedule"
                  title="Constraint-Based Scheduler"
                  icon={Calendar}
                >
                  A temporal task graph treats every commitment as a constraint
                  node. The engine resolves dependencies, travel-time buffers,
                  and energy budgets — then proposes an optimal week, not just a
                  list.
                </DetailPanel>
              )}

              {activeHotspot === "sync" && (
                <DetailPanel key="sync" title="Bidirectional Sync" icon={Wifi}>
                  Three calendar providers reconciled into a single source of
                  truth. Conflict resolution by last-writer-wins with vector
                  clocks; offline mutations queue locally and merge on reconnect.
                </DetailPanel>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ───────────── STATS GRID ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={ListChecks} label="By the Numbers" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FLOWE_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)]"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="font-ui text-[10px] text-[var(--accent)]">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <div className="font-ui text-[10px] text-[var(--text-secondary)] mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── CALENDAR INTEGRATIONS ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={Calendar} label="Calendar Integrations" />
          <div className="relative rounded-xl p-6 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)]">
            {/* connecting rail */}
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              {INTEGRATIONS.map((ig, i) => (
                <div key={ig.name} className="flex flex-1 items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex-1 rounded-xl p-4"
                    style={{
                      background: `${ig.color}10`,
                      border: `1px solid ${ig.color}40`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: ig.color,
                          boxShadow: `0 0 10px ${ig.color}`,
                        }}
                      />
                      <span className="font-ui text-[10px] text-[var(--text-secondary)]">
                        SOURCE {i + 1}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-[var(--text-primary)] mb-1">
                      {ig.name}
                    </div>
                    <div className="font-ui text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      {ig.detail}
                    </div>
                  </motion.div>

                  {i < INTEGRATIONS.length - 1 && (
                    <div
                      className="flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <ArrowRight
                        className="h-4 w-4 text-[var(--text-secondary)] rotate-90 md:rotate-0"
                        style={{ color: ACCENT }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* FlowE hub node */}
            <div className="mt-5 flex items-center justify-center">
              <div
                className="flex items-center gap-2 rounded-full px-5 py-2.5"
                style={{
                  background: `${ACCENT}14`,
                  border: `1px solid ${ACCENT}50`,
                  boxShadow: `0 0 24px ${ACCENT}22`,
                }}
              >
                <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
                <span className="font-ui text-[11px] text-[var(--text-primary)]">
                  FLOWE — UNIFIED GRAPH
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── PRODUCTION-HARDENED ───────────── */}
        <section className="space-y-5 pb-4">
          <SectionLabel icon={ShieldCheck} label="Production-Hardened" />
          <div className="grid sm:grid-cols-2 gap-3">
            {PRODUCTION.map(({ icon: Icon, label, detail }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-3 rounded-xl p-4 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)]"
              >
                <CheckCircle2
                  className="h-4 w-4 mt-0.5 shrink-0"
                  style={{ color: ACCENT }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {label}
                    </span>
                  </div>
                  <div className="font-ui text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    {detail}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ───────────── TECH STACK ───────────── */}
        <section className="space-y-4 pb-4">
          <SectionLabel icon={GitBranch} label="Tech Stack" />
          <div className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <span
                key={s}
                className="rounded-full px-3 py-1.5 font-ui text-[var(--text-primary)] text-[11px]"
                style={{
                  background: `${ACCENT}0c`,
                  border: `1px solid ${ACCENT}33`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ───────────── phone mockup ───────────── */

function PhoneFrame() {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: 280,
        height: 560,
        borderRadius: 42,
        background:
          "linear-gradient(160deg, #1a1a22 0%, #0a0a0f 60%, #050507 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(10,132,255,0.15), inset 0 0 0 2px rgba(0,0,0,0.4)",
        padding: 8,
      }}
    >
      {/* notch */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-3 z-20"
        style={{
          width: 90,
          height: 22,
          borderRadius: 999,
          background: "#000",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />
      {/* screen */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: 34,
          background:
            "linear-gradient(180deg, #07070b 0%, #0c0c14 100%)",
        }}
      >
        <FlowEScreen />
      </div>
    </div>
  );
}

function FlowEScreen() {
  return (
    <div className="flex flex-col h-full text-[var(--text-primary)]">
      {/* status bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-mono text-[var(--text-secondary)]">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="tracking-tighter">●●●</span>
          <Wifi className="h-2.5 w-2.5" />
          <span>100</span>
        </span>
      </div>

      {/* header */}
      <div className="px-5 pt-6 pb-3">
        <div className="font-ui text-[9px] text-[var(--text-secondary)] mb-1">
          TUE · MAR 12 · WEEK 11
        </div>
        <div className="text-2xl font-bold tracking-tight">Today</div>
      </div>

      {/* Brain Dump input */}
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: `${ACCENT}12`,
            border: `1px solid ${ACCENT}33`,
          }}
        >
          <Brain className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          <span className="text-[11px] text-[var(--text-secondary)]">
            dump your brain…
          </span>
        </div>
      </div>

      {/* schedule list */}
      <div className="px-5 flex-1 space-y-2 overflow-hidden">
        <div className="font-ui text-[9px] text-[var(--text-secondary)] py-1">
          SCHEDULE
        </div>
        {SCHEDULE.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2.5 rounded-lg p-2"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="h-8 w-1 rounded-full shrink-0"
              style={{ background: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">
                {item.title}
              </div>
              <div className="font-ui text-[8px] text-[var(--text-secondary)]">
                {item.loc}
              </div>
            </div>
            <div className="font-mono text-[10px] text-[var(--text-secondary)]">
              {item.time}
            </div>
          </div>
        ))}
      </div>

      {/* tab bar */}
      <div
        className="flex items-center justify-around px-5 py-3 mt-2"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5,5,7,0.6)",
        }}
      >
        {[
          { icon: Calendar, active: true },
          { icon: ListChecks, active: false },
          { icon: Brain, active: false },
          { icon: Bell, active: false },
        ].map((tab, i) => (
          <tab.icon
            key={i}
            className="h-4 w-4"
            style={{
              color: tab.active ? ACCENT : "var(--text-secondary)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────── hotspot ───────────── */

function Hotspot({
  top,
  left,
  id,
  active,
  onClick,
}: {
  top: string;
  left: string;
  id: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Inspect ${id}`}
      aria-pressed={active}
      onClick={onClick}
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group"
      style={{ top, left }}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: `${ACCENT}40` }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <span
          className="relative h-2.5 w-2.5 rounded-full"
          style={{
            background: ACCENT,
            boxShadow: `0 0 12px ${ACCENT}, 0 0 24px ${ACCENT}66`,
            transform: active ? "scale(1.4)" : "scale(1)",
            transition: "transform 0.2s",
          }}
        />
      </span>
    </button>
  );
}

/* ───────────── Brain Dump panel ───────────── */

function BrainDumpPanel() {
  return (
    <motion.div
      key="brain"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-ui text-[11px] text-[var(--text-primary)]">
          BRAIN DUMP → STRUCTURED TASKS
        </span>
      </div>

      {/* raw sentence */}
      <div
        className="rounded-xl p-4 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)]"
      >
        <div className="font-ui text-[9px] text-[var(--text-secondary)] mb-2">
          FREEFORM INPUT
        </div>
        <p className="font-mono text-sm text-[var(--text-secondary)] leading-relaxed">
          &ldquo;{BRAIN_DUMP_SENTENCE}&rdquo;
        </p>
      </div>

      {/* parsing arrow */}
      <div className="flex items-center gap-2 pl-2">
        <motion.span
          className="font-ui text-[10px] text-[var(--accent)]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          PARSING WITH LOCAL LLM…
        </motion.span>
        <ArrowRight className="h-3 w-3 text-[var(--accent)]" />
      </div>

      {/* parsed chips */}
      <motion.div
        className="flex flex-wrap gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
        }}
      >
        {PARSED_TASKS.map((task) => (
          <motion.span
            key={task.label}
            variants={{
              hidden: { opacity: 0, y: 8, scale: 0.9 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="rounded-lg px-3 py-2"
            style={{
              background: `${task.color}14`,
              border: `1px solid ${task.color}44`,
            }}
          >
            <span
              className="font-ui text-[9px] mr-1.5"
              style={{ color: task.color }}
            >
              {task.label.toUpperCase()}
            </span>
            <span className="text-xs text-[var(--text-primary)]">
              {task.detail}
            </span>
          </motion.span>
        ))}
      </motion.div>

      <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
        A bundled Apple Intelligence model parses intent, extracts temporal
        anchors, and routes each fragment into the constraint graph — no round
        trip to the cloud.
      </p>
    </motion.div>
  );
}

/* ───────────── generic detail panel ───────────── */

function DetailPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-ui text-[11px] text-[var(--text-primary)]">
          {title.toUpperCase()}
        </span>
      </div>
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-md">
        {children}
      </p>
    </motion.div>
  );
}

/* ───────────── helpers ───────────── */

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
      <span className="font-ui text-[11px] text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}
