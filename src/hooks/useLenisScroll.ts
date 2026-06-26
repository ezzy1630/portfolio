"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFluidStore } from "@/lib/store";
import { setLenis } from "@/lib/lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Initializes Lenis smooth scroll (heavy lerp for "pushing mass" feel),
 * binds it to the GSAP ticker, and streams scroll progress + velocity
 * into the fluid store so shaders and typography can react in realtime.
 *
 * Respects prefers-reduced-motion: disables Lenis smoothing + snaps.
 */
export function useLenisScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const state = useFluidStore.getState();
    const reduce = state.reducedMotion;

    let lenis: Lenis | null = null;
    let rafId = 0;

    if (reduce) {
      // reduced motion: native scroll, no smoothing
      const onScroll = () => {
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        const progress = limit > 0 ? window.scrollY / limit : 0;
        useFluidStore.getState().set({
          scrollProgress: progress,
          scrollVelocity: 0,
          scrollDirection: 0,
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    lenis = new Lenis({
      lerp: 0.07,
      wheelMultiplier: 1,
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    setLenis(lenis);

    lenis.on("scroll", (e: { progress: number; velocity: number; direction: number }) => {
      const v = Math.abs(e.velocity || 0);
      const dir = (e.direction || 0) as 1 | -1 | 0;
      useFluidStore.getState().set({
        scrollProgress: e.progress ?? 0,
        scrollVelocity: v,
        scrollDirection: dir,
      });
      ScrollTrigger.update();
    });

    const tickerFn = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Keep ScrollTrigger in sync with Lenis-driven scroll
    const stUpdate = () => ScrollTrigger.update();
    lenis.on("scroll", stUpdate);

    // recalc on resize
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      gsap.ticker.remove(tickerFn);
      lenis?.destroy();
      setLenis(null);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);
}
