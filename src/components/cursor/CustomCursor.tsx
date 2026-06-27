"use client";

import { useEffect, useRef, useState } from "react";
import { useFluidStore } from "@/lib/store";

type CursorState = "default" | "fluid" | "link" | "press";
const CURSOR_ROOT_CLASS = "has-custom-cursor";

const CURSOR_STYLE = {
  default: 12,
  fluid: 58,
  press: 48,
  link: 36,
  fluidOpacity: 0.26,
  fluidMidAlpha: 0.16,
  fluidOuterAlpha: 0,
} as const;

/**
 * Custom cursor with four states:
 *  - default: 12px white circle (mix-blend-difference)
 *  - fluid:   lower-range 58px blurred orb visualizing the fluid mouse force
 *  - link:    4px dot + text label ("View Project", "Copy Email"…)
 *  - press:   6px dot + 48px ring while pressing
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
  const stateRef = useRef<CursorState>("default");
  const labelRefState = useRef("");

  useEffect(() => {
    if (!enabled) return;

    const html = document.documentElement;
    html.classList.add(CURSOR_ROOT_CLASS);

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    let raf = 0;
    let lastMove = 0;

    const setCursorState = (nextState: CursorState, nextLabel = "") => {
      if (stateRef.current !== nextState) {
        stateRef.current = nextState;
        setState(nextState);
      }
      if (labelRefState.current !== nextLabel) {
        labelRefState.current = nextLabel;
        setLabel(nextLabel);
      }
    };

    const getInteractiveTarget = (node: EventTarget | null) => {
      if (!(node instanceof Element)) return null;
      return node.closest(
        "a, button, input, textarea, select, [role='button'], [role='link'], [role='textbox'], [data-cursor]",
      ) as HTMLElement | null;
    };

    const getCursorLabel = (el: HTMLElement | null) => {
      if (!el) return "";
      const explicit = el.getAttribute("data-cursor-label");
      if (explicit) return explicit;
      return (
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        (el.textContent || "").trim().slice(0, 28)
      );
    };

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      lastMove = performance.now();
      const el = getInteractiveTarget(e.target);
      if (el) {
        setCursorState("link", getCursorLabel(el));
      } else {
        setCursorState("fluid");
      }
    };

    const onPointerDown = () => setCursorState("press", labelRefState.current);

    const onPointerUp = (e: PointerEvent) => {
      const el = getInteractiveTarget(e.target);
      if (el) {
        setCursorState("link", getCursorLabel(el));
      } else {
        setCursorState(lastMove > 0 ? "fluid" : "default");
      }
    };

    const onLeaveWindow = () => setCursorState("default");

    const tick = () => {
      raf = requestAnimationFrame(tick);
      // if no movement for 1.2s, return to default
      if (
        performance.now() - lastMove > 1200 &&
        stateRef.current !== "link" &&
        stateRef.current !== "press"
      ) {
        if (stateRef.current !== "default") setCursorState("default");
      }
      const activeState = stateRef.current;
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
        labelRef.current.style.opacity = activeState === "link" && !!label ? "1" : "0";
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerleave", onLeaveWindow);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onLeaveWindow);
      html.classList.remove(CURSOR_ROOT_CLASS);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor-none-fine pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full transition-[width,height,background,filter,opacity] duration-300 ease-out"
        style={{
          willChange: "transform, width, height, opacity",
          width:
            state === "fluid"
              ? CURSOR_STYLE.fluid
              : state === "press"
                ? CURSOR_STYLE.press
                : state === "link"
                  ? CURSOR_STYLE.link
                  : CURSOR_STYLE.default,
          height:
            state === "fluid"
              ? CURSOR_STYLE.fluid
              : state === "press"
                ? CURSOR_STYLE.press
                : state === "link"
                  ? CURSOR_STYLE.link
                  : CURSOR_STYLE.default,
          background:
            state === "fluid"
              ? `radial-gradient(circle, rgba(0,240,255,${CURSOR_STYLE.fluidOpacity}), rgba(74,0,224,${CURSOR_STYLE.fluidMidAlpha}) 56%, transparent ${CURSOR_STYLE.fluidOuterAlpha * 100}%)`
              : state === "press"
                ? "rgba(245,245,247,0.94)"
                : "rgba(245,245,247,0.9)",
          filter: state === "fluid" ? "blur(4px)" : "blur(0)",
          mixBlendMode: state === "fluid" ? "screen" : "difference",
          opacity: state === "default" ? 0.9 : 1,
        }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 rounded-full bg-white"
        style={{
          willChange: "transform",
          width: state === "press" ? 6 : 4,
          height: state === "press" ? 6 : 4,
          mixBlendMode: "difference",
          opacity: state === "link" || state === "press" ? 1 : 0,
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
