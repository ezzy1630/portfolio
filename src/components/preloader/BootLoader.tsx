"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./BootLoader.module.css";

const BOOT_MESSAGES = [
  "Booting EzzyOS v1.0...",
  "Mounting /portfolio/kernel...",
  "Allocating GPU memory buffers...",
  "Compiling GLSL fluid shaders...",
  "Warming half-float render targets...",
  "Fetching MonkeyClaw vector index...",
  "Hydrating FlowE scheduling graph...",
  "Loading Argyph symbol cache...",
  "Initializing Lenis smooth scroll...",
  "Binding pointer velocity uniforms...",
  "Preparing terminal contact transport...",
  "Checking WebGPU adapter availability...",
  "Falling back to WebGL2 FBO path if needed...",
  "Seeding liquid metal density field...",
  "Synchronizing scroll-linked acts...",
];

interface BootLoaderProps {
  progress: number;
  onComplete: () => void;
}

function formatTimestamp(ticks: number) {
  return (ticks / 1000).toFixed(3).padStart(6, " ");
}

function clampProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(100, progress));
}

export default function BootLoader({ progress, onComplete }: BootLoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef(false);
  const messageIndex = useRef(0);
  const ticks = useRef(1);
  const reactId = useId();
  const [logs, setLogs] = useState<string[]>([
    `[ ${formatTimestamp(1)} ] Booting EzzyOS v1.0...`,
  ]);

  const safeProgress = clampProgress(progress);
  const roundedProgress = Math.round(safeProgress);
  const bootId = useMemo(
    () => reactId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase(),
    [reactId],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (completeRef.current) return;
      ticks.current += 97 + Math.floor(Math.random() * 63);
      messageIndex.current = (messageIndex.current + 1) % BOOT_MESSAGES.length;
      const message = BOOT_MESSAGES[messageIndex.current];
      setLogs((current) => [
        ...current.slice(-38),
        `[ ${formatTimestamp(ticks.current)} ] ${message}`,
      ]);
    }, 140);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (safeProgress < 100 || completeRef.current) return;

    completeRef.current = true;
    ticks.current += 112;
    setLogs((current) => [
      ...current.slice(-38),
      `[ ${formatTimestamp(ticks.current)} ] Asset loader reported 100%`,
      "[ OK    ] System ready. Welcome.",
    ]);

    const animation = gsap.to(rootRef.current, {
      opacity: 0,
      filter: "blur(20px)",
      scale: 1.05,
      duration: 0.8,
      delay: 0.24,
      ease: "power2.inOut",
      onComplete,
    });

    return () => {
      animation.kill();
    };
  }, [onComplete, safeProgress]);

  return (
    <div
      ref={rootRef}
      className={styles.overlay}
      style={{ opacity: 1, filter: "blur(0px)", transform: "scale(1)" }}
      role="status"
      aria-live="polite"
      aria-label={`Loading portfolio, ${roundedProgress} percent complete`}
    >
      <div className={styles.terminal}>
        <div className={styles.titlebar}>
          <span>ezzyos:{bootId} /dev/portfolio</span>
          <span className={styles.lights} aria-hidden>
            <span className={styles.light} />
            <span className={styles.light} />
            <span className={styles.light} />
          </span>
        </div>

        <div ref={bodyRef} className={styles.body}>
          {logs.map((line, index) => {
            const isLast = index === logs.length - 1;
            const isOk = line.startsWith("[ OK");
            return (
              <div
                key={`${line}-${index}`}
                className={`${styles.line} ${isOk ? styles.ok : ""}`}
              >
                {line}
                {isLast && <span className={styles.cursor}>█</span>}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.track} aria-hidden>
            <div
              className={styles.bar}
              style={{ width: `${roundedProgress}%` }}
            />
          </div>
          <span>{roundedProgress.toString().padStart(3, "0")}%</span>
        </div>
      </div>
    </div>
  );
}
