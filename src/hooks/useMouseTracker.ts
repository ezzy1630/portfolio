"use client";

import { useEffect, useRef } from "react";
import { useFluidStore } from "@/lib/store";

/**
 * Global pointer tracker. Updates normalized position (-1..1) and
 * per-frame velocity (delta) into the fluid store. The fluid shader
 * reads these to inject mouse forces.
 */
export function useMouseTracker(enabled: boolean) {
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const raf = useRef<number>(0);
  const next = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      next.current = { x: nx, y: ny };
      if (!last.current) {
        last.current = { x: nx, y: ny, t: performance.now() };
      }
    };

    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      if (!next.current) return;
      const now = performance.now();
      const dt = Math.max(1, now - (last.current?.t ?? now));
      const px = (last.current?.x ?? next.current.x) as number;
      const py = (last.current?.y ?? next.current.y) as number;
      const dx = (next.current.x - px) / dt;
      const dy = (next.current.y - py) / dt;
      useFluidStore.getState().setMouse(next.current.x, next.current.y, dx, dy);
      last.current = { x: next.current.x, y: next.current.y, t: now };
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [enabled]);
}
