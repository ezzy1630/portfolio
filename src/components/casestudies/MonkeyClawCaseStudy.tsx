"use client";

/**
 * MonkeyClaw Case Study — Act 3 Execution Island #01
 *
 * Multi-agent AI security system. Red Team vs Blue Team.
 * 5-stage pipeline → 8-gate patch verifier → detection-as-pass philosophy.
 *
 * Accent: #FF375F (attack red) + #00F0FF (defense cyan).
 */

import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Cpu,
  Crosshair,
  FlaskConical,
  GitBranch,
  Shield,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MONKEYCLAW_GATES,
  MONKEYCLAW_STAGES,
  MONKEYCLAW_STATS,
  PROJECTS,
} from "@/lib/content";

const project = PROJECTS[0];
const ACCENT = project.accent.hex; // #FF375F
const ACCENT_HI = project.accent.hexHighlight; // #00F0FF

const STAGE_ICONS: Record<string, LucideIcon> = {
  red: Crosshair,
  judge: AlertTriangle,
  repro: FlaskConical,
  blue: Shield,
  purple: CheckCircle2,
};

export default function MonkeyClawCaseStudy() {
  const [activeGate, setActiveGate] = useState(0);

  // Scrubbing timeline: cycle 0..8 then reset to 0.
  useEffect(() => {
    const id = setInterval(() => {
      setActiveGate((g) => (g >= MONKEYCLAW_GATES.length ? 0 : g + 1));
    }, 680);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="case-study-content p-5 sm:p-6 md:p-10"
      style={
        {
          "--accent": ACCENT,
          "--accent-hi": ACCENT_HI,
        } as CSSProperties
      }
    >
      <div className="space-y-12">
        {/* ───────────── HEADER ───────────── */}
        <header className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="font-ui text-[var(--accent)]">/ {project.index}</span>
            <Badge
              variant="outline"
              className="max-w-full whitespace-normal text-left font-ui leading-relaxed border-[rgba(255,55,95,0.4)] bg-[rgba(255,55,95,0.08)] text-[var(--text-primary)]"
            >
              <Zap className="h-3 w-3 text-[var(--accent)]" />
              {project.badge}
            </Badge>
          </div>
          <h2
            className="font-h2 !text-[clamp(2.5rem,7vw,5rem)] text-[var(--text-primary)]"
            style={{ textShadow: `0 0 48px ${ACCENT}33` }}
          >
            MonkeyClaw
          </h2>
          <p className="font-body text-[var(--text-secondary)] max-w-2xl">
            {project.summary}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-[var(--text-secondary)]">
            <span>{project.category}</span>
            <span aria-hidden>·</span>
            <span>{project.year}</span>
            <span aria-hidden>·</span>
            <span>5 agents · 8 verification gates</span>
          </div>
        </header>

        <Separator className="bg-[rgba(255,55,95,0.15)]" />

        {/* ───────────── 5-STAGE PIPELINE ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={Workflow} label="Multi-Agent Pipeline" />
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
            A coordinated team of fine-tuned Nemotron agents. The Red agent
            probes; the Blue agent patches; the Purple agent verifies the patch
            holds under repro.
          </p>
          <div className="flex flex-col lg:flex-row items-stretch gap-2">
            {MONKEYCLAW_STAGES.map((stage, i) => {
              const Icon = STAGE_ICONS[stage.key] ?? Cpu;
              const wing =
                stage.key === "red" || stage.key === "judge"
                  ? "ATTACK"
                  : stage.key === "blue" || stage.key === "purple"
                    ? "DEFENSE"
                    : "BRIDGE";
              const wingColor =
                wing === "ATTACK"
                  ? ACCENT
                  : wing === "DEFENSE"
                    ? ACCENT_HI
                    : "#BF5AF2";
              return (
                <div key={stage.key} className="flex flex-1 items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="group relative flex-1 rounded-xl p-4 cursor-help"
                        style={{
                          background: `linear-gradient(160deg, ${stage.color}14, ${stage.color}05)`,
                          border: `1px solid ${stage.color}44`,
                          boxShadow: `0 0 28px ${stage.color}12`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="font-ui text-[10px]"
                            style={{ color: stage.color }}
                          >
                            STAGE {String(i + 1).padStart(2, "0")}
                          </span>
                          <Icon
                            className="h-4 w-4"
                            style={{ color: stage.color }}
                          />
                        </div>
                        <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                          {stage.name}
                        </div>
                        <div className="font-ui text-[10px] text-[var(--text-secondary)] mb-3">
                          {stage.role}
                        </div>
                        <span
                          className="font-ui text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            background: `${wingColor}22`,
                            color: wingColor,
                          }}
                        >
                          {wing}
                        </span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-[240px] bg-[#0a0a0f] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)]"
                    >
                      <span className="block">
                        <span
                          className="font-ui text-[10px]"
                          style={{ color: stage.color }}
                        >
                          {stage.name.toUpperCase()} · {stage.role.toUpperCase()}
                        </span>
                        <span className="block mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                          {stage.desc}
                        </span>
                      </span>
                    </TooltipContent>
                  </Tooltip>

                  {i < MONKEYCLAW_STAGES.length - 1 && (
                    <div
                      className="flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <div
                        className="h-px w-5 lg:w-3"
                        style={{
                          background: `linear-gradient(90deg, ${stage.color}, ${MONKEYCLAW_STAGES[i + 1].color})`,
                        }}
                      />
                      <svg width="7" height="8" viewBox="0 0 7 8" className="-ml-px">
                        <path
                          d="M0 0 L7 4 L0 8 Z"
                          fill={MONKEYCLAW_STAGES[i + 1].color}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ───────────── 8-GATE PATCH VERIFIER ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={CheckCircle2} label="8-Gate Patch Verifier" />
          <div className="rounded-xl p-5 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-ui text-[10px] text-[var(--text-secondary)]">
                DETECTION-AS-PASS TIMELINE
              </span>
              <span className="font-ui text-[10px] text-[var(--accent-hi)]">
                {activeGate >= MONKEYCLAW_GATES.length
                  ? "VERIFIED ✓"
                  : `GATE ${activeGate + 1}/${MONKEYCLAW_GATES.length}`}
              </span>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {MONKEYCLAW_GATES.map((gate, i) => {
                const lit = i < activeGate;
                const active = i === activeGate;
                return (
                  <motion.div
                    key={gate}
                    animate={{
                      opacity: lit || active ? 1 : 0.32,
                      scale: active ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-lg p-2 flex flex-col items-center justify-center gap-1 min-h-[76px]"
                    style={{
                      background: lit
                        ? `${ACCENT_HI}14`
                        : active
                          ? `${ACCENT}1c`
                          : "rgba(255,255,255,0.02)",
                      border: `1px solid ${
                        lit
                          ? `${ACCENT_HI}55`
                          : active
                            ? `${ACCENT}90`
                            : "rgba(255,255,255,0.06)"
                      }`,
                      boxShadow: active
                        ? `0 0 22px ${ACCENT}66`
                        : lit
                          ? `0 0 10px ${ACCENT_HI}22`
                          : "none",
                    }}
                  >
                    <span className="font-ui text-[9px] text-[var(--text-secondary)]">
                      G{i + 1}
                    </span>
                    {lit ? (
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        style={{ color: ACCENT_HI }}
                      />
                    ) : active ? (
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <Zap className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                      </motion.div>
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-[rgba(255,255,255,0.15)]" />
                    )}
                    <span className="font-ui text-[8px] text-center leading-tight text-[var(--text-primary)]">
                      {gate}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* progress bar */}
            <div className="mt-4 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_HI})`,
                }}
                animate={{
                  width: `${(activeGate / MONKEYCLAW_GATES.length) * 100}%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </section>

        {/* ───────────── STATS GRID ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={Cpu} label="Telemetry" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MONKEYCLAW_STATS.map((stat) => (
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

        {/* ───────────── DETECTION-AS-PASS CALLOUT ───────────── */}
        <section>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-xl p-6 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}12, ${ACCENT_HI}08)`,
              border: `1px solid ${ACCENT}33`,
              borderLeft: `3px solid ${ACCENT}`,
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="rounded-lg p-2.5 shrink-0"
                style={{
                  background: `${ACCENT}22`,
                  border: `1px solid ${ACCENT}44`,
                }}
              >
                <Bug className="h-5 w-5" style={{ color: ACCENT }} />
              </div>
              <div className="space-y-2 min-w-0">
                <h3 className="font-ui text-sm text-[var(--text-primary)]">
                  DETECTION-AS-PASS
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
                  A patch is only considered verified when the Purple agent&apos;s
                  detector{" "}
                  <span className="text-[var(--text-primary)]">
                    actively fires
                  </span>{" "}
                  on the reproduction harness AND runtime telemetry confirms{" "}
                  <span className="text-[var(--text-primary)]">
                    zero regression
                  </span>
                  . A silent detector is a failure — the system must prove the
                  attack surface is closed, not merely absent.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className="font-ui text-[10px] px-2 py-1 rounded"
                    style={{ background: `${ACCENT}18`, color: ACCENT }}
                  >
                    DETECTOR FIRES ✓
                  </span>
                  <span
                    className="font-ui text-[10px] px-2 py-1 rounded"
                    style={{ background: `${ACCENT_HI}18`, color: ACCENT_HI }}
                  >
                    NO REGRESSION ✓
                  </span>
                  <span
                    className="font-ui text-[10px] px-2 py-1 rounded bg-[rgba(191,90,242,0.18)] text-[#BF5AF2]"
                  >
                    TELEMETRY LIVE ✓
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
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
