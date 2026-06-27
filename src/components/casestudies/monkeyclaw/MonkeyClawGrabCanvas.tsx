"use client";

/**
 * Scroll-driven MonkeyClaw forge for the Act 3 main island.
 *
 * This intentionally has no requestAnimationFrame loop. Every visual state is a
 * deterministic projection of scroll progress so the claw only descends, grabs,
 * forms the wordmark, and releases while the user scrolls through MonkeyClaw.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFluidStore } from "@/lib/store";

const WORD = "MONKEYCLAW";
const GLYPHS = [
  "exploit",
  "patch",
  "verify",
  "gate",
  "{}",
  "()",
  "=>",
  "fn",
  "let",
  "async",
  "struct",
  "impl",
  "def",
  "match",
  "await",
  "pub",
  "mut",
  "LoRA",
  "MCP",
  "repro",
  "telemetry",
] as const;

const ACCENT = "#FF375F";
const ACCENT_HI = "#00F0FF";
const INK = "#f5f5f7";
const STAGES = [
  { name: "RED", role: "attack", color: ACCENT },
  { name: "JUDGE", role: "score", color: "#FFB340" },
  { name: "REPRO", role: "lock", color: "#BF5AF2" },
  { name: "BLUE", role: "patch", color: ACCENT_HI },
  { name: "PURPLE", role: "verify", color: "#5E5CE6" },
] as const;
const GATES = [
  "attack blocked",
  "patch applied",
  "build green",
  "1000+ tests",
  "detection fires",
  "telemetry live",
  "no regression",
  "signed off",
] as const;

const PH = {
  descend: [0.04, 0.28],
  grab: [0.28, 0.38],
  lift: [0.38, 0.49],
  form: [0.49, 0.66],
  hold: [0.66, 0.78],
  release: [0.78, 0.93],
  rest: [0.93, 1.0],
} as const;

type SeedParticle = {
  ox: number;
  oy: number;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  text: string;
  hue: number;
  spin: number;
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const phase = (t: number, [a, b]: readonly [number, number]) =>
  clamp((t - a) / (b - a));

function createRandom(seed = 1337) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function smoothWindow(t: number, fadeIn = 0.08, fadeOut = 0.86) {
  const enter = clamp(t / fadeIn);
  const exit = clamp((1 - t) / (1 - fadeOut));
  return easeInOut(Math.min(enter, exit));
}

function buildSeeds(count: number, seed: number): SeedParticle[] {
  const rand = createRandom(seed);
  return Array.from({ length: count }, (_, i) => ({
    ox: (rand() - 0.5) * 2,
    oy: (rand() - 0.5) * 2,
    angle: rand() * Math.PI * 2,
    radius: 42 + rand() * 84,
    speed: 0.6 + rand() * 2.6,
    size: 8 + rand() * 8,
    text: GLYPHS[Math.floor(rand() * GLYPHS.length)],
    hue: rand(),
    spin: (rand() - 0.5) * 1.4 + i * 0.012,
  }));
}

export default function MonkeyClawGrabCanvas({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const seeds = useMemo(() => buildSeeds(148, 871), []);
  const shatterSeeds = useMemo(() => buildSeeds(120, 1771), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const wordMetrics = () => {
      const fontSize = clamp(Math.min(width / 8.2, height * 0.2), 36, 120);
      ctx.font = `700 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
      const totalW = ctx.measureText(WORD).width;
      return {
        fontSize,
        totalW,
        startX: (width - totalW) / 2,
        y: height * 0.5,
      };
    };

    const letterCenters = () => {
      const metrics = wordMetrics();
      ctx.font = `700 ${metrics.fontSize}px "Space Grotesk", system-ui, sans-serif`;
      const out: { x: number; y: number; w: number }[] = [];
      let x = metrics.startX;
      for (const ch of WORD) {
        const charWidth = ctx.measureText(ch).width;
        out.push({ x: x + charWidth / 2, y: metrics.y, w: charWidth });
        x += charWidth;
      }
      return out;
    };

    const drawWord = (t: number, baseAlpha: number) => {
      const metrics = wordMetrics();
      ctx.font = `700 ${metrics.fontSize}px "Space Grotesk", system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      let x = metrics.startX;
      for (let i = 0; i < WORD.length; i++) {
        const ch = WORD[i];
        const charWidth = ctx.measureText(ch).width;
        const appearStart =
          PH.form[0] + (i / WORD.length) * (PH.form[1] - PH.form[0]) * 0.72;
        const appear = easeOut(phase(t, [appearStart, appearStart + 0.05]));
        const releaseStart = PH.release[0] + (i / WORD.length) * 0.05;
        const release = easeIn(phase(t, [releaseStart, releaseStart + 0.1]));
        const alpha = appear * (1 - release) * baseAlpha;

        if (alpha > 0.01) {
          const shimmer = Math.sin((t * 3.2 + i * 0.13) * Math.PI * 2) * 0.5 + 0.5;
          const gradient = ctx.createLinearGradient(x, 0, x + charWidth, 0);
          gradient.addColorStop(0, shimmer > 0.5 ? ACCENT : ACCENT_HI);
          gradient.addColorStop(1, shimmer > 0.5 ? ACCENT_HI : ACCENT);
          ctx.fillStyle = gradient;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = shimmer > 0.5 ? ACCENT : ACCENT_HI;
          ctx.shadowBlur = 14 * alpha;
          ctx.fillText(ch, x, metrics.y);
        }

        x += charWidth;
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const drawGlyph = (
      seed: SeedParticle,
      x: number,
      y: number,
      alpha: number,
      scale = 1,
      rotation = 0,
    ) => {
      if (alpha <= 0.01) return;
      const color = seed.hue > 0.5 ? ACCENT : ACCENT_HI;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, seed.size * scale * 0.54, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.34;
      ctx.font = `600 ${seed.size * scale * 1.04}px ui-monospace, "SF Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(seed.text, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const drawClaw = (x: number, y: number, open: number, alpha: number) => {
      const prong = Math.min(width, height) * 0.055;
      const spread = lerp(0.12, 0.95, open);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(0, -prong * 1.45);
      ctx.lineTo(0, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-6, -prong * 1.45);
      ctx.lineTo(6, -prong * 1.45);
      ctx.stroke();

      const tipX = Math.sin(spread) * prong;
      const tipY = Math.cos(spread) * prong;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(tipX * 0.72, tipY * 0.35, tipX, tipY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-tipX * 0.72, tipY * 0.35, -tipX, tipY);
      ctx.stroke();

      ctx.shadowBlur = 14;
      ctx.fillStyle = ACCENT_HI;
      ctx.beginPath();
      ctx.arc(0, 0, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawFocusWell = (t: number, alpha: number) => {
      const cx = width * 0.5;
      const cy = height * 0.48;
      const radius = Math.min(width, height) * 0.255;

      ctx.save();
      ctx.globalAlpha = alpha;

      const well = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius * 1.32);
      well.addColorStop(0, "rgba(5,5,7,0.18)");
      well.addColorStop(0.55, "rgba(0,240,255,0.09)");
      well.addColorStop(0.82, "rgba(255,55,95,0.11)");
      well.addColorStop(1, "rgba(5,5,7,0)");
      ctx.fillStyle = well;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 4; i++) {
        const p = (i + 1) / 4;
        ctx.strokeStyle =
          i % 2 === 0 ? "rgba(255,55,95,0.16)" : "rgba(0,240,255,0.13)";
        ctx.lineWidth = i === 0 ? 1.2 : 0.8;
        ctx.setLineDash([8 + i * 3, 18 + i * 5]);
        ctx.lineDashOffset = -t * 80 * (i + 1);
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          radius * (0.58 + p * 0.46),
          radius * (0.42 + p * 0.34),
          t * 0.6 + i * 0.28,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.restore();
    };

    const drawSecurityField = (t: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        height * 0.08,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.74,
      );
      vignette.addColorStop(0, "rgba(0,240,255,0.08)");
      vignette.addColorStop(0.38, "rgba(255,55,95,0.055)");
      vignette.addColorStop(1, "rgba(5,5,7,0)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      for (let i = 0; i < 13; i++) {
        const y = ((i / 18) * height + t * 120) % height;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(255,55,95,0.026)" : "rgba(0,240,255,0.024)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + Math.sin(i + t * 4) * 26);
        ctx.stroke();
      }

      ctx.font = `500 ${clamp(width / 102, 9, 13)}px ui-monospace, "SF Mono", monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let i = 0; i < 18; i++) {
        const side = i % 2 === 0 ? 0.04 : 0.8;
        const x = width * side + Math.sin(i * 1.7 + t * 5) * width * 0.04;
        const y = ((i * 47 + t * 260) % (height + 120)) - 60;
        const color = i % 3 === 0 ? ACCENT : i % 3 === 1 ? ACCENT_HI : "#BF5AF2";
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * (0.026 + (i % 4) * 0.012);
        ctx.fillText(`${GLYPHS[i % GLYPHS.length]} :: ${GATES[i % GATES.length]}`, x, y);
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const drawPipeline = (t: number, alpha: number) => {
      const railY = height * 0.82;
      const startX = width * 0.17;
      const endX = width * 0.83;
      const active = clamp((t - 0.12) / 0.78);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.moveTo(startX, railY);
      ctx.lineTo(endX, railY);
      ctx.stroke();

      const gradient = ctx.createLinearGradient(startX, 0, endX, 0);
      gradient.addColorStop(0, ACCENT);
      gradient.addColorStop(0.45, "#BF5AF2");
      gradient.addColorStop(1, ACCENT_HI);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, railY);
      ctx.lineTo(lerp(startX, endX, active), railY);
      ctx.stroke();

      STAGES.forEach((stage, i) => {
        const x = lerp(startX, endX, i / (STAGES.length - 1));
        const lit = active >= i / (STAGES.length - 1) - 0.03;
        const pulse = lit ? 1 + Math.sin(t * 18 + i) * 0.12 : 1;

        ctx.fillStyle = lit ? stage.color : "rgba(255,255,255,0.08)";
        ctx.shadowColor = stage.color;
        ctx.shadowBlur = lit ? 18 : 0;
        ctx.globalAlpha = alpha * (lit ? 0.95 : 0.36);
        ctx.beginPath();
        ctx.arc(x, railY, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.font = `700 ${clamp(width / 108, 9, 12)}px "Space Grotesk", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = lit ? INK : "rgba(245,245,247,0.36)";
        ctx.globalAlpha = alpha * (lit ? 0.92 : 0.42);
        ctx.fillText(stage.name, x, railY + 28);
        ctx.font = `500 ${clamp(width / 128, 8, 10)}px ui-monospace, "SF Mono", monospace`;
        ctx.fillText(stage.role, x, railY + 45);
      });

      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const drawGateConstellation = (t: number, alpha: number) => {
      const active = clamp((t - PH.hold[0]) / (PH.rest[0] - PH.hold[0]));
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${clamp(width / 122, 8, 11)}px ui-monospace, "SF Mono", monospace`;

      for (let i = 0; i < GATES.length; i++) {
        const a = (-Math.PI * 0.82) + (i / (GATES.length - 1)) * Math.PI * 1.64;
        const r = Math.min(width, height) * (0.27 + Math.sin(t * 5 + i) * 0.008);
        const x = width * 0.5 + Math.cos(a) * r;
        const y = height * 0.48 + Math.sin(a) * r * 0.72;
        const lit = active >= i / GATES.length;
        ctx.globalAlpha = alpha * (lit ? 0.82 : 0.2);
        ctx.fillStyle = lit ? ACCENT_HI : "rgba(255,255,255,0.28)";
        ctx.shadowColor = lit ? ACCENT_HI : "transparent";
        ctx.shadowBlur = lit ? 16 : 0;
        ctx.beginPath();
        ctx.arc(x, y, lit ? 4.2 : 2.2, 0, Math.PI * 2);
        ctx.fill();

        if (i % 2 === 0 || lit) {
          ctx.globalAlpha = alpha * (lit ? 0.74 : 0.18);
          ctx.fillText(GATES[i], x, y + (i % 2 === 0 ? -18 : 18));
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      const t = reducedMotion ? 0.68 : clamp(progress);
      const globalAlpha = reducedMotion ? 1 : smoothWindow(t);
      const cx = width / 2;
      const bottomY = height * 0.72;
      const centerY = height * 0.48;

      ctx.clearRect(0, 0, width, height);
      drawSecurityField(t, globalAlpha);
      drawFocusWell(t, globalAlpha);

      const bg = ctx.createRadialGradient(cx, centerY, 6, cx, centerY, Math.max(width, height) * 0.55);
      bg.addColorStop(0, `rgba(255,55,95,${0.12 * globalAlpha})`);
      bg.addColorStop(0.45, `rgba(0,240,255,${0.07 * globalAlpha})`);
      bg.addColorStop(1, "rgba(5,5,7,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      drawPipeline(t, globalAlpha);
      drawGateConstellation(t, globalAlpha);

      let clawY = bottomY;
      let clawOpen = 0.62;
      let clawAlpha = globalAlpha;

      if (t < PH.descend[1]) {
        clawY = lerp(-height * 0.12, bottomY, easeOut(phase(t, PH.descend)));
      } else if (t < PH.grab[1]) {
        clawOpen = lerp(0.62, 0.08, easeIn(phase(t, PH.grab)));
      } else if (t < PH.lift[1]) {
        clawY = lerp(bottomY, centerY, easeInOut(phase(t, PH.lift)));
        clawOpen = 0.08;
      } else if (t < PH.form[1]) {
        const form = easeOut(phase(t, PH.form));
        clawY = lerp(centerY, centerY - height * 0.08, form);
        clawOpen = lerp(0.08, 0.7, form);
        clawAlpha = globalAlpha * (1 - form * 0.9);
      } else {
        clawAlpha = 0;
      }

      const gather = easeInOut(phase(t, [PH.descend[1], PH.grab[1]]));
      const lift = easeInOut(phase(t, PH.lift));
      const form = easeOut(phase(t, PH.form));
      const release = easeOut(phase(t, PH.release));
      const trailT = phase(t, PH.descend);

      for (let i = 0; i < seeds.length; i++) {
        const seed = seeds[i];
        const scatterX = cx + seed.ox * width * 0.44;
        const scatterY = height * (0.34 + seed.oy * 0.3);
        const gripX = cx + Math.cos(seed.angle) * seed.radius * 0.08;
        const gripY = bottomY + Math.sin(seed.angle) * seed.radius * 0.05;
        const liftedY = lerp(bottomY, centerY, lift) + Math.sin(seed.angle) * 6;
        const helix = seed.angle + seed.oy * 2.4 + t * 3.8;
        const formedX = cx + Math.sin(helix) * width * 0.17;
        const formedY = centerY + seed.oy * height * 0.28;

        let x = lerp(scatterX, gripX, gather);
        let y = lerp(scatterY, gripY, gather);
        if (t > PH.lift[0]) {
          x = lerp(x, cx + Math.cos(seed.angle) * 5, lift);
          y = lerp(y, liftedY, lift);
        }
        if (t > PH.form[0]) {
          x = lerp(x, formedX, form);
          y = lerp(y, formedY, form);
        }
        if (release > 0) {
          x += Math.cos(seed.angle) * seed.speed * release * 44;
          y += Math.sin(seed.angle) * seed.speed * release * 34;
        }

        const descendVisibility = i / seeds.length < trailT || t > PH.descend[1] ? 1 : 0;
        const alpha = descendVisibility * globalAlpha * (0.88 - release * 0.64) * (1 - form * 0.05);
        drawGlyph(seed, x, y, alpha, 1.22 - release * 0.22, seed.spin * (t + release));
      }

      if (release > 0) {
        const centers = letterCenters();
        for (let i = 0; i < shatterSeeds.length; i++) {
          const seed = shatterSeeds[i];
          const center = centers[i % centers.length];
          const delay = (i % WORD.length) / WORD.length * 0.16;
          const burst = easeOut(clamp((phase(t, PH.release) - delay) / 0.84));
          const x = center.x + Math.cos(seed.angle) * seed.radius * burst;
          const y = center.y + Math.sin(seed.angle) * seed.radius * burst * 0.72 - burst * 18;
          drawGlyph(seed, x, y, globalAlpha * burst * (1 - release) * 0.95, 0.84, seed.spin + burst);
        }
      }

      drawWord(t, globalAlpha * 0.08);

      if (clawAlpha > 0.01) {
        drawClaw(cx, clawY, clawOpen, clawAlpha);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    draw();

    return () => ro.disconnect();
  }, [progress, reducedMotion, seeds, shatterSeeds]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Scroll-driven MonkeyClaw claw forging the project name from code glyphs"
      className={className}
      style={{ display: "block" }}
    />
  );
}
