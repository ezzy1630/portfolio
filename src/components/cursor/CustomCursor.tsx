"use client";

import { useEffect, useRef, useState } from "react";
import { useFluidStore } from "@/lib/store";

type CursorState = "default" | "fluid" | "link";

/**
 * Custom cursor with three states:
 *  - default: 12px white circle (mix-blend-difference)
 *  - fluid:   80px blurred orb visualizing the fluid mouse force
 *  - link:    4px dot + text label ("View Project", "Copy Email"…)
 *
 * Hidden on touch devices and reduced-motion (native cursor used).
 */
export default function CustomCursor() {
  const isTouch = useFluidStore((s) => s.isTouch);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const enabled = !isTouch && !reducedMotion;

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!enabled) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    let raf = 0;
    let lastMove = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      lastMove = performance.now();
      const el = (e.target as HTMLElement)?.closest(
        "a, button, [data-cursor], [role='button']"
      ) as HTMLElement | null;
      if (el) {
        setState("link");
        setLabel(el.getAttribute("data-cursor-label") || "");
      } else {
        setState("fluid");
        setLabel("");
      }
    };
    const onLeaveWindow = () => setState("default");

    const tick = () => {
      raf = requestAnimationFrame(tick);
      // if no movement for 1.2s, return to default
      if (performance.now() - lastMove > 1200 && state !== "link") {
        if (state !== "default") setState("default");
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      ring.x += (pos.x - ring.x) * 0.18;
      ring.y += (pos.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      if (labelRef.current) {
        labelRef.current.style.transform = `translate3d(${pos.x + 16}px, ${pos.y}px, 0) translateY(-50%)`;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeaveWindow);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveWindow);
      cancelAnimationFrame(raf);
    };
  }, [enabled, state]);

  if (!enabled) return null;

  return (
    <div className="cursor-none-fine pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full transition-[width,height,background,filter,opacity] duration-300 ease-out"
        style={{
          width: state === "fluid" ? 80 : state === "link" ? 36 : 12,
          height: state === "fluid" ? 80 : state === "link" ? 36 : 12,
          background:
            state === "fluid"
              ? "radial-gradient(circle, rgba(0,240,255,0.35), rgba(74,0,224,0.2) 60%, transparent 70%)"
              : "rgba(245,245,247,0.9)",
          filter: state === "fluid" ? "blur(4px)" : "blur(0)",
          mixBlendMode: state === "fluid" ? "normal" : "difference",
          opacity: state === "default" ? 0.9 : 1,
        }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 rounded-full bg-white"
        style={{
          width: 4,
          height: 4,
          mixBlendMode: "difference",
          opacity: state === "link" ? 1 : 0,
        }}
      />
      <span
        ref={labelRef}
        className="fixed top-0 left-0 font-ui text-[10px] text-[var(--text-primary)] whitespace-nowrap"
        style={{ opacity: state === "link" && label ? 1 : 0, transition: "opacity 0.2s" }}
      >
        {label}
      </span>
    </div>
  );
}
